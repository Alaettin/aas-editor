import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRepoStore } from '../repoStore';
import type { ExternalRepo } from '../repoStore';
import { supabase } from '../../lib/supabase';

const mockFrom = vi.mocked(supabase.from);

function makeRepo(overrides: Partial<ExternalRepo> = {}): ExternalRepo {
  return {
    id: 'r-1',
    name: 'Test Repo',
    base_url: 'http://example.com/api/v3.0',
    status: 'valid',
    submodel_count: 5,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('repoStore', () => {
  beforeEach(() => {
    useRepoStore.setState({ repos: [], loading: false });
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('initial state has empty repos, loading false', () => {
    const state = useRepoStore.getState();
    expect(state.repos).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('addRepo normalizes URL by stripping trailing /submodels', async () => {
    // Mock fetch for validateEndpoint
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: [] }),
    }));

    const mockInsertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const mockFetchChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [makeRepo({ base_url: 'http://example.com/api/v3.0' })], error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // First call is the insert, second is fetchRepos
      if (callCount === 1) return mockInsertChain as any;
      return mockFetchChain as any;
    });

    const result = await useRepoStore.getState().addRepo('Repo', 'http://example.com/api/v3.0/submodels');
    expect(result.error).toBeUndefined();

    // Verify the insert was called with the normalized URL (no /submodels)
    const insertArgs = mockInsertChain.insert.mock.calls[0][0];
    expect(insertArgs.base_url).toBe('http://example.com/api/v3.0');
  });

  it('addRepo normalizes URL by stripping trailing slash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: [] }),
    }));

    const mockInsertChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    const mockFetchChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockInsertChain as any;
      return mockFetchChain as any;
    });

    await useRepoStore.getState().addRepo('Repo', 'http://example.com/api/v3.0/');
    const insertArgs = mockInsertChain.insert.mock.calls[0][0];
    expect(insertArgs.base_url).toBe('http://example.com/api/v3.0');
  });

  it('addRepo rejects empty URL', async () => {
    const result = await useRepoStore.getState().addRepo('Repo', '   ');
    expect(result.error).toBeDefined();
  });

  it('addRepo detects duplicate URL', async () => {
    useRepoStore.setState({
      repos: [makeRepo({ base_url: 'http://example.com/api/v3.0' })],
    });

    const result = await useRepoStore.getState().addRepo('Dup', 'http://example.com/api/v3.0');
    expect(result.error).toContain('existiert bereits');
  });

  it('deleteRepo removes repo from array', async () => {
    useRepoStore.setState({
      repos: [makeRepo({ id: 'r-1' }), makeRepo({ id: 'r-2', name: 'Keep' })],
    });

    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    await useRepoStore.getState().deleteRepo('r-1');
    expect(useRepoStore.getState().repos).toHaveLength(1);
    expect(useRepoStore.getState().repos[0].id).toBe('r-2');
  });

  it('fetchSubmodels returns empty array when repo not found', async () => {
    const result = await useRepoStore.getState().fetchSubmodels('nonexistent');
    expect(result).toEqual([]);
  });

  it('fetchSubmodels returns submodels from valid repo', async () => {
    useRepoStore.setState({ repos: [makeRepo({ id: 'r-1' })] });

    const submodels = [{ idShort: 'sm1' }, { idShort: 'sm2' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: submodels }),
    }));

    const result = await useRepoStore.getState().fetchSubmodels('r-1');
    expect(result).toEqual(submodels);
  });

  it('fetchSubmodels returns empty array on fetch failure', async () => {
    useRepoStore.setState({ repos: [makeRepo({ id: 'r-1' })] });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await useRepoStore.getState().fetchSubmodels('r-1');
    expect(result).toEqual([]);
  });

  it('fetchRepos populates repos from supabase', async () => {
    const repos = [makeRepo({ id: 'f-1' })];
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: repos, error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    await useRepoStore.getState().fetchRepos();
    expect(useRepoStore.getState().repos).toEqual(repos);
    expect(useRepoStore.getState().loading).toBe(false);
  });
});
