import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { shellToJsonable, submodelToJsonable } from '../utils/exportAas';
import type { AssetAdministrationShell, Submodel } from '../types/aas';

export interface PublishedShell {
  id: string;
  project_id: string;
  shell_id: string;
  shell_json: Record<string, unknown>;
  created_at: string;
}

export interface PublishedSubmodel {
  id: string;
  project_id: string;
  submodel_id: string;
  sm_json: Record<string, unknown>;
  created_at: string;
}

interface ApiState {
  shells: PublishedShell[];
  submodels: PublishedSubmodel[];
  loading: boolean;
}

interface ApiActions {
  fetchPublished: () => Promise<void>;
  publishShell: (
    projectId: string,
    shell: AssetAdministrationShell,
    submodels: Submodel[],
  ) => Promise<{ error?: string }>;
  unpublishShell: (shellId: string) => Promise<void>;
}

export const useApiStore = create<ApiState & ApiActions>((set, get) => ({
  shells: [],
  submodels: [],
  loading: false,

  fetchPublished: async () => {
    set({ loading: true });

    const [shellsRes, submodelsRes] = await Promise.all([
      supabase.from('api_shells').select('*').order('created_at', { ascending: false }),
      supabase.from('api_submodels').select('*').order('created_at', { ascending: false }),
    ]);

    set({
      shells: (shellsRes.data ?? []) as PublishedShell[],
      submodels: (submodelsRes.data ?? []) as PublishedSubmodel[],
      loading: false,
    });
  },

  publishShell: async (projectId, shell, relatedSubmodels) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Nicht eingeloggt' };

    // Check for duplicate shell ID
    const existingShells = get().shells;
    if (existingShells.some((s) => s.shell_id === shell.id)) {
      return { error: `AAS-ID "${shell.id}" ist bereits publiziert` };
    }

    // Check for duplicate submodel IDs
    const existingSmIds = new Set(get().submodels.map((s) => s.submodel_id));
    for (const sm of relatedSubmodels) {
      if (existingSmIds.has(sm.id)) {
        return { error: `Submodel-ID "${sm.id}" ist bereits publiziert` };
      }
    }

    // Convert to AAS V3 JSON
    const shellJson = shellToJsonable(shell);
    const smInserts = relatedSubmodels.map((sm) => ({
      user_id: user.id,
      project_id: projectId,
      submodel_id: sm.id,
      sm_json: submodelToJsonable(sm),
    }));

    // Insert shell
    const { error: shellError } = await supabase
      .from('api_shells')
      .insert({
        user_id: user.id,
        project_id: projectId,
        shell_id: shell.id,
        shell_json: shellJson,
      });

    if (shellError) {
      if (shellError.code === '23505') {
        return { error: `AAS-ID "${shell.id}" ist bereits publiziert` };
      }
      return { error: shellError.message };
    }

    // Insert submodels
    if (smInserts.length > 0) {
      const { error: smError } = await supabase
        .from('api_submodels')
        .insert(smInserts);

      if (smError) {
        // Rollback shell insert
        await supabase.from('api_shells').delete().eq('shell_id', shell.id);
        if (smError.code === '23505') {
          return { error: 'Eine der Submodel-IDs ist bereits publiziert' };
        }
        return { error: smError.message };
      }
    }

    await get().fetchPublished();
    return {};
  },

  unpublishShell: async (shellId) => {
    // Find related submodel IDs from the shell's submodel references
    const shell = get().shells.find((s) => s.shell_id === shellId);
    if (!shell) return;

    const shellJson = shell.shell_json as { submodels?: { keys?: { value?: string }[] }[] };
    const smIds = (shellJson.submodels ?? [])
      .map((ref) => ref.keys?.[0]?.value)
      .filter(Boolean) as string[];

    // Delete submodels first, then shell
    if (smIds.length > 0) {
      await supabase.from('api_submodels').delete().in('submodel_id', smIds);
    }
    await supabase.from('api_shells').delete().eq('shell_id', shellId);

    await get().fetchPublished();
  },
}));
