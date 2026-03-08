import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { useToastStore } from '../toastStore';

describe('toastStore', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('addToast adds a toast with auto-generated id', () => {
    useToastStore.getState().addToast('Hello');
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(typeof toasts[0].id).toBe('number');
  });

  it('addToast defaults to info type', () => {
    useToastStore.getState().addToast('Info message');
    expect(useToastStore.getState().toasts[0].type).toBe('info');
  });

  it('addToast with error type', () => {
    useToastStore.getState().addToast('Error occurred', 'error');
    expect(useToastStore.getState().toasts[0].type).toBe('error');
  });

  it('addToast with success type', () => {
    useToastStore.getState().addToast('Success!', 'success');
    expect(useToastStore.getState().toasts[0].type).toBe('success');
  });

  it('removeToast removes by id', () => {
    useToastStore.getState().addToast('First');
    useToastStore.getState().addToast('Second');
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);

    useToastStore.getState().removeToast(toasts[0].id);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Second');
  });

  it('auto-removes success toast after 4s', () => {
    useToastStore.getState().addToast('Gone soon', 'success');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('auto-removes error toast after 15s', () => {
    useToastStore.getState().addToast('Error lingers', 'error');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(11000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('multiple toasts can coexist', () => {
    useToastStore.getState().addToast('First', 'info');
    useToastStore.getState().addToast('Second', 'success');
    useToastStore.getState().addToast('Third', 'error');
    expect(useToastStore.getState().toasts).toHaveLength(3);
  });
});
