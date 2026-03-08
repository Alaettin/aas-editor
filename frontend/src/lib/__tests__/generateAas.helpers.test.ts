import { describe, it, expect, vi } from 'vitest';

// Mock dataUrl utils to avoid side effects
vi.mock('../../utils/dataUrl', () => ({ dataUrlToBase64: vi.fn(), getMimeType: vi.fn() }));

import { nullable, buildMappingContext } from '../generateAas';

describe('nullable', () => {
  it('wraps schema with anyOf including null type', () => {
    const result = nullable({ type: 'string' });
    expect(result.anyOf).toBeDefined();
    expect(result.anyOf).toContainEqual({ type: 'null' });
    expect(result.anyOf).toContainEqual({ type: 'string' });
  });

  it('result has exactly 2 entries in anyOf', () => {
    const result = nullable({ type: 'integer' });
    expect(result.anyOf).toHaveLength(2);
  });
});

describe('buildMappingContext', () => {
  const baseOpts = { provider: 'gemini' as const, model: 'gemini-2.5-flash', apiKey: 'test-key' };

  it('returns empty string for empty options (no mappingSchemas)', () => {
    expect(buildMappingContext({ ...baseOpts })).toBe('');
  });

  it('returns empty string when mappingSchemas is undefined', () => {
    expect(buildMappingContext({ ...baseOpts, mappingSchemas: undefined })).toBe('');
  });

  it('includes "Ziel-Submodel-Strukturen" when schemas provided', () => {
    const result = buildMappingContext({
      ...baseOpts,
      mappingSchemas: [{ idShort: 'TechnicalData', submodelElements: [] }],
    });
    expect(result).toContain('Ziel-Submodel-Strukturen');
    expect(result).toContain('TechnicalData');
  });

  it('includes ConceptDescriptions section when both schemas and CDs provided', () => {
    const result = buildMappingContext({
      ...baseOpts,
      mappingSchemas: [{ idShort: 'SM1' }],
      mappingConceptDescriptions: [{ id: '0173-1#02-AAB', idShort: 'Voltage' }],
    });
    expect(result).toContain('Ziel-Submodel-Strukturen');
    expect(result).toContain('ConceptDescriptions');
    expect(result).toContain('0173-1#02-AAB');
  });

  it('only includes schemas section when no CDs', () => {
    const result = buildMappingContext({
      ...baseOpts,
      mappingSchemas: [{ idShort: 'SM1' }],
    });
    expect(result).toContain('Ziel-Submodel-Strukturen');
    expect(result).not.toContain('ConceptDescriptions');
  });
});
