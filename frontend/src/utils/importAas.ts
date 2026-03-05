import type { Node, Edge } from '@xyflow/react';
import type {
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  ConceptDescription,
} from '../types/aas';
import type { AASNodeData, SubmodelNodeData, SubmodelElementNodeData } from '../store/aasStore';
import { generateId } from './ids';

// --- Layout constants (variable per node type) ---

const WIDTHS = {
  aas: 300,
  submodel: 300,
  element: 260,
  container: 280,
};

const HEIGHTS = {
  aas: 140,
  submodel: 130,
  element: 100,
  container: 100,
};

const VERTICAL_GAP = 80;
const SIBLING_GAP = 50;

function getElementWidth(el: SubmodelElement): number {
  return isContainer(el) ? WIDTHS.container : WIDTHS.element;
}

function getElementHeight(el: SubmodelElement): number {
  return isContainer(el) ? HEIGHTS.container : HEIGHTS.element;
}

// --- Assign _nodeId to all SubmodelElements recursively ---

function assignNodeIds(elements: SubmodelElement[]): SubmodelElement[] {
  return elements.map((el) => {
    const withId = { ...el, _nodeId: generateId() };
    if (isContainer(el) && Array.isArray(getChildren(el))) {
      (withId as { value: SubmodelElement[] }).value = assignNodeIds(getChildren(el));
    }
    return withId;
  });
}

function isContainer(el: SubmodelElement): boolean {
  return el.modelType === 'SubmodelElementCollection' || el.modelType === 'SubmodelElementList';
}

function getChildren(el: SubmodelElement): SubmodelElement[] {
  return (el as { value?: SubmodelElement[] }).value ?? [];
}

// --- Calculate subtree width (bottom-up) ---

function calcElementSubtreeWidth(elements: SubmodelElement[]): number {
  if (elements.length === 0) return WIDTHS.element;

  let totalWidth = 0;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const elWidth = getElementWidth(el);
    if (isContainer(el) && getChildren(el).length > 0) {
      totalWidth += Math.max(calcElementSubtreeWidth(getChildren(el)), elWidth);
    } else {
      totalWidth += elWidth;
    }
    if (i < elements.length - 1) totalWidth += SIBLING_GAP;
  }
  return totalWidth;
}

function calcSubmodelSubtreeWidth(sm: Submodel): number {
  const elements = sm.submodelElements ?? [];
  if (elements.length === 0) return WIDTHS.submodel;
  return Math.max(calcElementSubtreeWidth(elements), WIDTHS.submodel);
}

// --- Main import function ---

export interface ImportResult {
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
  nodes: Node[];
  edges: Edge[];
}

export function importFromJson(jsonString: string, origin: { x: number; y: number }): ImportResult {
  const env = JSON.parse(jsonString);

  const shells: AssetAdministrationShell[] = env.assetAdministrationShells ?? [];
  const conceptDescriptions: ConceptDescription[] = env.conceptDescriptions ?? [];

  // Assign _nodeId to all elements
  const submodels: Submodel[] = (env.submodels ?? []).map((sm: Submodel) => ({
    ...sm,
    submodelElements: sm.submodelElements ? assignNodeIds(sm.submodelElements) : [],
  }));

  const { nodes, edges } = layoutExisting(shells, submodels, origin);

  return { shells, submodels, conceptDescriptions, nodes, edges };
}

// --- Reusable layout: compute nodes+edges from existing shells & submodels ---

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export function layoutExisting(
  shells: AssetAdministrationShell[],
  submodels: Submodel[],
  origin: { x: number; y: number },
): LayoutResult {
  const submodelIdSet = new Set(submodels.map((sm) => sm.id));
  const submodelMap = new Map(submodels.map((sm) => [sm.id, sm]));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Collect referenced submodel IDs per shell
  const shellSubmodelIds = new Map<string, string[]>();
  const referencedSmIds = new Set<string>();

  for (const shell of shells) {
    const smIds: string[] = [];
    for (const ref of shell.submodels ?? []) {
      const smId = ref.keys?.[0]?.value;
      if (smId && submodelIdSet.has(smId)) {
        smIds.push(smId);
        referencedSmIds.add(smId);
      }
    }
    shellSubmodelIds.set(shell.id, smIds);
  }

  // Standalone submodels (not referenced by any AAS)
  const standaloneSubmodels = submodels.filter((sm) => !referencedSmIds.has(sm.id));

  // Calculate total width for each AAS tree
  let currentX = origin.x;

  for (const shell of shells) {
    const smIds = shellSubmodelIds.get(shell.id) ?? [];
    const sms = smIds.map((id) => submodelMap.get(id)!).filter(Boolean);

    // Width of the AAS tree = sum of its submodel subtrees
    let aasTreeWidth = 0;
    for (let i = 0; i < sms.length; i++) {
      aasTreeWidth += calcSubmodelSubtreeWidth(sms[i]);
      if (i < sms.length - 1) aasTreeWidth += SIBLING_GAP;
    }
    aasTreeWidth = Math.max(aasTreeWidth, WIDTHS.aas);

    const aasCenterX = currentX + aasTreeWidth / 2;

    // AAS node at top, centered
    nodes.push({
      id: shell.id,
      type: 'aasNode',
      position: { x: aasCenterX - WIDTHS.aas / 2, y: origin.y },
      data: { type: 'aas', shell } as AASNodeData,
    });

    const smY = origin.y + HEIGHTS.aas + VERTICAL_GAP;

    // Layout submodels below AAS
    let smX = currentX;
    for (const sm of sms) {
      const smTreeWidth = calcSubmodelSubtreeWidth(sm);
      const smCenterX = smX + smTreeWidth / 2;

      nodes.push({
        id: sm.id,
        type: 'submodelNode',
        position: { x: smCenterX - WIDTHS.submodel / 2, y: smY },
        data: { type: 'submodel', submodel: sm } as SubmodelNodeData,
      });

      edges.push({
        id: `${shell.id}->${sm.id}`,
        source: shell.id,
        target: sm.id,
        sourceHandle: 'source-bottom',
        targetHandle: 'target-top',
        type: 'smoothstep',
        animated: true,
      });

      // Layout elements below submodel
      if (sm.submodelElements && sm.submodelElements.length > 0) {
        layoutElementsHorizontally(
          sm.submodelElements,
          sm.id,
          smX,
          smY + HEIGHTS.submodel + VERTICAL_GAP,
          sm.id,
          nodes,
          edges,
        );
      }

      smX += smTreeWidth + SIBLING_GAP;
    }

    currentX += aasTreeWidth + SIBLING_GAP * 2;
  }

  // Layout standalone submodels
  for (const sm of standaloneSubmodels) {
    const smTreeWidth = calcSubmodelSubtreeWidth(sm);
    const smCenterX = currentX + smTreeWidth / 2;

    nodes.push({
      id: sm.id,
      type: 'submodelNode',
      position: { x: smCenterX - WIDTHS.submodel / 2, y: origin.y },
      data: { type: 'submodel', submodel: sm } as SubmodelNodeData,
    });

    if (sm.submodelElements && sm.submodelElements.length > 0) {
      layoutElementsHorizontally(
        sm.submodelElements,
        sm.id,
        currentX,
        origin.y + HEIGHTS.submodel + VERTICAL_GAP,
        sm.id,
        nodes,
        edges,
      );
    }

    currentX += smTreeWidth + SIBLING_GAP * 2;
  }

  return { nodes, edges };
}

// --- Layout elements horizontally at a given Y level, centered under parent ---

function layoutElementsHorizontally(
  elements: SubmodelElement[],
  parentId: string,
  startX: number,
  y: number,
  submodelId: string,
  nodes: Node[],
  edges: Edge[],
): void {
  let x = startX;

  for (const el of elements) {
    const nodeId = el._nodeId!;
    const elWidth = getElementWidth(el);
    const elHeight = getElementHeight(el);
    const children = isContainer(el) ? getChildren(el) : [];
    const subtreeW = children.length > 0 ? Math.max(calcElementSubtreeWidth(children), elWidth) : elWidth;
    const centerX = x + subtreeW / 2;

    nodes.push({
      id: nodeId,
      type: 'elementNode',
      position: { x: centerX - elWidth / 2, y },
      data: { type: 'element', submodelId, element: el } as SubmodelElementNodeData,
    });

    edges.push({
      id: `${parentId}->${nodeId}`,
      source: parentId,
      target: nodeId,
      sourceHandle: 'source-bottom',
      targetHandle: 'target-top',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--border-hover)', strokeWidth: 1.5 },
    });

    // Recurse into container children
    if (children.length > 0) {
      layoutElementsHorizontally(children, nodeId, x, y + elHeight + VERTICAL_GAP, submodelId, nodes, edges);
    }

    x += subtreeW + SIBLING_GAP;
  }
}
