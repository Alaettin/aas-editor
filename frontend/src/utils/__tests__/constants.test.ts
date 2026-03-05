import { describe, it, expect } from 'vitest';
import { ALL_XSD_TYPES, ALL_KEY_TYPES, ALL_ELEMENT_TYPES } from '../constants';

describe('ALL_XSD_TYPES', () => {
  it('contains all 30 XSD data types', () => {
    expect(ALL_XSD_TYPES.length).toBe(30);
  });

  it('all entries start with xs:', () => {
    for (const t of ALL_XSD_TYPES) {
      expect(t).toMatch(/^xs:/);
    }
  });

  it('includes common types', () => {
    expect(ALL_XSD_TYPES).toContain('xs:string');
    expect(ALL_XSD_TYPES).toContain('xs:boolean');
    expect(ALL_XSD_TYPES).toContain('xs:int');
    expect(ALL_XSD_TYPES).toContain('xs:double');
    expect(ALL_XSD_TYPES).toContain('xs:dateTime');
  });

  it('has no duplicates', () => {
    expect(new Set(ALL_XSD_TYPES).size).toBe(ALL_XSD_TYPES.length);
  });
});

describe('ALL_KEY_TYPES', () => {
  it('contains expected key types', () => {
    expect(ALL_KEY_TYPES).toContain('Submodel');
    expect(ALL_KEY_TYPES).toContain('AssetAdministrationShell');
    expect(ALL_KEY_TYPES).toContain('ConceptDescription');
    expect(ALL_KEY_TYPES).toContain('GlobalReference');
    expect(ALL_KEY_TYPES).toContain('Property');
  });

  it('has no duplicates', () => {
    expect(new Set(ALL_KEY_TYPES).size).toBe(ALL_KEY_TYPES.length);
  });
});

describe('ALL_ELEMENT_TYPES', () => {
  it('contains all 15 element types', () => {
    expect(ALL_ELEMENT_TYPES.length).toBe(15);
  });

  it('includes all standard AAS element types', () => {
    const expected = [
      'Property', 'MultiLanguageProperty', 'Range',
      'SubmodelElementCollection', 'SubmodelElementList',
      'File', 'Blob', 'ReferenceElement', 'Entity',
      'RelationshipElement', 'AnnotatedRelationshipElement',
      'Operation', 'Capability', 'BasicEventElement',
    ];
    for (const t of expected) {
      expect(ALL_ELEMENT_TYPES).toContain(t);
    }
  });

  it('has no duplicates', () => {
    expect(new Set(ALL_ELEMENT_TYPES).size).toBe(ALL_ELEMENT_TYPES.length);
  });
});
