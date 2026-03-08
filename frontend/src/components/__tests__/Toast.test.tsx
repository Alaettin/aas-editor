// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../ui/Toast';
import { useToastStore } from '../../store/toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('ToastContainer', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders toast messages', () => {
    useToastStore.setState({
      toasts: [{ id: 1, message: 'Success!', type: 'success' }],
    });
    render(<ToastContainer />);
    expect(screen.getByText('Success!')).toBeDefined();
  });

  it('renders multiple toasts', () => {
    useToastStore.setState({
      toasts: [
        { id: 1, message: 'Toast 1', type: 'info' },
        { id: 2, message: 'Toast 2', type: 'error' },
      ],
    });
    render(<ToastContainer />);
    expect(screen.getByText('Toast 1')).toBeDefined();
    expect(screen.getByText('Toast 2')).toBeDefined();
  });

  it('removes toast when close button clicked', () => {
    const removeToast = vi.fn();
    useToastStore.setState({
      toasts: [{ id: 42, message: 'Dismiss me', type: 'info' }],
      removeToast,
    });
    render(<ToastContainer />);
    const buttons = screen.getAllByRole('button');
    // Last button is the close button (X)
    fireEvent.click(buttons[buttons.length - 1]);
    expect(removeToast).toHaveBeenCalledWith(42);
  });
});
