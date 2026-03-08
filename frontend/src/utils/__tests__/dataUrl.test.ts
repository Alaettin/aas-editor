import { describe, it, expect } from 'vitest';
import { dataUrlToBase64, getMimeType } from '../../utils/dataUrl';

describe('dataUrlToBase64', () => {
  it('extracts base64 from a data URL', () => {
    expect(dataUrlToBase64('data:image/png;base64,abc123')).toBe('abc123');
  });

  it('returns input when no comma found', () => {
    expect(dataUrlToBase64('no-comma-here')).toBe('no-comma-here');
  });

  it('handles empty string', () => {
    expect(dataUrlToBase64('')).toBe('');
  });
});

describe('getMimeType', () => {
  it('extracts image/png from data URL', () => {
    expect(getMimeType('data:image/png;base64,abc123')).toBe('image/png');
  });

  it('extracts image/jpeg from data URL', () => {
    expect(getMimeType('data:image/jpeg;base64,xyz')).toBe('image/jpeg');
  });

  it('returns image/png as fallback when no match', () => {
    expect(getMimeType('not-a-data-url')).toBe('image/png');
  });
});
