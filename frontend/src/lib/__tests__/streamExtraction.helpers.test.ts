import { describe, it, expect, vi } from 'vitest';

// Mock store and library dependencies before importing
vi.mock('../../store/extractionStore', () => ({ useExtractionStore: { getState: vi.fn(() => ({})) } }));
vi.mock('../../store/aiStore', () => ({ useAiStore: { getState: vi.fn(() => ({})) } }));
vi.mock('../../store/aasStore', () => ({ useAasStore: { getState: vi.fn(() => ({})) } }));
vi.mock('../extractText', () => ({ extractText: vi.fn(), extractImages: vi.fn(), isImageFile: vi.fn() }));
vi.mock('../classifyDocument', () => ({ classifyDocument: vi.fn() }));
vi.mock('../generateAas', () => ({ generateAas: vi.fn() }));
vi.mock('../postProcess', () => ({ postProcess: vi.fn() }));

import { stripValues, collectSemanticIds, normalizeExtractionJson } from '../streamExtraction';

// ─── stripValues ───

describe('stripValues', () => {
  it('sets Property value to empty string', () => {
    const result = stripValues([
      { idShort: 'Voltage', modelType: 'Property', valueType: 'xs:string', value: '230V' },
    ]);
    expect(result[0].value).toBe('');
  });

  it('sets Range min and max to empty string', () => {
    const result = stripValues([
      { idShort: 'TempRange', modelType: 'Range', valueType: 'xs:double', min: '-40', max: '85' },
    ]);
    expect(result[0].min).toBe('');
    expect(result[0].max).toBe('');
  });

  it('sets MultiLanguageProperty value to empty array', () => {
    const result = stripValues([
      { idShort: 'Desc', modelType: 'MultiLanguageProperty', value: [{ language: 'de', text: 'Hallo' }] },
    ]);
    expect(result[0].value).toEqual([]);
  });

  it('recursively strips SubmodelElementCollection nested values', () => {
    const result = stripValues([
      {
        idShort: 'General',
        modelType: 'SubmodelElementCollection',
        value: [
          { idShort: 'Weight', modelType: 'Property', valueType: 'xs:double', value: '27.7' },
        ],
      },
    ]);
    const nested = result[0].value as Record<string, unknown>[];
    expect(nested[0].value).toBe('');
  });

  it('preserves idShort, modelType, semanticId, and valueType', () => {
    const result = stripValues([
      {
        idShort: 'Voltage',
        modelType: 'Property',
        valueType: 'xs:string',
        semanticId: { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: '0173-1#02-AAB' }] },
        value: '230V',
      },
    ]);
    expect(result[0].idShort).toBe('Voltage');
    expect(result[0].modelType).toBe('Property');
    expect(result[0].valueType).toBe('xs:string');
    expect(result[0].semanticId).toBeDefined();
  });
});

// ─── collectSemanticIds ───

describe('collectSemanticIds', () => {
  it('returns empty set when no semanticId is present', () => {
    const ids = collectSemanticIds({ idShort: 'Test', submodelElements: [] });
    expect(ids.size).toBe(0);
  });

  it('collects from submodel.semanticId', () => {
    const ids = collectSemanticIds({
      semanticId: { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: '0173-1#01-ABC' }] },
      submodelElements: [],
    });
    expect(ids.has('0173-1#01-ABC')).toBe(true);
  });

  it('collects from nested elements recursively', () => {
    const ids = collectSemanticIds({
      submodelElements: [
        {
          idShort: 'Prop1',
          semanticId: { keys: [{ value: 'id-1' }] },
          value: [
            {
              idShort: 'NestedProp',
              semanticId: { keys: [{ value: 'id-2' }] },
            },
          ],
        },
      ],
    });
    expect(ids.has('id-1')).toBe(true);
    expect(ids.has('id-2')).toBe(true);
  });

  it('handles malformed/missing data gracefully', () => {
    const ids = collectSemanticIds({});
    expect(ids.size).toBe(0);

    const ids2 = collectSemanticIds({ semanticId: null, submodelElements: [null, undefined, 42] });
    expect(ids2.size).toBe(0);
  });
});

// ─── normalizeExtractionJson ───

describe('normalizeExtractionJson', () => {
  it('handles singular format { aas, submodel }', () => {
    const result = normalizeExtractionJson({
      aas: { idShort: 'MyAAS' },
      submodel: { idShort: 'TechData', submodelElements: [] },
    });
    expect(result.aas).toEqual({ idShort: 'MyAAS' });
    expect(result.submodels).toHaveLength(1);
    expect(result.submodels[0]).toEqual({ idShort: 'TechData', submodelElements: [] });
  });

  it('handles plural format { assetAdministrationShells, submodels }', () => {
    const result = normalizeExtractionJson({
      assetAdministrationShells: [{ idShort: 'AAS1' }],
      submodels: [{ idShort: 'SM1' }, { idShort: 'SM2' }],
    });
    expect(result.aas).toEqual({ idShort: 'AAS1' });
    expect(result.submodels).toHaveLength(2);
  });

  it('returns undefined aas when no AAS present', () => {
    const result = normalizeExtractionJson({
      submodel: { idShort: 'OnlySM' },
    });
    expect(result.aas).toBeUndefined();
    expect(result.submodels).toHaveLength(1);
  });

  it('returns empty submodels array when none present', () => {
    const result = normalizeExtractionJson({
      aas: { idShort: 'LonelyAAS' },
    });
    expect(result.submodels).toEqual([]);
  });

  it('handles mixed formats (singular submodel + plural submodels)', () => {
    const result = normalizeExtractionJson({
      aas: { idShort: 'Mixed' },
      submodel: { idShort: 'Single' },
      submodels: [{ idShort: 'Plural1' }],
    });
    expect(result.aas).toEqual({ idShort: 'Mixed' });
    // singular submodel comes first, then plural entries
    expect(result.submodels).toHaveLength(2);
    expect(result.submodels[0].idShort).toBe('Single');
    expect(result.submodels[1].idShort).toBe('Plural1');
  });
});
