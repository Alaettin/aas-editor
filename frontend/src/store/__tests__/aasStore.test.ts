import { describe, it, expect, beforeEach } from 'vitest';
import { useAasStore, isContainerElement, getContainerChildren } from '../aasStore';
import type { AssetAdministrationShell, Submodel, SubmodelElement } from '../../types/aas';

const CENTER = { x: 400, y: 300 };

function resetStore() {
  useAasStore.setState({
    shells: [],
    submodels: [],
    conceptDescriptions: [],
    nodes: [],
    edges: [],
    showConceptDescriptions: false,
  });
}

function getState() {
  return useAasStore.getState();
}

describe('aasStore', () => {
  beforeEach(resetStore);

  // --- Create ---

  describe('addShell', () => {
    it('adds a new shell with generated ID', () => {
      getState().addShell(CENTER);
      expect(getState().shells).toHaveLength(1);
      expect(getState().shells[0].id).toMatch(/^urn:aas-editor:shell:/);
      expect(getState().shells[0].idShort).toBe('AAS_1');
    });

    it('creates a corresponding node', () => {
      getState().addShell(CENTER);
      const aasNodes = getState().nodes.filter((n) => (n.data as any).type === 'aas');
      expect(aasNodes).toHaveLength(1);
    });

    it('increments idShort counter', () => {
      getState().addShell(CENTER);
      getState().addShell(CENTER);
      expect(getState().shells[1].idShort).toBe('AAS_2');
    });
  });

  describe('addSubmodel', () => {
    it('adds a new submodel with generated ID', () => {
      getState().addSubmodel(CENTER);
      expect(getState().submodels).toHaveLength(1);
      expect(getState().submodels[0].id).toMatch(/^urn:aas-editor:submodel:/);
      expect(getState().submodels[0].idShort).toBe('Submodel_1');
    });

    it('creates a corresponding node', () => {
      getState().addSubmodel(CENTER);
      const smNodes = getState().nodes.filter((n) => (n.data as any).type === 'submodel');
      expect(smNodes).toHaveLength(1);
    });
  });

  describe('addConceptDescription', () => {
    it('adds a new concept description', () => {
      getState().addConceptDescription(CENTER);
      expect(getState().conceptDescriptions).toHaveLength(1);
      expect(getState().conceptDescriptions[0].id).toMatch(/^urn:aas-editor:conceptDescription:/);
    });
  });

  // --- Update IDs ---

  describe('updateShellId', () => {
    it('changes shell ID', () => {
      getState().addShell(CENTER);
      const oldId = getState().shells[0].id;
      getState().updateShellId(oldId, 'urn:new:id');
      expect(getState().shells[0].id).toBe('urn:new:id');
    });

    it('updates the corresponding node ID', () => {
      getState().addShell(CENTER);
      const oldId = getState().shells[0].id;
      getState().updateShellId(oldId, 'urn:new:id');
      expect(getState().nodes.some((n) => n.id === 'urn:new:id')).toBe(true);
    });
  });

  describe('updateSubmodelId', () => {
    it('changes submodel ID and updates shell references', () => {
      getState().addShell(CENTER);
      const shellId = getState().shells[0].id;
      getState().addSubmodelToShell(shellId);

      const smId = getState().submodels[0].id;
      getState().updateSubmodelId(smId, 'urn:sm:new');

      expect(getState().submodels[0].id).toBe('urn:sm:new');

      // Shell reference should also be updated
      const ref = getState().shells[0].submodels?.[0];
      expect(ref?.keys[0].value).toBe('urn:sm:new');
    });
  });

  // --- Update Fields ---

  describe('updateShell', () => {
    it('updates shell fields', () => {
      getState().addShell(CENTER);
      const shellId = getState().shells[0].id;
      getState().updateShell(shellId, { idShort: 'NewName' });
      expect(getState().shells[0].idShort).toBe('NewName');
    });
  });

  describe('updateSubmodel', () => {
    it('updates submodel fields', () => {
      getState().addSubmodel(CENTER);
      const smId = getState().submodels[0].id;
      getState().updateSubmodel(smId, { idShort: 'UpdatedSM' });
      expect(getState().submodels[0].idShort).toBe('UpdatedSM');
    });
  });

  // --- AAS → Submodel ---

  describe('addSubmodelToShell', () => {
    it('creates a submodel and links it to the shell', () => {
      getState().addShell(CENTER);
      const shellId = getState().shells[0].id;
      getState().addSubmodelToShell(shellId);

      expect(getState().submodels).toHaveLength(1);
      expect(getState().shells[0].submodels).toHaveLength(1);
      expect(getState().shells[0].submodels![0].keys[0].value).toBe(getState().submodels[0].id);
    });

    it('creates an edge from shell to submodel', () => {
      getState().addShell(CENTER);
      const shellId = getState().shells[0].id;
      getState().addSubmodelToShell(shellId);

      const smId = getState().submodels[0].id;
      const edge = getState().edges.find((e) => e.source === shellId && e.target === smId);
      expect(edge).toBeDefined();
    });
  });

  // --- SubmodelElements ---

  describe('addSubmodelElement', () => {
    it('adds a Property to a submodel', () => {
      getState().addSubmodel(CENTER);
      const smId = getState().submodels[0].id;
      getState().addSubmodelElement(smId, 'Property');

      expect(getState().submodels[0].submodelElements).toHaveLength(1);
      expect(getState().submodels[0].submodelElements![0].modelType).toBe('Property');
    });

    it('adds element to nested container', () => {
      getState().addSubmodel(CENTER);
      const smId = getState().submodels[0].id;

      // Add a collection
      getState().addSubmodelElement(smId, 'SubmodelElementCollection');
      const collectionNodeId = getState().submodels[0].submodelElements![0]._nodeId!;

      // Add a property inside the collection
      getState().addSubmodelElement(collectionNodeId, 'Property');

      const collection = getState().submodels[0].submodelElements![0] as any;
      expect(collection.value).toHaveLength(1);
      expect(collection.value[0].modelType).toBe('Property');
    });
  });

  describe('updateSubmodelElement', () => {
    it('updates element fields', () => {
      getState().addSubmodel(CENTER);
      const smId = getState().submodels[0].id;
      getState().addSubmodelElement(smId, 'Property');

      const nodeId = getState().submodels[0].submodelElements![0]._nodeId!;
      getState().updateSubmodelElement(smId, nodeId, { value: 'hello' } as any);

      const el = getState().submodels[0].submodelElements![0] as any;
      expect(el.value).toBe('hello');
    });
  });

  describe('removeSubmodelElement', () => {
    it('removes element from submodel', () => {
      getState().addSubmodel(CENTER);
      const smId = getState().submodels[0].id;
      getState().addSubmodelElement(smId, 'Property');

      const nodeId = getState().submodels[0].submodelElements![0]._nodeId!;
      getState().removeSubmodelElement(smId, nodeId);

      expect(getState().submodels[0].submodelElements).toHaveLength(0);
    });
  });

  // --- Delete ---

  describe('deleteNode', () => {
    it('deletes a shell and its node', () => {
      getState().addShell(CENTER);
      const shellId = getState().shells[0].id;
      getState().deleteNode(shellId);

      expect(getState().shells).toHaveLength(0);
      expect(getState().nodes.filter((n) => n.id === shellId)).toHaveLength(0);
    });

    it('deletes a submodel and its node', () => {
      getState().addSubmodel(CENTER);
      const smId = getState().submodels[0].id;
      getState().deleteNode(smId);

      expect(getState().submodels).toHaveLength(0);
    });

    it('cascade deletes: removes shell reference when submodel is deleted', () => {
      getState().addShell(CENTER);
      const shellId = getState().shells[0].id;
      getState().addSubmodelToShell(shellId);
      const smId = getState().submodels[0].id;

      getState().deleteNode(smId);

      expect(getState().shells[0].submodels).toHaveLength(0);
    });

    it('deletes a concept description (when visible)', () => {
      // CDs must be visible for their nodes to exist, otherwise deleteNode can't find them
      getState().toggleConceptDescriptions();
      getState().addConceptDescription(CENTER);
      const cdId = getState().conceptDescriptions[0].id;
      getState().deleteNode(cdId);

      expect(getState().conceptDescriptions).toHaveLength(0);
    });
  });

  // --- Duplicate ---

  describe('duplicateNode', () => {
    it('duplicates a shell with a new ID', () => {
      getState().addShell(CENTER);
      const originalId = getState().shells[0].id;
      getState().duplicateNode(originalId);

      expect(getState().shells).toHaveLength(2);
      expect(getState().shells[1].id).not.toBe(originalId);
    });

    it('duplicates a submodel with a new ID', () => {
      getState().addSubmodel(CENTER);
      const originalId = getState().submodels[0].id;
      getState().duplicateNode(originalId);

      expect(getState().submodels).toHaveLength(2);
      expect(getState().submodels[1].id).not.toBe(originalId);
    });
  });

  // --- Canvas operations ---

  describe('clearCanvas', () => {
    it('clears all data', () => {
      getState().addShell(CENTER);
      getState().addSubmodel(CENTER);
      getState().addConceptDescription(CENTER);
      getState().clearCanvas();

      expect(getState().shells).toHaveLength(0);
      expect(getState().submodels).toHaveLength(0);
      expect(getState().conceptDescriptions).toHaveLength(0);
      expect(getState().nodes).toHaveLength(0);
      expect(getState().edges).toHaveLength(0);
    });
  });

  describe('loadCanvas', () => {
    it('loads provided data', () => {
      const shell: AssetAdministrationShell = {
        id: 'aas-1',
        idShort: 'Test',
        assetInformation: { assetKind: 'Instance' as any },
      };

      getState().loadCanvas({
        shells: [shell],
        submodels: [],
        conceptDescriptions: [],
        nodes: [{ id: 'aas-1', type: 'aasNode', position: { x: 0, y: 0 }, data: { type: 'aas', shell } }],
        edges: [],
        showConceptDescriptions: false,
      });

      expect(getState().shells).toHaveLength(1);
      expect(getState().shells[0].id).toBe('aas-1');
    });
  });

  // --- Import ---

  describe('importEnvironment', () => {
    it('imports shells and submodels from JSON', () => {
      const json = JSON.stringify({
        assetAdministrationShells: [
          {
            id: 'urn:imported:aas',
            idShort: 'Imported',
            assetInformation: { assetKind: 'Instance' },
          },
        ],
        submodels: [
          { id: 'urn:imported:sm', idShort: 'ImportedSM' },
        ],
        conceptDescriptions: [],
      });

      getState().importEnvironment(json, ORIGIN);

      expect(getState().shells).toHaveLength(1);
      expect(getState().submodels).toHaveLength(1);
      expect(getState().nodes.length).toBeGreaterThan(0);
    });
  });

  // --- Concept Description toggles ---

  describe('toggleConceptDescriptions', () => {
    it('toggles showConceptDescriptions flag', () => {
      expect(getState().showConceptDescriptions).toBe(false);
      getState().toggleConceptDescriptions();
      expect(getState().showConceptDescriptions).toBe(true);
      getState().toggleConceptDescriptions();
      expect(getState().showConceptDescriptions).toBe(false);
    });
  });

  describe('updateConceptDescriptionField', () => {
    it('updates CD fields', () => {
      getState().addConceptDescription(CENTER);
      const cdId = getState().conceptDescriptions[0].id;
      getState().updateConceptDescriptionField(cdId, 'idShort', 'Weight');
      expect(getState().conceptDescriptions[0].idShort).toBe('Weight');
    });
  });
});

const ORIGIN = { x: 0, y: 0 };

// --- Container helper functions ---

describe('isContainerElement', () => {
  it('returns true for SubmodelElementCollection', () => {
    const el = { modelType: 'SubmodelElementCollection', idShort: 'col' } as SubmodelElement;
    expect(isContainerElement(el)).toBe(true);
  });

  it('returns true for SubmodelElementList', () => {
    const el = { modelType: 'SubmodelElementList', idShort: 'list' } as SubmodelElement;
    expect(isContainerElement(el)).toBe(true);
  });

  it('returns false for Property', () => {
    const el = { modelType: 'Property', idShort: 'prop' } as SubmodelElement;
    expect(isContainerElement(el)).toBe(false);
  });

  it('returns false for other element types', () => {
    const types = ['MultiLanguageProperty', 'Range', 'Blob', 'File', 'ReferenceElement', 'Entity', 'Operation'];
    for (const modelType of types) {
      const el = { modelType, idShort: 'x' } as SubmodelElement;
      expect(isContainerElement(el)).toBe(false);
    }
  });
});

describe('getContainerChildren', () => {
  it('returns children of SubmodelElementCollection', () => {
    const child = { modelType: 'Property', idShort: 'child' } as SubmodelElement;
    const el = { modelType: 'SubmodelElementCollection', idShort: 'col', value: [child] } as any;
    expect(getContainerChildren(el)).toEqual([child]);
  });

  it('returns children of SubmodelElementList', () => {
    const child = { modelType: 'Property', idShort: 'child' } as SubmodelElement;
    const el = { modelType: 'SubmodelElementList', idShort: 'list', value: [child] } as any;
    expect(getContainerChildren(el)).toEqual([child]);
  });

  it('returns empty array for container with no value', () => {
    const el = { modelType: 'SubmodelElementCollection', idShort: 'empty' } as any;
    expect(getContainerChildren(el)).toEqual([]);
  });

  it('returns empty array for non-container elements', () => {
    const el = { modelType: 'Property', idShort: 'prop' } as SubmodelElement;
    expect(getContainerChildren(el)).toEqual([]);
  });
});
