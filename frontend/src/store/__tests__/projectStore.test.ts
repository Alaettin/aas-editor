import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../projectStore';
import type { Project } from '../projectStore';
import { supabase } from '../../lib/supabase';

const mockFrom = vi.mocked(supabase.from);

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    name: 'Test Project',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      currentProjectId: null,
      saving: false,
      loading: false,
      isDirty: false,
    });
    vi.clearAllMocks();
  });

  it('initial state has empty projects, null currentProjectId, isDirty false', () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProjectId).toBeNull();
    expect(state.isDirty).toBe(false);
  });

  it('markDirty sets isDirty to true', () => {
    useProjectStore.getState().markDirty();
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  it('markClean sets isDirty to false', () => {
    useProjectStore.setState({ isDirty: true });
    useProjectStore.getState().markClean();
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it('createProject generates unique name when duplicate exists', async () => {
    useProjectStore.setState({
      projects: [makeProject({ name: 'Neues Projekt' })],
    });

    // Mock supabase chain for insert
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    const id = await useProjectStore.getState().createProject('Neues Projekt');

    expect(id).toBe('new-id');
    // The insert call should have "Neues Projekt (2)" as the name
    const insertArgs = mockChain.insert.mock.calls[0][0];
    expect(insertArgs.name).toBe('Neues Projekt (2)');
  });

  it('createProject truncates name to 100 chars', async () => {
    const longName = 'A'.repeat(150);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    await useProjectStore.getState().createProject(longName);

    const insertArgs = mockChain.insert.mock.calls[0][0];
    expect(insertArgs.name.length).toBeLessThanOrEqual(100);
  });

  it('deleteProject removes from projects array', async () => {
    const project = makeProject({ id: 'del-1' });
    useProjectStore.setState({ projects: [project, makeProject({ id: 'keep-1' })] });

    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    const result = await useProjectStore.getState().deleteProject('del-1');
    expect(result).toBe(true);
    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().projects[0].id).toBe('keep-1');
  });

  it('renameProject rejects duplicate name', async () => {
    useProjectStore.setState({
      projects: [
        makeProject({ id: 'p-1', name: 'Alpha' }),
        makeProject({ id: 'p-2', name: 'Beta' }),
      ],
    });

    const result = await useProjectStore.getState().renameProject('p-1', 'Beta');
    expect(result).toBe(false);
  });

  it('renameProject updates name in projects array', async () => {
    useProjectStore.setState({
      projects: [makeProject({ id: 'p-1', name: 'Old Name' })],
    });

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    const result = await useProjectStore.getState().renameProject('p-1', 'New Name');
    expect(result).toBe(true);
    expect(useProjectStore.getState().projects[0].name).toBe('New Name');
  });

  it('fetchProjects populates projects from supabase', async () => {
    const projects = [makeProject({ id: 'f-1', name: 'Fetched' })];
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: projects, error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    await useProjectStore.getState().fetchProjects();
    expect(useProjectStore.getState().projects).toEqual(projects);
    expect(useProjectStore.getState().loading).toBe(false);
  });

  it('fetchProjects handles error gracefully', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    await useProjectStore.getState().fetchProjects();
    expect(useProjectStore.getState().projects).toEqual([]);
    expect(useProjectStore.getState().loading).toBe(false);
  });

  it('deleteProject returns false on supabase error', async () => {
    useProjectStore.setState({ projects: [makeProject({ id: 'err-1' })] });

    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    const result = await useProjectStore.getState().deleteProject('err-1');
    expect(result).toBe(false);
    // Project should still be in the array
    expect(useProjectStore.getState().projects).toHaveLength(1);
  });

  it('createProject returns null when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as any);

    const id = await useProjectStore.getState().createProject();
    expect(id).toBeNull();
  });
});
