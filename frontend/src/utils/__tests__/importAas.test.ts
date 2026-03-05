import { describe, it, expect } from 'vitest';
import { importFromJson, type ImportResult } from '../importAas';

// --- Helpers ---

function makeEnvJson(env: {
  assetAdministrationShells?: any[];
  submodels?: any[];
  conceptDescriptions?: any[];
}): string {
  return JSON.stringify({
    assetAdministrationShells: env.assetAdministrationShells ?? [],
    submodels: env.submodels ?? [],
    conceptDescriptions: env.conceptDescriptions ?? [],
  });
}

function makeMinimalShell(id: string, smIds: string[] = []) {
  return {
    id,
    idShort: id,
    assetInformation: { assetKind: 'Instance' },
    submodels: smIds.map((smId) => ({
      type: 'ModelReference',
      keys: [{ type: 'Submodel', value: smId }],
    })),
  };
}

function makeMinimalSubmodel(id: string, elements: any[] = []) {
  return {
    id,
    idShort: id,
    submodelElements: elements,
  };
}

const ORIGIN = { x: 0, y: 0 };

// --- Tests ---

describe('importFromJson', () => {
  it('parses empty environment', () => {
    const result = importFromJson(makeEnvJson({}), ORIGIN);

    expect(result.shells).toEqual([]);
    expect(result.submodels).toEqual([]);
    expect(result.conceptDescriptions).toEqual([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    expect(() => importFromJson('not json', ORIGIN)).toThrow();
  });

  it('creates AAS node for each shell', () => {
    const json = makeEnvJson({
      assetAdministrationShells: [makeMinimalShell('aas1'), makeMinimalShell('aas2')],
    });
    const result = importFromJson(json, ORIGIN);

    const aasNodes = result.nodes.filter((n) => n.type === 'aasNode');
    expect(aasNodes).toHaveLength(2);
  });

  it('creates submodel nodes and edges from AAS', () => {
    const json = makeEnvJson({
      assetAdministrationShells: [makeMinimalShell('aas1', ['sm1'])],
      submodels: [makeMinimalSubmodel('sm1')],
    });
    const result = importFromJson(json, ORIGIN);

    const smNodes = result.nodes.filter((n) => n.type === 'submodelNode');
    expect(smNodes).toHaveLength(1);

    // Edge from AAS to submodel
    const edge = result.edges.find((e) => e.source === 'aas1' && e.target === 'sm1');
    expect(edge).toBeDefined();
    expect(edge!.sourceHandle).toBe('source-bottom');
    expect(edge!.targetHandle).toBe('target-top');
  });

  it('places submodel nodes below AAS nodes', () => {
    const json = makeEnvJson({
      assetAdministrationShells: [makeMinimalShell('aas1', ['sm1'])],
      submodels: [makeMinimalSubmodel('sm1')],
    });
    const result = importFromJson(json, ORIGIN);

    const aasNode = result.nodes.find((n) => n.id === 'aas1');
    const smNode = result.nodes.find((n) => n.id === 'sm1');

    expect(smNode!.position.y).toBeGreaterThan(aasNode!.position.y);
  });

  it('creates element nodes with _nodeId', () => {
    const json = makeEnvJson({
      submodels: [
        makeMinimalSubmodel('sm1', [
          { modelType: 'Property', idShort: 'Prop1', valueType: 'xs:string' },
        ]),
      ],
    });
    const result = importFromJson(json, ORIGIN);

    // Submodel elements should have _nodeId assigned
    const sm = result.submodels[0];
    expect(sm.submodelElements![0]._nodeId).toBeDefined();
    expect(typeof sm.submodelElements![0]._nodeId).toBe('string');
  });

  it('creates element nodes below submodel', () => {
    const json = makeEnvJson({
      submodels: [
        makeMinimalSubmodel('sm1', [
          { modelType: 'Property', idShort: 'Prop1', valueType: 'xs:string' },
        ]),
      ],
    });
    const result = importFromJson(json, ORIGIN);

    const smNode = result.nodes.find((n) => n.id === 'sm1');
    const elNodes = result.nodes.filter((n) => n.type === 'elementNode');

    expect(elNodes).toHaveLength(1);
    expect(elNodes[0].position.y).toBeGreaterThan(smNode!.position.y);
  });

  it('creates edges from submodel to element nodes', () => {
    const json = makeEnvJson({
      submodels: [
        makeMinimalSubmodel('sm1', [
          { modelType: 'Property', idShort: 'Prop1', valueType: 'xs:string' },
        ]),
      ],
    });
    const result = importFromJson(json, ORIGIN);

    const elementNodeId = result.submodels[0].submodelElements![0]._nodeId!;
    const edge = result.edges.find((e) => e.source === 'sm1' && e.target === elementNodeId);
    expect(edge).toBeDefined();
  });

  it('handles standalone submodels (not referenced by AAS)', () => {
    const json = makeEnvJson({
      assetAdministrationShells: [makeMinimalShell('aas1', [])],
      submodels: [makeMinimalSubmodel('sm-standalone')],
    });
    const result = importFromJson(json, ORIGIN);

    // The standalone submodel should still be placed as a node
    const smNode = result.nodes.find((n) => n.id === 'sm-standalone');
    expect(smNode).toBeDefined();
    expect(smNode!.type).toBe('submodelNode');

    // No edge from AAS to standalone submodel
    const edges = result.edges.filter((e) => e.target === 'sm-standalone');
    expect(edges).toHaveLength(0);
  });

  it('handles nested SubmodelElementCollection', () => {
    const json = makeEnvJson({
      submodels: [
        makeMinimalSubmodel('sm1', [
          {
            modelType: 'SubmodelElementCollection',
            idShort: 'Collection',
            value: [
              { modelType: 'Property', idShort: 'Inner', valueType: 'xs:string' },
            ],
          },
        ]),
      ],
    });
    const result = importFromJson(json, ORIGIN);

    // Both the collection and the inner property should be nodes
    const elNodes = result.nodes.filter((n) => n.type === 'elementNode');
    expect(elNodes).toHaveLength(2);

    // Inner element should have an edge from the collection
    const collection = result.submodels[0].submodelElements![0];
    const innerEl = (collection as any).value[0];
    const innerEdge = result.edges.find((e) => e.source === collection._nodeId && e.target === innerEl._nodeId);
    expect(innerEdge).toBeDefined();
  });

  it('lays out multiple submodels horizontally', () => {
    const json = makeEnvJson({
      assetAdministrationShells: [makeMinimalShell('aas1', ['sm1', 'sm2'])],
      submodels: [
        makeMinimalSubmodel('sm1'),
        makeMinimalSubmodel('sm2'),
      ],
    });
    const result = importFromJson(json, ORIGIN);

    const sm1Node = result.nodes.find((n) => n.id === 'sm1');
    const sm2Node = result.nodes.find((n) => n.id === 'sm2');

    // Second submodel should be to the right
    expect(sm2Node!.position.x).toBeGreaterThan(sm1Node!.position.x);
    // Same Y level
    expect(sm2Node!.position.y).toBe(sm1Node!.position.y);
  });

  it('preserves concept descriptions', () => {
    const json = makeEnvJson({
      conceptDescriptions: [{ id: 'cd-1', idShort: 'Weight' }],
    });
    const result = importFromJson(json, ORIGIN);
    expect(result.conceptDescriptions).toHaveLength(1);
    expect(result.conceptDescriptions[0].id).toBe('cd-1');
  });

  it('uses origin offset for positioning', () => {
    const json = makeEnvJson({
      assetAdministrationShells: [makeMinimalShell('aas1')],
    });
    const result = importFromJson(json, { x: 500, y: 300 });

    const aasNode = result.nodes.find((n) => n.id === 'aas1');
    expect(aasNode!.position.y).toBe(300);
  });

  it('lays out multiple sibling elements horizontally', () => {
    const json = makeEnvJson({
      submodels: [
        makeMinimalSubmodel('sm1', [
          { modelType: 'Property', idShort: 'A', valueType: 'xs:string' },
          { modelType: 'Property', idShort: 'B', valueType: 'xs:string' },
          { modelType: 'Property', idShort: 'C', valueType: 'xs:string' },
        ]),
      ],
    });
    const result = importFromJson(json, ORIGIN);

    const elNodes = result.nodes.filter((n) => n.type === 'elementNode');
    expect(elNodes).toHaveLength(3);

    // All should be at the same Y
    expect(elNodes[1].position.y).toBe(elNodes[0].position.y);
    expect(elNodes[2].position.y).toBe(elNodes[0].position.y);

    // Each should be further right
    expect(elNodes[1].position.x).toBeGreaterThan(elNodes[0].position.x);
    expect(elNodes[2].position.x).toBeGreaterThan(elNodes[1].position.x);
  });
});
