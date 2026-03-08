// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineEdit } from '../ui/InlineEdit';

describe('InlineEdit', () => {
  it('renders value in display mode', () => {
    render(<InlineEdit value="TestValue" onSave={vi.fn()} />);
    expect(screen.getByText('TestValue')).toBeDefined();
  });

  it('shows placeholder when value is empty', () => {
    render(<InlineEdit value="" onSave={vi.fn()} placeholder="Enter name" />);
    expect(screen.getByText('Enter name')).toBeDefined();
  });

  it('enters edit mode on double-click', () => {
    render(<InlineEdit value="Test" onSave={vi.fn()} />);
    fireEvent.doubleClick(screen.getByText('Test'));
    const input = screen.getByDisplayValue('Test');
    expect(input).toBeDefined();
  });

  it('commits on Enter key', () => {
    const onSave = vi.fn();
    render(<InlineEdit value="Test" onSave={onSave} />);
    fireEvent.doubleClick(screen.getByText('Test'));
    const input = screen.getByDisplayValue('Test');
    fireEvent.change(input, { target: { value: 'NewValue' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('NewValue');
  });

  it('cancels on Escape key', () => {
    const onSave = vi.fn();
    render(<InlineEdit value="Original" onSave={onSave} />);
    fireEvent.doubleClick(screen.getByText('Original'));
    const input = screen.getByDisplayValue('Original');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeDefined();
  });

  it('rejects invalid input via custom validation', () => {
    const onSave = vi.fn();
    const validate = (v: string) => v.length >= 3;
    render(<InlineEdit value="Ab" onSave={onSave} validate={validate} />);
    fireEvent.doubleClick(screen.getByText('Ab'));
    const input = screen.getByDisplayValue('Ab');
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('uses default idShort regex validation', () => {
    const onSave = vi.fn();
    render(<InlineEdit value="Valid" onSave={onSave} />);
    fireEvent.doubleClick(screen.getByText('Valid'));
    const input = screen.getByDisplayValue('Valid');
    // Invalid: starts with number
    fireEvent.change(input, { target: { value: '123invalid' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('commits on blur', () => {
    const onSave = vi.fn();
    render(<InlineEdit value="Test" onSave={onSave} />);
    fireEvent.doubleClick(screen.getByText('Test'));
    const input = screen.getByDisplayValue('Test');
    fireEvent.change(input, { target: { value: 'Blurred' } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith('Blurred');
  });
});
