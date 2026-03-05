import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type {
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  ConceptDescription,
  AssetKind,
  ReferenceTypes,
  DataTypeDefXsd,
} from '../types/aas';
import { generateId, generateUrn } from '../utils/ids';
import { importFromJson } from '../utils/importAas';

// --- Node data types ---

export interface AASNodeData {
  type: 'aas';
  shell: AssetAdministrationShell;
}

export interface SubmodelNodeData {
  type: 'submodel';
  submodel: Submodel;
}

export interface SubmodelElementNodeData {
  type: 'element';
  submodelId: string;
  element: SubmodelElement;
}

export interface ConceptDescriptionNodeData {
  type: 'conceptDescription';
  conceptDescription: ConceptDescription;
}

export type AasNodeData = AASNodeData | SubmodelNodeData | SubmodelElementNodeData | ConceptDescriptionNodeData;

// --- Sync helpers ---

function syncNodeData(
  nodes: Node[],
  shells: AssetAdministrationShell[],
  submodels: Submodel[],
  conceptDescriptions?: ConceptDescription[],
): Node[] {
  return nodes.map((node) => {
    const data = node.data as AasNodeData;
    if (data.type === 'aas') {
      const shell = shells.find((s) => s.id === node.id);
      if (shell) return { ...node, data: { type: 'aas', shell } as AASNodeData };
    }
    if (data.type === 'submodel') {
      const submodel = submodels.find((s) => s.id === node.id);
      if (submodel) return { ...node, data: { type: 'submodel', submodel } as SubmodelNodeData };
    }
    if (data.type === 'element') {
      const elemData = data as SubmodelElementNodeData;
      const submodel = submodels.find((s) => s.id === elemData.submodelId);
      if (submodel) {
        const element = findElementByNodeId(submodel.submodelElements ?? [], elemData.element._nodeId!);
        if (element) {
          return { ...node, data: { type: 'element', submodelId: elemData.submodelId, element } as SubmodelElementNodeData };
        }
      }
    }
    if (data.type === 'conceptDescription' && conceptDescriptions) {
      const cd = conceptDescriptions.find((c) => c.id === node.id);
      if (cd) return { ...node, data: { type: 'conceptDescription', conceptDescription: cd } as ConceptDescriptionNodeData };
    }
    return node;
  });
}

function findElementByNodeId(elements: SubmodelElement[], nodeId: string): SubmodelElement | undefined {
  for (const el of elements) {
    if (el._nodeId === nodeId) return el;
    if (isContainerElement(el)) {
      const children = getContainerChildren(el);
      const found = findElementByNodeId(children, nodeId);
      if (found) return found;
    }
  }
  return undefined;
}

function isContainerElement(el: SubmodelElement): boolean {
  return el.modelType === 'SubmodelElementCollection' || el.modelType === 'SubmodelElementList';
}

function getContainerChildren(el: SubmodelElement): SubmodelElement[] {
  if (el.modelType === 'SubmodelElementCollection' || el.modelType === 'SubmodelElementList') {
    return (el as { value?: SubmodelElement[] }).value ?? [];
  }
  return [];
}

// --- State & Actions ---

interface AasState {
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
  nodes: Node[];
  edges: Edge[];
  showConceptDescriptions: boolean;
}

interface AasActions {
  // React Flow
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Create
  addShell: (viewportCenter: { x: number; y: number }) => void;
  addSubmodel: (viewportCenter: { x: number; y: number }) => void;

  // Edit IDs
  updateShellId: (oldId: string, newId: string) => void;
  updateSubmodelId: (oldId: string, newId: string) => void;
  updateShellIdShort: (shellId: string, idShort: string) => void;
  updateSubmodelIdShort: (submodelId: string, idShort: string) => void;

  // Generic updates for detail panel
  updateShell: (shellId: string, changes: Partial<AssetAdministrationShell>) => void;
  updateSubmodel: (submodelId: string, changes: Partial<Submodel>) => void;

  // AAS → Submodel
  addSubmodelToShell: (shellId: string, handlePos?: Position) => void;

  // SubmodelElements — parentId can be submodelId or collection _nodeId
  addSubmodelElement: (parentId: string, modelType: string, handlePos?: Position) => void;
  updateSubmodelElement: (
    submodelId: string,
    nodeId: string,
    changes: Partial<SubmodelElement>,
  ) => void;
  removeSubmodelElement: (submodelId: string, nodeId: string) => void;

  // Import
  importEnvironment: (jsonString: string, origin: { x: number; y: number }) => void;

  // Concept Descriptions
  addConceptDescription: (viewportCenter: { x: number; y: number }) => void;
  updateConceptDescriptionField: (cdId: string, field: string, value: unknown) => void;
  toggleConceptDescriptions: () => void;

  // Node operations
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Canvas persistence
  loadCanvas: (data: {
    shells: AssetAdministrationShell[];
    submodels: Submodel[];
    conceptDescriptions: ConceptDescription[];
    nodes: Node[];
    edges: Edge[];
    showConceptDescriptions: boolean;
  }) => void;
  clearCanvas: () => void;
}

type AasStore = AasState & AasActions;

function createDefaultElement(modelType: string, index: number): SubmodelElement {
  const idShort = `${modelType}_${index}`;
  const _nodeId = generateId();
  switch (modelType) {
    case 'Property':
      return { modelType: 'Property', idShort, _nodeId, valueType: 'xs:string' as DataTypeDefXsd, value: '' };
    case 'MultiLanguageProperty':
      return { modelType: 'MultiLanguageProperty', idShort, _nodeId, value: [] };
    case 'Range':
      return { modelType: 'Range', idShort, _nodeId, valueType: 'xs:double' as DataTypeDefXsd };
    case 'SubmodelElementCollection':
      return { modelType: 'SubmodelElementCollection', idShort, _nodeId, value: [] };
    case 'SubmodelElementList':
      return { modelType: 'SubmodelElementList', idShort, _nodeId, typeValueListElement: 'SubmodelElement', value: [] };
    case 'File':
      return { modelType: 'File', idShort, _nodeId, contentType: 'application/octet-stream' };
    case 'Blob':
      return { modelType: 'Blob', idShort, _nodeId, contentType: 'application/octet-stream' };
    case 'ReferenceElement':
      return { modelType: 'ReferenceElement', idShort, _nodeId };
    case 'Entity':
      return { modelType: 'Entity', idShort, _nodeId, entityType: 'SelfManagedEntity' as any };
    case 'RelationshipElement':
      return { modelType: 'RelationshipElement', idShort, _nodeId, first: { type: 'ModelReference' as any, keys: [] }, second: { type: 'ModelReference' as any, keys: [] } };
    case 'AnnotatedRelationshipElement':
      return { modelType: 'AnnotatedRelationshipElement', idShort, _nodeId, first: { type: 'ModelReference' as any, keys: [] }, second: { type: 'ModelReference' as any, keys: [] } };
    case 'BasicEventElement':
      return { modelType: 'BasicEventElement', idShort, _nodeId, observed: { type: 'ModelReference' as any, keys: [] }, direction: 'output' as any, state: 'on' as any };
    case 'Operation':
      return { modelType: 'Operation', idShort, _nodeId };
    case 'Capability':
      return { modelType: 'Capability', idShort, _nodeId };
    default:
      return { modelType: 'Property', idShort, _nodeId, valueType: 'xs:string' as DataTypeDefXsd, value: '' };
  }
}

// Map elements in a submodel, including nested containers
function mapElements(
  elements: SubmodelElement[],
  nodeId: string,
  mapper: (el: SubmodelElement) => SubmodelElement,
): SubmodelElement[] {
  return elements.map((el) => {
    if (el._nodeId === nodeId) return mapper(el);
    if (isContainerElement(el)) {
      const children = getContainerChildren(el);
      const mappedChildren = mapElements(children, nodeId, mapper);
      return { ...el, value: mappedChildren };
    }
    return el;
  });
}

// Add element to a container identified by _nodeId
function addToContainer(
  elements: SubmodelElement[],
  containerNodeId: string,
  newElement: SubmodelElement,
): SubmodelElement[] {
  return elements.map((el) => {
    if (el._nodeId === containerNodeId && isContainerElement(el)) {
      const children = getContainerChildren(el);
      return { ...el, value: [...children, newElement] };
    }
    if (isContainerElement(el)) {
      const children = getContainerChildren(el);
      return { ...el, value: addToContainer(children, containerNodeId, newElement) };
    }
    return el;
  });
}

// Filter elements, including nested containers
function filterElements(
  elements: SubmodelElement[],
  nodeId: string,
): SubmodelElement[] {
  return elements
    .filter((el) => el._nodeId !== nodeId)
    .map((el) => {
      if (isContainerElement(el)) {
        const children = getContainerChildren(el);
        return { ...el, value: filterElements(children, nodeId) };
      }
      return el;
    });
}

// Collect all _nodeIds from nested element tree
function collectNodeIds(elements: SubmodelElement[]): string[] {
  const ids: string[] = [];
  for (const el of elements) {
    if (el._nodeId) ids.push(el._nodeId);
    if (isContainerElement(el)) {
      ids.push(...collectNodeIds(getContainerChildren(el)));
    }
  }
  return ids;
}

// Find which submodel contains an element by _nodeId
function findSubmodelForElement(submodels: Submodel[], nodeId: string): Submodel | undefined {
  for (const sm of submodels) {
    if (findElementByNodeId(sm.submodelElements ?? [], nodeId)) return sm;
  }
  return undefined;
}

// Get opposite handle position for target side
function oppositePosition(pos: Position): Position {
  switch (pos) {
    case Position.Top: return Position.Bottom;
    case Position.Bottom: return Position.Top;
    case Position.Left: return Position.Right;
    case Position.Right: return Position.Left;
  }
}

// Calculate new node position based on which handle was clicked
function getPositionOffset(handlePos: Position | undefined, existingCount: number, spacing: number): { dx: number; dy: number } {
  switch (handlePos) {
    case Position.Top:
      return { dx: existingCount * spacing, dy: -240 };
    case Position.Bottom:
      return { dx: existingCount * spacing, dy: 240 };
    case Position.Left:
      return { dx: -340, dy: existingCount * spacing };
    case Position.Right:
    default:
      return { dx: 340, dy: existingCount * spacing };
  }
}

// Build semantic edges: connect elements/submodels to their referenced ConceptDescriptions
function buildSemanticEdges(
  submodels: Submodel[],
  conceptDescriptions: ConceptDescription[],
  nodes: Node[],
): Edge[] {
  const cdIds = new Set(conceptDescriptions.map((cd) => cd.id));
  const edges: Edge[] = [];

  function scanElement(el: SubmodelElement) {
    const semId = el.semanticId?.keys?.[0]?.value;
    if (semId && cdIds.has(semId) && el._nodeId) {
      edges.push({
        id: `cd-edge-${el._nodeId}->${semId}`,
        source: el._nodeId,
        target: semId,
        sourceHandle: 'source-bottom',
        targetHandle: 'target-top',
        type: 'smoothstep',
        animated: true,
        className: 'cd-edge',
        style: { stroke: 'var(--node-cd)', strokeWidth: 2 },
      });
    }
    if (isContainerElement(el)) {
      getContainerChildren(el).forEach(scanElement);
    }
  }

  for (const sm of submodels) {
    const semId = sm.semanticId?.keys?.[0]?.value;
    if (semId && cdIds.has(semId)) {
      edges.push({
        id: `cd-edge-${sm.id}->${semId}`,
        source: sm.id,
        target: semId,
        sourceHandle: 'source-bottom',
        targetHandle: 'target-top',
        type: 'smoothstep',
        animated: true,
        className: 'cd-edge',
        style: { stroke: 'var(--node-cd)', strokeWidth: 2 },
      });
    }
    (sm.submodelElements ?? []).forEach(scanElement);
  }

  return edges;
}

export const useAasStore = create<AasStore>()(
  temporal(
    (set, get) => ({
      shells: [],
      submodels: [],
      conceptDescriptions: [],
      nodes: [],
      edges: [],
      showConceptDescriptions: false,

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        // Handle CD-edge removal: clear semanticId from source element/submodel
        for (const change of changes) {
          if (change.type === 'remove' && change.id.startsWith('cd-edge-')) {
            const parts = change.id.replace('cd-edge-', '').split('->');
            if (parts.length === 2) {
              const sourceNodeId = parts[0];
              const sourceNode = get().nodes.find((n) => n.id === sourceNodeId);
              if (sourceNode) {
                const data = sourceNode.data as AasNodeData;
                if (data.type === 'element') {
                  const elemData = data as SubmodelElementNodeData;
                  get().updateSubmodelElement(elemData.submodelId, elemData.element._nodeId!, { semanticId: undefined });
                } else if (data.type === 'submodel') {
                  get().updateSubmodel(sourceNodeId, { semanticId: undefined });
                }
              }
            }
          }
        }
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      onConnect: (connection) => {
        const { nodes, shells, edges: existingEdges } = get();
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);
        if (!sourceNode || !targetNode) return;

        // Block duplicate edges between same two nodes (in either direction)
        const duplicate = existingEdges.some(
          (e) =>
            (e.source === connection.source && e.target === connection.target) ||
            (e.source === connection.target && e.target === connection.source),
        );
        if (duplicate) return;

        const sourceData = sourceNode.data as AasNodeData;
        const targetData = targetNode.data as AasNodeData;

        // Strict hierarchy: AAS → Submodel → Element → Element-Kind
        // AAS → Submodel
        if (sourceData.type === 'aas' && targetData.type === 'submodel') {
          const shell = (sourceData as AASNodeData).shell;
          const submodel = (targetData as SubmodelNodeData).submodel;

          const updatedShells = shells.map((s) => {
            if (s.id !== shell.id) return s;
            const refs = s.submodels ?? [];
            if (refs.some((r) => r.keys[0]?.value === submodel.id)) return s;
            return {
              ...s,
              submodels: [
                ...refs,
                {
                  type: 'ModelReference' as ReferenceTypes,
                  keys: [{ type: 'Submodel', value: submodel.id }],
                },
              ],
            };
          });

          set({
            edges: addEdge({ ...connection, type: 'smoothstep', animated: true }, get().edges),
            shells: updatedShells,
            nodes: syncNodeData(get().nodes, updatedShells, get().submodels),
          });
          return;
        }

        // Submodel → Element
        if (sourceData.type === 'submodel' && targetData.type === 'element') {
          set({
            edges: addEdge({ ...connection, type: 'smoothstep', animated: true }, get().edges),
          });
          return;
        }

        // Container Element → Element (child)
        if (sourceData.type === 'element' && targetData.type === 'element') {
          const sourceElem = (sourceData as SubmodelElementNodeData).element;
          if (isContainerElement(sourceElem)) {
            set({
              edges: addEdge({ ...connection, type: 'smoothstep', animated: true }, get().edges),
            });
          }
          return;
        }

        // Element/Submodel ↔ ConceptDescription: set semanticId
        const cdSide = sourceData.type === 'conceptDescription' ? sourceData : targetData.type === 'conceptDescription' ? targetData : null;
        const otherSide = cdSide === sourceData ? targetData : cdSide === targetData ? sourceData : null;
        const otherNodeId = cdSide === sourceData ? connection.target : connection.source;

        if (cdSide && otherSide) {
          const cd = (cdSide as ConceptDescriptionNodeData).conceptDescription;
          const semanticId = {
            type: 'ExternalReference' as ReferenceTypes,
            keys: [{ type: 'GlobalReference', value: cd.id }],
          };

          if (otherSide.type === 'element') {
            const elemData = otherSide as SubmodelElementNodeData;
            get().updateSubmodelElement(elemData.submodelId, elemData.element._nodeId!, { semanticId });
          } else if (otherSide.type === 'submodel') {
            get().updateSubmodel(otherNodeId!, { semanticId });
          }

          // Ensure CDs are visible so the edge appears
          if (!get().showConceptDescriptions) {
            get().toggleConceptDescriptions();
          }
          return;
        }

        // All other combinations: blocked (no edge created)
      },

      addShell: (viewportCenter) => {
        const shellId = generateUrn('shell');
        const shell: AssetAdministrationShell = {
          id: shellId,
          idShort: `AAS_${get().shells.length + 1}`,
          assetInformation: {
            assetKind: 'Instance' as AssetKind,
            globalAssetId: generateUrn('asset'),
          },
          submodels: [],
        };

        const node: Node = {
          id: shellId,
          type: 'aasNode',
          position: {
            x: viewportCenter.x - 140 + Math.random() * 40 - 20,
            y: viewportCenter.y - 60 + Math.random() * 40 - 20,
          },
          data: { type: 'aas', shell } as AASNodeData,
        };

        set({
          shells: [...get().shells, shell],
          nodes: [...get().nodes, node],
        });
      },

      addSubmodel: (viewportCenter) => {
        const submodelId = generateUrn('submodel');
        const submodel: Submodel = {
          id: submodelId,
          idShort: `Submodel_${get().submodels.length + 1}`,
          submodelElements: [],
        };

        const node: Node = {
          id: submodelId,
          type: 'submodelNode',
          position: {
            x: viewportCenter.x - 140 + Math.random() * 40 - 20,
            y: viewportCenter.y - 60 + Math.random() * 40 - 20,
          },
          data: { type: 'submodel', submodel } as SubmodelNodeData,
        };

        set({
          submodels: [...get().submodels, submodel],
          nodes: [...get().nodes, node],
        });
      },

      addSubmodelToShell: (shellId, handlePos) => {
        const { shells, submodels, nodes, edges } = get();
        const shellNode = nodes.find((n) => n.id === shellId);
        if (!shellNode) return;

        const submodelId = generateUrn('submodel');
        const existingSubmodelCount = (shells.find((s) => s.id === shellId)?.submodels ?? []).length;
        const submodel: Submodel = {
          id: submodelId,
          idShort: `Submodel_${submodels.length + 1}`,
          submodelElements: [],
        };

        const { dx, dy } = getPositionOffset(handlePos, existingSubmodelCount, 200);
        const submodelNode: Node = {
          id: submodelId,
          type: 'submodelNode',
          position: {
            x: shellNode.position.x + dx,
            y: shellNode.position.y + dy,
          },
          data: { type: 'submodel', submodel } as SubmodelNodeData,
        };

        const updatedShells = shells.map((s) => {
          if (s.id !== shellId) return s;
          return {
            ...s,
            submodels: [
              ...(s.submodels ?? []),
              {
                type: 'ModelReference' as ReferenceTypes,
                keys: [{ type: 'Submodel', value: submodelId }],
              },
            ],
          };
        });

        const srcPos = handlePos ?? Position.Right;
        const edge: Edge = {
          id: `${shellId}->${submodelId}`,
          source: shellId,
          target: submodelId,
          sourceHandle: `source-${srcPos}`,
          targetHandle: `target-${oppositePosition(srcPos)}`,
          type: 'smoothstep',
          animated: true,
        };

        set({
          shells: updatedShells,
          submodels: [...submodels, submodel],
          nodes: syncNodeData([...nodes, submodelNode], updatedShells, [...submodels, submodel]),
          edges: [...edges, edge],
        });
      },

      updateShellId: (oldId, newId) => {
        if (oldId === newId) return;
        const shells = get().shells.map((s) =>
          s.id === oldId ? { ...s, id: newId } : s,
        );
        const nodes = get().nodes.map((n) =>
          n.id === oldId ? { ...n, id: newId } : n,
        );
        const edges = get().edges.map((e) => ({
          ...e,
          id: e.id.replace(oldId, newId),
          source: e.source === oldId ? newId : e.source,
          target: e.target === oldId ? newId : e.target,
        }));
        set({ shells, nodes: syncNodeData(nodes, shells, get().submodels), edges });
      },

      updateSubmodelId: (oldId, newId) => {
        if (oldId === newId) return;
        const submodels = get().submodels.map((s) =>
          s.id === oldId ? { ...s, id: newId } : s,
        );
        // Update ModelReference keys in shells
        const shells = get().shells.map((s) => ({
          ...s,
          submodels: (s.submodels ?? []).map((ref) => ({
            ...ref,
            keys: ref.keys.map((k) => (k.value === oldId ? { ...k, value: newId } : k)),
          })),
        }));
        const nodes = get().nodes.map((n) => {
          if (n.id === oldId) return { ...n, id: newId };
          // Update submodelId in element nodes
          const data = n.data as AasNodeData;
          if (data.type === 'element' && (data as SubmodelElementNodeData).submodelId === oldId) {
            return { ...n, data: { ...data, submodelId: newId } };
          }
          return n;
        });
        const edges = get().edges.map((e) => ({
          ...e,
          id: e.id.replace(oldId, newId),
          source: e.source === oldId ? newId : e.source,
          target: e.target === oldId ? newId : e.target,
        }));
        set({ shells, submodels, nodes: syncNodeData(nodes, shells, submodels), edges });
      },

      updateShellIdShort: (shellId, idShort) => {
        const shells = get().shells.map((s) =>
          s.id === shellId ? { ...s, idShort } : s,
        );
        set({ shells, nodes: syncNodeData(get().nodes, shells, get().submodels) });
      },

      updateSubmodelIdShort: (submodelId, idShort) => {
        const submodels = get().submodels.map((s) =>
          s.id === submodelId ? { ...s, idShort } : s,
        );
        set({ submodels, nodes: syncNodeData(get().nodes, get().shells, submodels) });
      },

      updateShell: (shellId, changes) => {
        const shells = get().shells.map((s) =>
          s.id === shellId ? { ...s, ...changes, id: s.id } : s,
        );
        set({ shells, nodes: syncNodeData(get().nodes, shells, get().submodels) });
      },

      updateSubmodel: (submodelId, changes) => {
        const submodels = get().submodels.map((s) =>
          s.id === submodelId ? { ...s, ...changes, id: s.id } : s,
        );
        set({ submodels, nodes: syncNodeData(get().nodes, get().shells, submodels) });
        // Refresh semantic edges if CDs visible
        if (get().showConceptDescriptions) {
          const s = get();
          const semEdges = buildSemanticEdges(s.submodels, s.conceptDescriptions, s.nodes);
          set({ edges: [...s.edges.filter((e) => !e.id.startsWith('cd-edge-')), ...semEdges] });
        }
      },

      addSubmodelElement: (parentId, modelType, handlePos) => {
        const { submodels, nodes, edges } = get();

        // Check if parentId is a submodel or a container element
        const isSubmodel = submodels.some((s) => s.id === parentId);
        const parentNode = nodes.find((n) => n.id === parentId);
        if (!parentNode) return;

        let submodelId: string;
        let updatedSubmodels: Submodel[];

        const srcPos = handlePos ?? Position.Right;

        if (isSubmodel) {
          submodelId = parentId;
          const submodel = submodels.find((s) => s.id === parentId);
          const elements = submodel?.submodelElements ?? [];
          const count = elements.filter((e) => e.modelType === modelType).length;
          const newElement = createDefaultElement(modelType, count + 1);

          updatedSubmodels = submodels.map((s) => {
            if (s.id !== parentId) return s;
            return { ...s, submodelElements: [...(s.submodelElements ?? []), newElement] };
          });

          const existingElementCount = elements.length;
          const { dx, dy } = getPositionOffset(handlePos, existingElementCount, 160);
          const elementNode: Node = {
            id: newElement._nodeId!,
            type: 'elementNode',
            position: {
              x: parentNode.position.x + dx,
              y: parentNode.position.y + dy,
            },
            data: { type: 'element', submodelId, element: newElement } as SubmodelElementNodeData,
          };

          const elementEdge: Edge = {
            id: `${parentId}->${newElement._nodeId}`,
            source: parentId,
            target: newElement._nodeId!,
            sourceHandle: `source-${srcPos}`,
            targetHandle: `target-${oppositePosition(srcPos)}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'var(--border-hover)', strokeWidth: 1.5 },
          };

          set({
            submodels: updatedSubmodels,
            nodes: syncNodeData([...nodes, elementNode], get().shells, updatedSubmodels),
            edges: [...edges, elementEdge],
          });
        } else {
          // parentId is a container element _nodeId
          const parentData = parentNode.data as SubmodelElementNodeData;
          submodelId = parentData.submodelId;

          const submodel = submodels.find((s) => s.id === submodelId);
          if (!submodel) return;

          // Count existing children of this type in the container
          const parentElement = findElementByNodeId(submodel.submodelElements ?? [], parentId);
          const children = parentElement ? getContainerChildren(parentElement) : [];
          const count = children.filter((e) => e.modelType === modelType).length;
          const newElement = createDefaultElement(modelType, count + 1);

          updatedSubmodels = submodels.map((s) => {
            if (s.id !== submodelId) return s;
            return { ...s, submodelElements: addToContainer(s.submodelElements ?? [], parentId, newElement) };
          });

          const existingChildCount = children.length;
          const { dx, dy } = getPositionOffset(handlePos, existingChildCount, 160);
          const elementNode: Node = {
            id: newElement._nodeId!,
            type: 'elementNode',
            position: {
              x: parentNode.position.x + dx,
              y: parentNode.position.y + dy,
            },
            data: { type: 'element', submodelId, element: newElement } as SubmodelElementNodeData,
          };

          const elementEdge: Edge = {
            id: `${parentId}->${newElement._nodeId}`,
            source: parentId,
            target: newElement._nodeId!,
            sourceHandle: `source-${srcPos}`,
            targetHandle: `target-${oppositePosition(srcPos)}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'var(--border-hover)', strokeWidth: 1.5 },
          };

          set({
            submodels: updatedSubmodels,
            nodes: syncNodeData([...nodes, elementNode], get().shells, updatedSubmodels),
            edges: [...edges, elementEdge],
          });
        }
      },

      updateSubmodelElement: (submodelId, nodeId, changes) => {
        const submodels = get().submodels.map((s) => {
          if (s.id !== submodelId) return s;
          return {
            ...s,
            submodelElements: mapElements(s.submodelElements ?? [], nodeId, (el) => ({
              ...el,
              ...changes,
              _nodeId: el._nodeId, // preserve _nodeId
            })),
          };
        });
        set({ submodels, nodes: syncNodeData(get().nodes, get().shells, submodels) });
        // Refresh semantic edges if CDs visible
        if (get().showConceptDescriptions) {
          const s = get();
          const semEdges = buildSemanticEdges(s.submodels, s.conceptDescriptions, s.nodes);
          set({ edges: [...s.edges.filter((e) => !e.id.startsWith('cd-edge-')), ...semEdges] });
        }
      },

      removeSubmodelElement: (submodelId, nodeId) => {
        const submodel = get().submodels.find((s) => s.id === submodelId);
        const element = submodel ? findElementByNodeId(submodel.submodelElements ?? [], nodeId) : undefined;
        const idsToRemove = new Set<string>([nodeId]);
        if (element && isContainerElement(element)) {
          collectNodeIds(getContainerChildren(element)).forEach((id) => idsToRemove.add(id));
        }

        const submodels = get().submodels.map((s) => {
          if (s.id !== submodelId) return s;
          return { ...s, submodelElements: filterElements(s.submodelElements ?? [], nodeId) };
        });

        set({
          submodels,
          nodes: get().nodes.filter((n) => !idsToRemove.has(n.id)),
          edges: get().edges.filter((e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target)),
        });
        // Refresh semantic edges if CDs visible
        if (get().showConceptDescriptions) {
          const s = get();
          const semEdges = buildSemanticEdges(s.submodels, s.conceptDescriptions, s.nodes);
          set({ edges: [...s.edges.filter((e) => !e.id.startsWith('cd-edge-')), ...semEdges] });
        }
      },

      addConceptDescription: (viewportCenter) => {
        const cdId = generateUrn('conceptDescription');
        const cd: ConceptDescription = {
          id: cdId,
          idShort: `CD_${get().conceptDescriptions.length + 1}`,
        };

        const node: Node = {
          id: cdId,
          type: 'conceptDescriptionNode',
          position: {
            x: viewportCenter.x - 120 + Math.random() * 40 - 20,
            y: viewportCenter.y - 40 + Math.random() * 40 - 20,
          },
          data: { type: 'conceptDescription', conceptDescription: cd } as ConceptDescriptionNodeData,
        };

        const { showConceptDescriptions } = get();
        set({
          conceptDescriptions: [...get().conceptDescriptions, cd],
          nodes: showConceptDescriptions ? [...get().nodes, node] : get().nodes,
        });
      },

      updateConceptDescriptionField: (cdId, field, value) => {
        if (field === 'id') {
          // Renaming CD id — update nodes and edges
          const oldId = cdId;
          const newId = value as string;
          if (oldId === newId) return;
          const conceptDescriptions = get().conceptDescriptions.map((c) =>
            c.id === oldId ? { ...c, id: newId } : c,
          );
          const nodes = get().nodes.map((n) =>
            n.id === oldId ? { ...n, id: newId } : n,
          );
          const edges = get().edges.map((e) => ({
            ...e,
            id: e.id.replace(oldId, newId),
            source: e.source === oldId ? newId : e.source,
            target: e.target === oldId ? newId : e.target,
          }));
          set({ conceptDescriptions, nodes: syncNodeData(nodes, get().shells, get().submodels, conceptDescriptions), edges });
        } else {
          const conceptDescriptions = get().conceptDescriptions.map((c) =>
            c.id === cdId ? { ...c, [field]: value } : c,
          );
          set({ conceptDescriptions, nodes: syncNodeData(get().nodes, get().shells, get().submodels, conceptDescriptions) });
        }
        // Refresh semantic edges if CDs visible
        if (get().showConceptDescriptions) {
          const s = get();
          const semEdges = buildSemanticEdges(s.submodels, s.conceptDescriptions, s.nodes);
          set({ edges: [...s.edges.filter((e) => !e.id.startsWith('cd-edge-')), ...semEdges] });
        }
      },

      toggleConceptDescriptions: () => {
        const { showConceptDescriptions, conceptDescriptions, nodes, edges, submodels } = get();

        if (showConceptDescriptions) {
          // Hide: remove CD nodes and semantic edges, restore hierarchy edge animation
          set({
            showConceptDescriptions: false,
            nodes: nodes.filter((n) => (n.data as AasNodeData).type !== 'conceptDescription'),
            edges: edges.filter((e) => !e.id.startsWith('cd-edge-')).map((e) => ({ ...e, animated: true })),
          });
        } else {
          // Show: create CD nodes at positions, build semantic edges
          const existingCdNodeIds = new Set(
            nodes.filter((n) => (n.data as AasNodeData).type === 'conceptDescription').map((n) => n.id),
          );

          // Build map: cdId → list of referencing node positions
          const cdRefPositions = new Map<string, { x: number; y: number }[]>();
          function collectRefs(el: SubmodelElement) {
            const semId = el.semanticId?.keys?.[0]?.value;
            if (semId && el._nodeId) {
              const refNode = nodes.find((n) => n.id === el._nodeId);
              if (refNode) {
                if (!cdRefPositions.has(semId)) cdRefPositions.set(semId, []);
                cdRefPositions.get(semId)!.push(refNode.position);
              }
            }
            if (isContainerElement(el)) getContainerChildren(el).forEach(collectRefs);
          }
          for (const sm of submodels) {
            const semId = sm.semanticId?.keys?.[0]?.value;
            if (semId) {
              const smNode = nodes.find((n) => n.id === sm.id);
              if (smNode) {
                if (!cdRefPositions.has(semId)) cdRefPositions.set(semId, []);
                cdRefPositions.get(semId)!.push(smNode.position);
              }
            }
            (sm.submodelElements ?? []).forEach(collectRefs);
          }

          // Fallback position for CDs without references
          let fallbackMaxY = 0;
          let fallbackAvgX = 0;
          if (nodes.length > 0) {
            fallbackMaxY = Math.max(...nodes.map((n) => n.position.y)) + 300;
            fallbackAvgX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
          }

          // Track used Y positions to avoid overlap
          const usedPositions: { x: number; y: number }[] = [];
          let fallbackIdx = 0;

          // Collect all occupied positions (existing nodes) for overlap check
          const occupiedPositions = nodes.map((n) => n.position);

          const newNodes: Node[] = [];
          conceptDescriptions.forEach((cd) => {
            if (existingCdNodeIds.has(cd.id)) return;
            const refs = cdRefPositions.get(cd.id);
            let pos: { x: number; y: number };

            if (refs && refs.length > 0) {
              // Place below the referencing nodes
              const avgX = refs.reduce((s, p) => s + p.x, 0) / refs.length;
              const maxRefY = Math.max(...refs.map((p) => p.y));
              pos = { x: avgX, y: maxRefY + 200 };
            } else {
              pos = { x: fallbackAvgX + fallbackIdx * 300, y: fallbackMaxY };
              fallbackIdx++;
            }

            // Avoid overlapping with ALL nodes (existing + already placed CDs)
            let attempts = 0;
            while (attempts < 50) {
              const overlaps = occupiedPositions.some(
                (used) => Math.abs(pos.x - used.x) < 280 && Math.abs(pos.y - used.y) < 150,
              );
              if (!overlaps) break;
              pos = { ...pos, y: pos.y + 160 };
              attempts++;
            }
            occupiedPositions.push(pos);

            newNodes.push({
              id: cd.id,
              type: 'conceptDescriptionNode',
              position: pos,
              data: { type: 'conceptDescription', conceptDescription: cd } as ConceptDescriptionNodeData,
            });
          });

          const allNodes = [...nodes, ...newNodes];
          const semanticEdges = buildSemanticEdges(submodels, conceptDescriptions, allNodes);

          // Stop hierarchy edge animation, add animated CD edges
          set({
            showConceptDescriptions: true,
            nodes: allNodes,
            edges: [
              ...edges.filter((e) => !e.id.startsWith('cd-edge-')).map((e) => ({ ...e, animated: false })),
              ...semanticEdges,
            ],
          });
        }
      },

      importEnvironment: (jsonString, origin) => {
        // Calculate origin offset to avoid collision with existing nodes
        const { nodes: existingNodes } = get();
        let offsetX = origin.x;
        if (existingNodes.length > 0) {
          const maxX = Math.max(...existingNodes.map((n) => n.position.x + 300));
          offsetX = Math.max(offsetX, maxX + 100);
        }

        const result = importFromJson(jsonString, { x: offsetX, y: origin.y });

        set({
          shells: [...get().shells, ...result.shells],
          submodels: [...get().submodels, ...result.submodels],
          conceptDescriptions: [...get().conceptDescriptions, ...result.conceptDescriptions],
          nodes: [...get().nodes, ...result.nodes],
          edges: [...get().edges, ...result.edges],
        });
      },

      deleteNode: (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const data = node.data as AasNodeData;

        if (data.type === 'conceptDescription') {
          set({
            conceptDescriptions: get().conceptDescriptions.filter((c) => c.id !== nodeId),
            nodes: get().nodes.filter((n) => n.id !== nodeId),
            edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          });
          return;
        }

        if (data.type === 'element') {
          const elemData = data as SubmodelElementNodeData;
          get().removeSubmodelElement(elemData.submodelId, elemData.element._nodeId!);
          return;
        }

        if (data.type === 'submodel') {
          const submodel = get().submodels.find((s) => s.id === nodeId);
          const elementNodeIds = submodel ? collectNodeIds(submodel.submodelElements ?? []) : [];
          const idsToRemove = new Set([nodeId, ...elementNodeIds]);

          set({
            shells: get().shells.map((s) => ({
              ...s,
              submodels: (s.submodels ?? []).filter((ref) => ref.keys[0]?.value !== nodeId),
            })),
            submodels: get().submodels.filter((s) => s.id !== nodeId),
            nodes: syncNodeData(
              get().nodes.filter((n) => !idsToRemove.has(n.id)),
              get().shells,
              get().submodels.filter((s) => s.id !== nodeId),
            ),
            edges: get().edges.filter(
              (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target),
            ),
          });
          // Refresh semantic edges if CDs visible
          if (get().showConceptDescriptions) {
            const s = get();
            const semEdges = buildSemanticEdges(s.submodels, s.conceptDescriptions, s.nodes);
            set({ edges: [...s.edges.filter((e) => !e.id.startsWith('cd-edge-')), ...semEdges] });
          }
          return;
        }

        // AAS node — cascade delete connected submodels + elements
        const shell = get().shells.find((s) => s.id === nodeId);
        const connectedSmIds = (shell?.submodels ?? [])
          .map((ref) => ref.keys[0]?.value)
          .filter(Boolean);
        const idsToRemove = new Set<string>([nodeId]);
        for (const smId of connectedSmIds) {
          idsToRemove.add(smId);
          const sm = get().submodels.find((s) => s.id === smId);
          if (sm) {
            collectNodeIds(sm.submodelElements ?? []).forEach((id) => idsToRemove.add(id));
          }
        }

        set({
          shells: get().shells.filter((s) => s.id !== nodeId),
          submodels: get().submodels.filter((s) => !connectedSmIds.includes(s.id)),
          nodes: get().nodes.filter((n) => !idsToRemove.has(n.id)),
          edges: get().edges.filter(
            (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target),
          ),
        });
        // Refresh semantic edges if CDs visible
        if (get().showConceptDescriptions) {
          const s = get();
          const semEdges = buildSemanticEdges(s.submodels, s.conceptDescriptions, s.nodes);
          set({ edges: [...s.edges.filter((e) => !e.id.startsWith('cd-edge-')), ...semEdges] });
        }
      },

      duplicateNode: (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const data = node.data as AasNodeData;
        const offset = { x: node.position.x + 40, y: node.position.y + 40 };

        if (data.type === 'aas') {
          const newId = generateUrn('shell');
          const shell: AssetAdministrationShell = {
            ...(data as AASNodeData).shell,
            id: newId,
            idShort: `${(data as AASNodeData).shell.idShort}_copy`,
            submodels: [],
          };
          set({
            shells: [...get().shells, shell],
            nodes: [
              ...get().nodes,
              { ...node, id: newId, position: offset, data: { type: 'aas', shell } as AASNodeData },
            ],
          });
        } else if (data.type === 'submodel') {
          const newId = generateUrn('submodel');
          const submodel: Submodel = {
            ...(data as SubmodelNodeData).submodel,
            id: newId,
            idShort: `${(data as SubmodelNodeData).submodel.idShort}_copy`,
            submodelElements: [],
          };
          set({
            submodels: [...get().submodels, submodel],
            nodes: [
              ...get().nodes,
              { ...node, id: newId, position: offset, data: { type: 'submodel', submodel } as SubmodelNodeData },
            ],
          });
        } else if (data.type === 'conceptDescription') {
          const newId = generateUrn('conceptDescription');
          const cd: ConceptDescription = {
            ...(data as ConceptDescriptionNodeData).conceptDescription,
            id: newId,
            idShort: `${(data as ConceptDescriptionNodeData).conceptDescription.idShort}_copy`,
          };
          set({
            conceptDescriptions: [...get().conceptDescriptions, cd],
            nodes: [
              ...get().nodes,
              { ...node, id: newId, position: offset, data: { type: 'conceptDescription', conceptDescription: cd } as ConceptDescriptionNodeData },
            ],
          });
        } else if (data.type === 'element') {
          const elemData = data as SubmodelElementNodeData;
          const newNodeId = generateId();
          const newElement: SubmodelElement = {
            ...elemData.element,
            _nodeId: newNodeId,
            idShort: `${elemData.element.idShort}_copy`,
          };

          const submodels = get().submodels.map((s) => {
            if (s.id !== elemData.submodelId) return s;
            return { ...s, submodelElements: [...(s.submodelElements ?? []), newElement] };
          });

          const newNode: Node = {
            ...node,
            id: newNodeId,
            position: offset,
            data: { type: 'element', submodelId: elemData.submodelId, element: newElement } as SubmodelElementNodeData,
          };

          const newEdge: Edge = {
            id: `${elemData.submodelId}->${newNodeId}`,
            source: elemData.submodelId,
            target: newNodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'var(--border-hover)', strokeWidth: 1.5 },
          };

          set({
            submodels,
            nodes: [...get().nodes, newNode],
            edges: [...get().edges, newEdge],
          });
        }
      },

      // --- Canvas persistence ---

      loadCanvas: (data) => {
        set({
          shells: data.shells ?? [],
          submodels: data.submodels ?? [],
          conceptDescriptions: data.conceptDescriptions ?? [],
          nodes: data.nodes ?? [],
          edges: data.edges ?? [],
          showConceptDescriptions: data.showConceptDescriptions ?? false,
        });
        // Reset undo history after loading
        useAasStore.temporal.getState().clear();
      },

      clearCanvas: () => {
        set({
          shells: [],
          submodels: [],
          conceptDescriptions: [],
          nodes: [],
          edges: [],
          showConceptDescriptions: false,
        });
        useAasStore.temporal.getState().clear();
      },
    }),
    {
      partialize: (state) => ({
        shells: state.shells,
        submodels: state.submodels,
        conceptDescriptions: state.conceptDescriptions,
        nodes: state.nodes,
        edges: state.edges,
        showConceptDescriptions: state.showConceptDescriptions,
      }),
      limit: 50,
    },
  ),
);
