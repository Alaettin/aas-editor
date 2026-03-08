import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ExternalRepo {
  id: string;
  name: string;
  base_url: string;
  status: 'valid' | 'invalid' | 'unknown';
  submodel_count: number;
  created_at: string;
}

interface RepoState {
  repos: ExternalRepo[];
  loading: boolean;
}

interface RepoActions {
  fetchRepos: () => Promise<void>;
  addRepo: (name: string, baseUrl: string) => Promise<{ error?: string }>;
  deleteRepo: (id: string) => Promise<void>;
  revalidateRepo: (id: string) => Promise<void>;
  fetchSubmodels: (repoId: string) => Promise<Record<string, unknown>[]>;
  fetchConceptDescriptions: (repoId: string) => Promise<Record<string, unknown>[]>;
}

function normalizeUrl(url: string): string {
  let u = url.trim();
  // Remove trailing /submodels or /shells paths
  u = u.replace(/\/(submodels|shells)\/?$/i, '');
  // Remove trailing slash
  u = u.replace(/\/+$/, '');
  return u;
}

/** Block private/internal URLs to prevent SSRF */
function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    // Block localhost, private IPs, and cloud metadata endpoints
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return false;
    if (host === '169.254.169.254') return false;
    if (host.startsWith('10.')) return false;
    if (host.startsWith('192.168.')) return false;
    if (host.startsWith('172.')) {
      const second = parseInt(host.split('.')[1], 10);
      if (second >= 16 && second <= 31) return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function validateEndpoint(baseUrl: string): Promise<{ valid: boolean; count: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${baseUrl}/submodels`, { signal: controller.signal });
    if (!res.ok) return { valid: false, count: 0 };

    const json = await res.json();
    // AAS V3 format: { result: [...], paging_metadata: {...} }
    if (json && Array.isArray(json.result)) {
      return { valid: true, count: json.result.length };
    }
    return { valid: false, count: 0 };
  } catch {
    return { valid: false, count: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

export const useRepoStore = create<RepoState & RepoActions>((set, get) => ({
  repos: [],
  loading: false,

  fetchRepos: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('external_repositories')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false });

    set({ repos: (data ?? []) as ExternalRepo[], loading: false });
  },

  addRepo: async (name, baseUrl) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Nicht eingeloggt' };

    const normalizedUrl = normalizeUrl(baseUrl);
    if (!normalizedUrl) return { error: 'URL darf nicht leer sein' };
    if (!isAllowedUrl(normalizedUrl)) return { error: 'Ungueltige oder nicht erlaubte URL' };

    // Duplicate check
    if (get().repos.some((r) => r.base_url === normalizedUrl)) {
      return { error: 'Repository mit dieser URL existiert bereits' };
    }

    // Validate
    const { valid, count } = await validateEndpoint(normalizedUrl);

    const { error } = await supabase.from('external_repositories').insert({
      user_id: user.id,
      name: name.trim(),
      base_url: normalizedUrl,
      status: valid ? 'valid' : 'invalid',
      submodel_count: count,
    });

    if (error) return { error: error.message };

    await get().fetchRepos();
    return {};
  },

  deleteRepo: async (id) => {
    await supabase.from('external_repositories').delete().eq('id', id);
    set({ repos: get().repos.filter((r) => r.id !== id) });
  },

  fetchSubmodels: async (repoId) => {
    const repo = get().repos.find((r) => r.id === repoId);
    if (!repo) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${repo.base_url}/submodels`, { signal: controller.signal });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.result) ? json.result : [];
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  },

  fetchConceptDescriptions: async (repoId) => {
    const repo = get().repos.find((r) => r.id === repoId);
    if (!repo) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${repo.base_url}/concept-descriptions`, { signal: controller.signal });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.result) ? json.result : [];
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  },

  revalidateRepo: async (id) => {
    const repo = get().repos.find((r) => r.id === id);
    if (!repo) return;

    const { valid, count } = await validateEndpoint(repo.base_url);
    const status = valid ? 'valid' : 'invalid';

    await supabase
      .from('external_repositories')
      .update({ status, submodel_count: count })
      .eq('id', id);

    set({
      repos: get().repos.map((r) =>
        r.id === id ? { ...r, status, submodel_count: count } : r,
      ),
    });
  },
}));
