import { describe, it, expect } from 'vitest';
import { generateId, generateUrn } from '../ids';

describe('generateId', () => {
  it('returns a valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('generateUrn', () => {
  it('returns URN with correct prefix format', () => {
    const urn = generateUrn('shell');
    expect(urn).toMatch(/^urn:aas-editor:shell:[0-9a-f-]+$/);
  });

  it('includes the given prefix', () => {
    const urn = generateUrn('submodel');
    expect(urn).toContain('urn:aas-editor:submodel:');
  });

  it('generates unique URNs', () => {
    const urns = new Set(Array.from({ length: 50 }, () => generateUrn('test')));
    expect(urns.size).toBe(50);
  });
});
