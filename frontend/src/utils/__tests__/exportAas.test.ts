import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aas from '@aas-core-works/aas-core3.1-typescript';
import { shellToJsonable, submodelToJsonable, exportToJson, exportShellToJson } from '../exportAas';
import { useAasStore } from '../../store/aasStore';
import type {
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
  LangString,
  Qualifier,
  ConceptDescription,
} from '../../types/aas';

// --- Helper factories ---

function makeRef(type: string, keyType: string, value: string): Reference {
  return { type: type as any, keys: [{ type: keyType, value }] };
}

function makeShell(overrides: Partial<AssetAdministrationShell> = {}): AssetAdministrationShell {
  return {
    id: 'urn:example:aas:1',
    idShort: 'TestShell',
    assetInformation: { assetKind: 'Instance' as any, globalAssetId: 'urn:example:asset:1' },
    ...overrides,
  };
}

function makeSubmodel(overrides: Partial<Submodel> = {}): Submodel {
  return {
    id: 'urn:example:sm:1',
    idShort: 'TestSubmodel',
    ...overrides,
  };
}

// --- Tests ---

describe('shellToJsonable', () => {
  it('converts a minimal shell to JSON-serializable format', () => {
    const shell = makeShell();
    const result = shellToJsonable(shell) as any;

    expect(result.id).toBe('urn:example:aas:1');
    expect(result.idShort).toBe('TestShell');
    expect(result.assetInformation).toBeDefined();
    expect(result.assetInformation.assetKind).toBe('Instance');
    expect(result.assetInformation.globalAssetId).toBe('urn:example:asset:1');
  });

  it('includes submodel references', () => {
    const shell = makeShell({
      submodels: [makeRef('ModelReference', 'Submodel', 'urn:example:sm:1')],
    });
    const result = shellToJsonable(shell) as any;

    expect(result.submodels).toHaveLength(1);
    expect(result.submodels[0].keys[0].value).toBe('urn:example:sm:1');
  });

  it('includes description and displayName', () => {
    const shell = makeShell({
      description: [{ language: 'de', text: 'Beschreibung' }],
      displayName: [{ language: 'de', text: 'Anzeigename' }],
    });
    const result = shellToJsonable(shell) as any;

    expect(result.description).toHaveLength(1);
    expect(result.description[0].language).toBe('de');
    expect(result.displayName).toHaveLength(1);
  });

  it('includes administration info', () => {
    const shell = makeShell({
      administration: { version: '1.0', revision: '2' },
    });
    const result = shellToJsonable(shell) as any;

    expect(result.administration.version).toBe('1.0');
    expect(result.administration.revision).toBe('2');
  });

  it('handles asset kind Type', () => {
    const shell = makeShell({
      assetInformation: { assetKind: 'Type' as any },
    });
    const result = shellToJsonable(shell) as any;
    expect(result.assetInformation.assetKind).toBe('Type');
  });

  it('includes specificAssetIds', () => {
    const shell = makeShell({
      assetInformation: {
        assetKind: 'Instance' as any,
        specificAssetIds: [{ name: 'serial', value: '12345' }],
      },
    });
    const result = shellToJsonable(shell) as any;
    expect(result.assetInformation.specificAssetIds).toHaveLength(1);
    expect(result.assetInformation.specificAssetIds[0].name).toBe('serial');
  });

  it('includes derivedFrom reference', () => {
    const shell = makeShell({
      derivedFrom: makeRef('ModelReference', 'AssetAdministrationShell', 'urn:base:aas'),
    });
    const result = shellToJsonable(shell) as any;
    expect(result.derivedFrom.keys[0].value).toBe('urn:base:aas');
  });
});

describe('submodelToJsonable', () => {
  it('converts a minimal submodel', () => {
    const sm = makeSubmodel();
    const result = submodelToJsonable(sm) as any;

    expect(result.id).toBe('urn:example:sm:1');
    expect(result.idShort).toBe('TestSubmodel');
  });

  it('converts submodel with Property element', () => {
    const sm = makeSubmodel({
      submodelElements: [
        { modelType: 'Property', idShort: 'Prop1', valueType: 'xs:string' as any, value: 'hello' },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements).toHaveLength(1);
    expect(result.submodelElements[0].idShort).toBe('Prop1');
    expect(result.submodelElements[0].modelType).toBe('Property');
    expect(result.submodelElements[0].value).toBe('hello');
  });

  it('converts submodel with Range element', () => {
    const sm = makeSubmodel({
      submodelElements: [
        { modelType: 'Range', idShort: 'Temp', valueType: 'xs:double' as any, min: '0', max: '100' },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].modelType).toBe('Range');
    expect(result.submodelElements[0].min).toBe('0');
    expect(result.submodelElements[0].max).toBe('100');
  });

  it('converts submodel with MultiLanguageProperty', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'MultiLanguageProperty',
          idShort: 'MLP1',
          value: [
            { language: 'de', text: 'Hallo' },
            { language: 'en', text: 'Hello' },
          ],
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].modelType).toBe('MultiLanguageProperty');
    expect(result.submodelElements[0].value).toHaveLength(2);
  });

  it('converts submodel with File element', () => {
    const sm = makeSubmodel({
      submodelElements: [
        { modelType: 'File', idShort: 'Doc', contentType: 'application/pdf', value: '/files/doc.pdf' },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].contentType).toBe('application/pdf');
    expect(result.submodelElements[0].value).toBe('/files/doc.pdf');
  });

  it('converts submodel with Blob element', () => {
    const sm = makeSubmodel({
      submodelElements: [
        { modelType: 'Blob', idShort: 'Data', contentType: 'application/octet-stream', value: 'base64data' },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].modelType).toBe('Blob');
    expect(result.submodelElements[0].contentType).toBe('application/octet-stream');
  });

  it('converts SubmodelElementCollection with nested elements', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'SubmodelElementCollection',
          idShort: 'Group',
          value: [
            { modelType: 'Property', idShort: 'Inner', valueType: 'xs:int' as any, value: '42' },
          ],
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].modelType).toBe('SubmodelElementCollection');
    expect(result.submodelElements[0].value).toHaveLength(1);
    expect(result.submodelElements[0].value[0].idShort).toBe('Inner');
  });

  it('converts SubmodelElementList', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'SubmodelElementList',
          idShort: 'List1',
          typeValueListElement: 'Property',
          orderRelevant: true,
          value: [],
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].modelType).toBe('SubmodelElementList');
    expect(result.submodelElements[0].typeValueListElement).toBe('Property');
    expect(result.submodelElements[0].orderRelevant).toBe(true);
  });

  it('converts Entity element', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'Entity',
          idShort: 'Motor',
          entityType: 'SelfManagedEntity' as any,
          globalAssetId: 'urn:motor:1',
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].entityType).toBe('SelfManagedEntity');
    expect(result.submodelElements[0].globalAssetId).toBe('urn:motor:1');
  });

  it('converts ReferenceElement', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'ReferenceElement',
          idShort: 'Ref1',
          value: makeRef('ExternalReference', 'GlobalReference', 'urn:ext:1'),
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].modelType).toBe('ReferenceElement');
    expect(result.submodelElements[0].value.keys[0].value).toBe('urn:ext:1');
  });

  it('converts Operation with input/output variables', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'Operation',
          idShort: 'Op1',
          inputVariables: [
            { value: { modelType: 'Property', idShort: 'In1', valueType: 'xs:string' as any } },
          ],
          outputVariables: [
            { value: { modelType: 'Property', idShort: 'Out1', valueType: 'xs:int' as any } },
          ],
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].inputVariables).toHaveLength(1);
    expect(result.submodelElements[0].outputVariables).toHaveLength(1);
  });

  it('converts Capability element', () => {
    const sm = makeSubmodel({
      submodelElements: [
        { modelType: 'Capability', idShort: 'Cap1' },
      ],
    });
    const result = submodelToJsonable(sm) as any;
    expect(result.submodelElements[0].modelType).toBe('Capability');
  });

  it('converts RelationshipElement', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'RelationshipElement',
          idShort: 'Rel1',
          first: makeRef('ModelReference', 'Property', 'urn:a'),
          second: makeRef('ModelReference', 'Property', 'urn:b'),
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].first.keys[0].value).toBe('urn:a');
    expect(result.submodelElements[0].second.keys[0].value).toBe('urn:b');
  });

  it('converts AnnotatedRelationshipElement with annotations', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'AnnotatedRelationshipElement',
          idShort: 'ARel1',
          first: makeRef('ModelReference', 'Property', 'urn:a'),
          second: makeRef('ModelReference', 'Property', 'urn:b'),
          annotations: [
            { modelType: 'Property', idShort: 'Note', valueType: 'xs:string' as any, value: 'comment' },
          ],
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].annotations).toHaveLength(1);
  });

  it('converts BasicEventElement', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'BasicEventElement',
          idShort: 'Evt1',
          observed: makeRef('ModelReference', 'Property', 'urn:prop:1'),
          direction: 'output' as any,
          state: 'on' as any,
          messageTopic: 'alerts',
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;

    expect(result.submodelElements[0].direction).toBe('output');
    expect(result.submodelElements[0].state).toBe('on');
    expect(result.submodelElements[0].messageTopic).toBe('alerts');
  });

  it('includes qualifiers on elements', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'Property',
          idShort: 'Prop1',
          valueType: 'xs:string' as any,
          qualifiers: [
            { type: 'unit', valueType: 'xs:string' as any, value: 'kg', kind: 'ConceptQualifier' as any },
          ],
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;
    expect(result.submodelElements[0].qualifiers).toHaveLength(1);
    expect(result.submodelElements[0].qualifiers[0].type).toBe('unit');
  });

  it('includes semanticId on elements', () => {
    const sm = makeSubmodel({
      submodelElements: [
        {
          modelType: 'Property',
          idShort: 'Prop1',
          valueType: 'xs:string' as any,
          semanticId: makeRef('ExternalReference', 'GlobalReference', '0173-1#01-AAA000#001'),
        },
      ],
    });
    const result = submodelToJsonable(sm) as any;
    expect(result.submodelElements[0].semanticId.keys[0].value).toBe('0173-1#01-AAA000#001');
  });

  it('converts submodel with kind Template', () => {
    const sm = makeSubmodel({ kind: 'Template' as any });
    const result = submodelToJsonable(sm) as any;
    expect(result.kind).toBe('Template');
  });

  it('converts submodel with semanticId', () => {
    const sm = makeSubmodel({
      semanticId: makeRef('ExternalReference', 'GlobalReference', 'urn:example:semanticId'),
    });
    const result = submodelToJsonable(sm) as any;
    expect(result.semanticId.keys[0].value).toBe('urn:example:semanticId');
  });

  it('handles unknown modelType as Property fallback', () => {
    const sm = makeSubmodel({
      submodelElements: [
        { modelType: 'UnknownType' as any, idShort: 'Unknown1' },
      ],
    });
    const result = submodelToJsonable(sm) as any;
    // Should fall through to default case and create a Property
    expect(result.submodelElements[0].idShort).toBe('Unknown1');
    expect(result.submodelElements[0].modelType).toBe('Property');
  });
});

describe('exportToJson', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAasStore.setState({
      shells: [],
      submodels: [],
      conceptDescriptions: [],
      nodes: [],
      edges: [],
    });
  });

  it('returns valid JSON for empty state', () => {
    const { json, errors } = exportToJson();
    const parsed = JSON.parse(json);

    expect(parsed.assetAdministrationShells).toEqual([]);
    expect(parsed.submodels).toEqual([]);
    expect(parsed.conceptDescriptions).toEqual([]);
  });

  it('exports shells and submodels from store', () => {
    useAasStore.setState({
      shells: [makeShell()],
      submodels: [makeSubmodel()],
      conceptDescriptions: [],
      nodes: [],
      edges: [],
    });

    const { json } = exportToJson();
    const parsed = JSON.parse(json);

    expect(parsed.assetAdministrationShells).toHaveLength(1);
    expect(parsed.submodels).toHaveLength(1);
  });

  it('only includes referenced concept descriptions', () => {
    useAasStore.setState({
      shells: [],
      submodels: [
        makeSubmodel({
          submodelElements: [
            {
              modelType: 'Property',
              idShort: 'Prop1',
              valueType: 'xs:string' as any,
              semanticId: makeRef('ExternalReference', 'GlobalReference', 'cd-1'),
            },
          ],
        }),
      ],
      conceptDescriptions: [
        { id: 'cd-1', idShort: 'Referenced' },
        { id: 'cd-2', idShort: 'Unreferenced' },
      ] as ConceptDescription[],
      nodes: [],
      edges: [],
    });

    const { json } = exportToJson();
    const parsed = JSON.parse(json);

    expect(parsed.conceptDescriptions).toHaveLength(1);
    expect(parsed.conceptDescriptions[0].id).toBe('cd-1');
  });
});

describe('exportShellToJson', () => {
  beforeEach(() => {
    useAasStore.setState({
      shells: [makeShell({
        submodels: [makeRef('ModelReference', 'Submodel', 'urn:example:sm:1')],
      })],
      submodels: [makeSubmodel()],
      conceptDescriptions: [],
      nodes: [],
      edges: [],
    });
  });

  it('exports a single shell with related submodels', () => {
    const { json, filename } = exportShellToJson('urn:example:aas:1');
    const parsed = JSON.parse(json);

    expect(parsed.assetAdministrationShells).toHaveLength(1);
    expect(parsed.submodels).toHaveLength(1);
    expect(filename).toBe('TestShell.json');
  });

  it('returns error for unknown shell', () => {
    const { errors } = exportShellToJson('non-existent');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('nicht gefunden');
  });

  it('uses fallback filename when idShort is empty', () => {
    useAasStore.setState({
      shells: [makeShell({ idShort: undefined })],
      submodels: [],
      conceptDescriptions: [],
      nodes: [],
      edges: [],
    });

    const { filename } = exportShellToJson('urn:example:aas:1');
    expect(filename).toBe('aas.json');
  });
});
