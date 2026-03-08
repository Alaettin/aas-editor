import { describe, it, expect } from 'vitest';
import {
  postProcess,
  countProperties,
  validateIdShorts,
  deduplicateIdShorts,
  fixValueTypes,
  inferValueType,
  checkHallucinations,
  cleanupStructure,
} from '../postProcess';
import type { Correction } from '../../store/extractionStore';

// Helper to create a minimal SubmodelElement-like object
function prop(idShort: string, value?: string, valueType?: string) {
  return { idShort, modelType: 'Property', value, valueType } as Record<string, unknown>;
}

function collection(idShort: string, value: Record<string, unknown>[]) {
  return { idShort, modelType: 'SubmodelElementCollection', value } as Record<string, unknown>;
}

function range(idShort: string, min?: string, max?: string, valueType?: string) {
  return { idShort, modelType: 'Range', min, max, valueType } as Record<string, unknown>;
}

// ─── postProcess (end-to-end) ───

describe('postProcess', () => {
  it('processes valid JSON without corrections', () => {
    const json = JSON.stringify({
      submodel: {
        idShort: 'TechnicalData',
        id: 'urn:example:sm:1',
        submodelElements: [
          { idShort: 'Weight', modelType: 'Property', valueType: 'xs:double', value: '27.7' },
        ],
      },
    });
    const result = postProcess(json, 'Weight 27.7 g');
    expect(result.metadata.corrections).toHaveLength(0);
    expect(result.metadata.extractedProperties).toBe(1);
    expect(result.metadata.hallucinationSuspects).toBe(0);
  });

  it('repairs malformed JSON via jsonrepair', () => {
    // Trailing comma is invalid JSON but repairable
    const json = '{"submodel":{"idShort":"SM","submodelElements":[{"idShort":"A","modelType":"Property","value":"1",}]}}';
    const result = postProcess(json, '');
    expect(result.metadata.corrections.some((c) => c.type === 'json_repair')).toBe(true);
  });

  it('throws on completely invalid JSON', () => {
    expect(() => postProcess('not json at all {{', '')).toThrow('AI-Antwort ist kein gueltiges JSON');
  });

  it('handles missing submodelElements gracefully', () => {
    const json = JSON.stringify({ submodel: { idShort: 'SM' } });
    const result = postProcess(json, '');
    expect(result.metadata.extractedProperties).toBe(0);
  });

  it('skips hallucination check when pdfText is empty', () => {
    const json = JSON.stringify({
      submodel: {
        idShort: 'SM',
        submodelElements: [
          { idShort: 'Phantom', modelType: 'Property', valueType: 'xs:string', value: 'does_not_exist_in_doc' },
        ],
      },
    });
    const result = postProcess(json, '');
    expect(result.metadata.hallucinationSuspects).toBe(0);
  });

  it('merges AI metadata with corrections', () => {
    const json = JSON.stringify({
      submodel: { idShort: 'SM', submodelElements: [] },
      metadata: { extractedProperties: 5, confidence: 0.9, warnings: ['AI warning'], skippedItems: ['item1'] },
    });
    const result = postProcess(json, '');
    expect(result.metadata.extractedProperties).toBe(5);
    expect(result.metadata.confidence).toBe(0.9);
    expect(result.metadata.warnings).toContain('AI warning');
    expect(result.metadata.skippedItems).toContain('item1');
  });
});

// ─── countProperties ───

describe('countProperties', () => {
  it('returns 0 for empty array', () => {
    expect(countProperties([])).toBe(0);
  });

  it('counts Property elements', () => {
    const elems = [prop('A', '1'), prop('B', '2')] as any[];
    expect(countProperties(elems)).toBe(2);
  });

  it('counts MultiLanguageProperty and Range', () => {
    const elems = [
      { idShort: 'Name', modelType: 'MultiLanguageProperty' },
      { idShort: 'Temp', modelType: 'Range' },
    ] as any[];
    expect(countProperties(elems)).toBe(2);
  });

  it('counts nested properties in collections', () => {
    const elems = [
      collection('Group', [prop('A'), prop('B')]),
    ] as any[];
    expect(countProperties(elems)).toBe(2);
  });

  it('ignores non-qualifying types', () => {
    const elems = [
      { idShort: 'Op', modelType: 'Operation' },
      { idShort: 'Cap', modelType: 'Capability' },
    ] as any[];
    expect(countProperties(elems)).toBe(0);
  });

  it('counts properties in statements', () => {
    const elems = [
      { idShort: 'Entity', modelType: 'Entity', statements: [prop('A'), prop('B')] },
    ] as any[];
    expect(countProperties(elems)).toBe(2);
  });
});

// ─── validateIdShorts ───

describe('validateIdShorts', () => {
  it('does not modify valid CamelCase idShorts', () => {
    const elems = [prop('OperatingVoltage')] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(elems[0].idShort).toBe('OperatingVoltage');
    expect(corrections).toHaveLength(0);
  });

  it('replaces special characters with underscores', () => {
    const elems = [prop('Gewicht [kg]')] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(elems[0].idShort).toBe('Gewicht__kg_');
    expect(corrections).toHaveLength(1);
  });

  it('prefixes numeric-starting idShorts with X', () => {
    const elems = [prop('123abc')] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(elems[0].idShort).toMatch(/^X/);
  });

  it('truncates idShorts longer than 64 characters', () => {
    const longId = 'A'.repeat(100);
    const elems = [prop(longId)] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(elems[0].idShort.length).toBe(64);
  });

  it('fixes reserved words by appending _1', () => {
    // Note: RESERVED_WORDS Set uses mixed-case but check uses .toLowerCase(),
    // so only lowercase entries ('value', 'id') actually match
    const elems = [prop('value'), prop('Value'), prop('id'), prop('ID')] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(elems[0].idShort).toBe('value_1'); // 'value'.toLowerCase() === 'value' ✓
    expect(elems[1].idShort).toBe('Value_1'); // 'Value'.toLowerCase() === 'value' ✓
    expect(elems[2].idShort).toBe('id_1');    // 'id'.toLowerCase() === 'id' ✓
    expect(elems[3].idShort).toBe('ID_1');    // 'ID'.toLowerCase() === 'id' ✓
  });

  it('skips elements without idShort', () => {
    const elems = [{ modelType: 'Property', value: '1' }] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(corrections).toHaveLength(0);
  });

  it('recurses into nested value arrays', () => {
    const elems = [collection('Group', [prop('value')])] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect((elems[0].value as any[])[0].idShort).toBe('value_1');
  });

  it('recurses into statements', () => {
    const elems = [{ idShort: 'Entity', modelType: 'Entity', statements: [prop('id')] }] as any[];
    const corrections: Correction[] = [];
    validateIdShorts(elems, corrections);
    expect(elems[0].statements[0].idShort).toBe('id_1');
  });
});

// ─── deduplicateIdShorts ───

describe('deduplicateIdShorts', () => {
  it('does not rename unique idShorts', () => {
    const elems = [prop('A'), prop('B'), prop('C')] as any[];
    const corrections: Correction[] = [];
    deduplicateIdShorts(elems, corrections);
    expect(elems.map((e: any) => e.idShort)).toEqual(['A', 'B', 'C']);
    expect(corrections).toHaveLength(0);
  });

  it('renames duplicate idShorts with suffix', () => {
    const elems = [prop('Weight'), prop('Weight'), prop('Weight')] as any[];
    const corrections: Correction[] = [];
    deduplicateIdShorts(elems, corrections);
    expect(elems.map((e: any) => e.idShort)).toEqual(['Weight', 'Weight_2', 'Weight_3']);
    expect(corrections).toHaveLength(2);
  });

  it('recurses into SubmodelElementCollection', () => {
    const inner = [prop('X'), prop('X')] as any[];
    const elems = [collection('Group', inner)] as any[];
    const corrections: Correction[] = [];
    deduplicateIdShorts(elems, corrections);
    expect(inner.map((e: any) => e.idShort)).toEqual(['X', 'X_2']);
  });

  it('does not recurse into non-collection types', () => {
    const inner = [prop('X'), prop('X')] as any[];
    const elems = [{ idShort: 'List', modelType: 'SubmodelElementList', value: inner }] as any[];
    const corrections: Correction[] = [];
    deduplicateIdShorts(elems, corrections);
    // Should NOT recurse into SubmodelElementList
    expect(inner.map((e: any) => e.idShort)).toEqual(['X', 'X']);
  });
});

// ─── fixValueTypes ───

describe('fixValueTypes', () => {
  it('does not modify valid valueTypes', () => {
    const elems = [prop('A', '42', 'xs:integer')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].valueType).toBe('xs:integer');
    expect(corrections).toHaveLength(0);
  });

  it('infers valueType when missing', () => {
    const elems = [prop('A', '42')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].valueType).toBe('xs:integer');
  });

  it('fixes invalid valueType', () => {
    const elems = [prop('A', 'hello', 'string')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].valueType).toBe('xs:string');
    expect(corrections.some((c) => c.type === 'valueType_fix')).toBe(true);
  });

  it('normalizes German boolean "ja" to "true"', () => {
    const elems = [prop('Flag', 'ja', 'xs:boolean')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].value).toBe('true');
  });

  it('normalizes "nein" to "false"', () => {
    const elems = [prop('Flag', 'Nein', 'xs:boolean')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].value).toBe('false');
  });

  it('normalizes "1" and "0" for booleans', () => {
    const trueElem = prop('A', '1', 'xs:boolean');
    const falseElem = prop('B', '0', 'xs:boolean');
    const elems = [trueElem, falseElem] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(trueElem.value).toBe('true');
    expect(falseElem.value).toBe('false');
  });

  it('defaults Range valueType to xs:double', () => {
    const elems = [range('Temp', '0', '100')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].valueType).toBe('xs:double');
  });

  it('does not override valid Range valueType', () => {
    const elems = [range('Temp', '0', '100', 'xs:integer')] as any[];
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(elems[0].valueType).toBe('xs:integer');
  });

  it('recurses into nested collections', () => {
    const inner = [prop('Inner', '3.14')] as any[];
    const elems = [collection('Group', inner)] as any[];
    // Need to add idShort to inner items for recurse check
    (inner[0] as any).idShort = 'Inner';
    const corrections: Correction[] = [];
    fixValueTypes(elems, corrections);
    expect(inner[0].valueType).toBe('xs:double');
  });
});

// ─── inferValueType ───

describe('inferValueType', () => {
  it('returns xs:string for undefined', () => {
    expect(inferValueType(undefined)).toBe('xs:string');
  });

  it('returns xs:string for empty string', () => {
    expect(inferValueType('')).toBe('xs:string');
  });

  it('returns xs:boolean for "true"', () => {
    expect(inferValueType('true')).toBe('xs:boolean');
  });

  it('returns xs:boolean for "false"', () => {
    expect(inferValueType('false')).toBe('xs:boolean');
  });

  it('returns xs:integer for whole numbers', () => {
    expect(inferValueType('42')).toBe('xs:integer');
    expect(inferValueType('-7')).toBe('xs:integer');
  });

  it('returns xs:double for decimal with dot', () => {
    expect(inferValueType('3.14')).toBe('xs:double');
    expect(inferValueType('-0.5')).toBe('xs:double');
  });

  it('returns xs:double for European comma format', () => {
    expect(inferValueType('1,5')).toBe('xs:double');
  });

  it('returns xs:string for general text', () => {
    expect(inferValueType('hello world')).toBe('xs:string');
  });

  it('returns xs:string for mixed alphanumeric', () => {
    expect(inferValueType('27.7 g')).toBe('xs:string');
  });
});

// ─── checkHallucinations ───

describe('checkHallucinations', () => {
  it('returns 0 when values are found in PDF', () => {
    const elems = [prop('Weight', '27.7')] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'Weight 27.7 g', warnings)).toBe(0);
    expect(warnings).toHaveLength(0);
  });

  it('detects values not in PDF', () => {
    const elems = [prop('Brand', 'NonexistentBrand')] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'This document mentions Bosch only', warnings)).toBe(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('NonexistentBrand');
  });

  it('skips short values (< 3 chars)', () => {
    const elems = [prop('Code', 'AB')] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'no match here', warnings)).toBe(0);
  });

  it('skips boolean values', () => {
    const elems = [prop('Flag', 'true')] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'no match here', warnings)).toBe(0);
  });

  it('handles numeric values with unit separation', () => {
    const elems = [prop('Weight', '100')] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'Weight: 100 g', warnings)).toBe(0);
  });

  it('case-insensitive matching', () => {
    const elems = [prop('Name', 'BOSCH')] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'Made by bosch', warnings)).toBe(0);
  });

  it('recurses into SubmodelElementCollection', () => {
    const inner = [prop('Hidden', 'Phantom123')] as any[];
    const elems = [collection('Group', inner)] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, 'no matching text', warnings)).toBe(1);
  });

  it('only checks Property elements', () => {
    const elems = [
      { idShort: 'Group', modelType: 'SubmodelElementCollection', value: [] },
    ] as any[];
    const warnings: string[] = [];
    expect(checkHallucinations(elems, '', warnings)).toBe(0);
  });
});

// ─── cleanupStructure ───

describe('cleanupStructure', () => {
  it('removes empty SubmodelElementCollections', () => {
    const elems = [
      collection('Empty', []),
      prop('Keep', '1'),
    ] as any[];
    const corrections: Correction[] = [];
    cleanupStructure(elems, corrections);
    expect(elems).toHaveLength(1);
    expect(elems[0].idShort).toBe('Keep');
    expect(corrections.some((c) => c.type === 'remove_empty')).toBe(true);
  });

  it('keeps single-element collections', () => {
    const elems = [
      collection('Single', [prop('A')]),
    ] as any[];
    const corrections: Correction[] = [];
    cleanupStructure(elems, corrections);
    expect(elems).toHaveLength(1);
    expect(elems[0].idShort).toBe('Single');
  });

  it('keeps multi-element collections', () => {
    const elems = [
      collection('Multi', [prop('A'), prop('B')]),
    ] as any[];
    const corrections: Correction[] = [];
    cleanupStructure(elems, corrections);
    expect(elems).toHaveLength(1);
  });

  it('recursively removes nested empty collections', () => {
    const elems = [
      collection('Outer', [
        collection('Inner', []),
        prop('Keep'),
      ]),
    ] as any[];
    const corrections: Correction[] = [];
    cleanupStructure(elems, corrections);
    expect(elems).toHaveLength(1);
    expect((elems[0].value as any[]).length).toBe(1);
    expect((elems[0].value as any[])[0].idShort).toBe('Keep');
  });

  it('does nothing when no empty collections exist', () => {
    const elems = [prop('A'), prop('B')] as any[];
    const corrections: Correction[] = [];
    cleanupStructure(elems, corrections);
    expect(elems).toHaveLength(2);
    expect(corrections).toHaveLength(0);
  });
});
