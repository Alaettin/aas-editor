import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAasStore } from './aasStore';
import { useApiStore } from './apiStore';
import type { Node, Edge } from '@xyflow/react';
import type {
  AssetAdministrationShell,
  Submodel,
  ConceptDescription,
} from '../types/aas';

export interface CanvasData {
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
  nodes: Node[];
  edges: Edge[];
  showConceptDescriptions: boolean;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  saving: boolean;
  loading: boolean;
  isDirty: boolean;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  createProject: (name?: string) => Promise<string | null>;
  loadProject: (id: string) => Promise<boolean>;
  saveProject: (id?: string) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  renameProject: (id: string, name: string) => Promise<boolean>;
  markDirty: () => void;
  markClean: () => void;
}

// Strip React Flow runtime fields from nodes before saving
function serializeNodes(nodes: Node[]): Node[] {
  return nodes.map(({ id, type, position, data, width, height, style }) => ({
    id,
    type,
    position,
    data,
    ...(width != null && { width }),
    ...(height != null && { height }),
    ...(style != null && { style }),
  }) as Node);
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  projects: [],
  currentProjectId: null,
  saving: false,
  loading: false,
  isDirty: false,

  fetchProjects: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, created_at, updated_at')
      .eq('user_id', user?.id ?? '')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Projekte laden fehlgeschlagen:', error.message);
      set({ loading: false });
      return;
    }
    set({ projects: data ?? [], loading: false });
  },

  createProject: async (name = 'Neues Projekt') => {
    name = name.slice(0, 100);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Ensure unique name
    const existing = get().projects.map((p) => p.name);
    if (existing.includes(name)) {
      let i = 2;
      while (existing.includes(`${name} (${i})`)) i++;
      name = `${name} (${i})`;
    }

    const canvasData: CanvasData = {
      shells: [],
      submodels: [],
      conceptDescriptions: [],
      nodes: [],
      edges: [],
      showConceptDescriptions: false,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name, canvas_data: canvasData })
      .select('id')
      .single();

    if (error) {
      console.error('Projekt erstellen fehlgeschlagen:', error.message);
      return null;
    }

    return data.id;
  },

  loadProject: async (id) => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id ?? '')
      .single();

    if (error || !data) {
      console.error('Projekt laden fehlgeschlagen:', error?.message);
      set({ loading: false });
      return false;
    }

    const canvas = data.canvas_data as CanvasData;
    useAasStore.getState().loadCanvas(canvas);
    set({ currentProjectId: id, isDirty: false, loading: false });
    return true;
  },

  saveProject: async (id) => {
    const projectId = id ?? get().currentProjectId;
    if (!projectId) return false;

    set({ saving: true });
    const state = useAasStore.getState();

    const canvasData: CanvasData = {
      shells: state.shells,
      submodels: state.submodels,
      conceptDescriptions: state.conceptDescriptions,
      nodes: serializeNodes(state.nodes),
      edges: state.edges,
      showConceptDescriptions: state.showConceptDescriptions,
    };

    const { error } = await supabase
      .from('projects')
      .update({ canvas_data: canvasData })
      .eq('id', projectId);

    if (error) {
      console.error('Speichern fehlgeschlagen:', error.message);
      set({ saving: false });
      return false;
    }

    // Unpublish shells that were removed from canvas
    const { shells: publishedShells, unpublishShell } = useApiStore.getState();
    const currentShellIds = new Set(state.shells.map((s) => s.id));
    const orphanedShells = publishedShells.filter(
      (ps) => ps.project_id === projectId && !currentShellIds.has(ps.shell_id),
    );
    for (const orphan of orphanedShells) {
      await unpublishShell(orphan.shell_id);
    }

    set({ saving: false, isDirty: false });
    return true;
  },

  deleteProject: async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Löschen fehlgeschlagen:', error.message);
      return false;
    }
    set({ projects: get().projects.filter((p) => p.id !== id) });
    return true;
  },

  renameProject: async (id, name) => {
    name = name.slice(0, 100);

    // Reject if another project has the same name
    if (get().projects.some((p) => p.id !== id && p.name === name)) {
      return false;
    }

    const { error } = await supabase
      .from('projects')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Umbenennen fehlgeschlagen:', error.message);
      return false;
    }

    set({
      projects: get().projects.map((p) => (p.id === id ? { ...p, name } : p)),
    });
    return true;
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}));
