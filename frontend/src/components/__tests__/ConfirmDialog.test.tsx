// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Test Title"
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Message')).toBeDefined();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="Delete"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Löschen'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('uses custom button labels', () => {
    render(
      <ConfirmDialog
        title="T"
        message="M"
        confirmLabel="Ja"
        cancelLabel="Nein"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Ja')).toBeDefined();
    expect(screen.getByText('Nein')).toBeDefined();
  });
});
