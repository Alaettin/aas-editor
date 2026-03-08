import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { supabase } from '../../lib/supabase';

// Stub sessionStorage for node environment
if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      loading: true,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('initial state has null user, null session, loading true', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.loading).toBe(true);
  });

  it('clearError sets error to null', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('signIn success returns null error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: 'u1' } as any, session: { access_token: 'tok' } as any },
      error: null,
    } as any);

    const result = await useAuthStore.getState().signIn('test@test.com', 'password123');
    expect(result.error).toBeNull();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('signIn failure sets error in store and returns error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    } as any);

    const result = await useAuthStore.getState().signIn('test@test.com', 'wrong');
    expect(result.error).toBe('Invalid credentials');
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
  });

  it('signUp success returns null error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: 'u1' } as any, session: null },
      error: null,
    } as any);

    const result = await useAuthStore.getState().signUp('new@test.com', 'password123');
    expect(result.error).toBeNull();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('signUp failure sets error in store and returns error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email already registered' },
    } as any);

    const result = await useAuthStore.getState().signUp('existing@test.com', 'password123');
    expect(result.error).toBe('Email already registered');
    expect(useAuthStore.getState().error).toBe('Email already registered');
  });

  it('signOut clears user and session', async () => {
    useAuthStore.setState({
      user: { id: 'u1' } as any,
      session: { access_token: 'tok' } as any,
      loading: false,
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any);

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('signIn clears previous error before attempting', async () => {
    useAuthStore.setState({ error: 'Old error' });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: 'u1' } as any, session: { access_token: 'tok' } as any },
      error: null,
    } as any);

    await useAuthStore.getState().signIn('test@test.com', 'password123');
    expect(useAuthStore.getState().error).toBeNull();
  });
});
