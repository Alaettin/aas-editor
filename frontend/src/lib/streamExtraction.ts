import { useExtractionStore } from '../store/extractionStore';
import { useAiStore } from '../store/aiStore';
import { useAasStore } from '../store/aasStore';
import { extractText, extractImages, isImageFile } from './extractText';
import { classifyDocument } from './classifyDocument';
import { generateAas, type StreamCallbacks } from './generateAas';
import { postProcess } from './postProcess';
import type { Node, Edge } from '@xyflow/react';

// ─── Mapping helpers ───

/**
 * Strip values from submodel elements to create a clean schema for the AI.
 * Keeps structure (idShort, modelType, valueType, nested children) but clears values.
 */
function stripValues(elements: Record<string, unknown>[]): Record<string, unknown>[] {
  return elements.map((el) => {
    const clean: Record<string, unknown> = {
      idShort: el.idShort,
      modelType: el.modelType,
    };
    if (el.semanticId) clean.semanticId = el.semanticId;
    if (el.valueType) clean.valueType = el.valueType;
    if (el.modelType === 'Range') {
      clean.min = '';
      clean.max = '';
    } else if (el.modelType === 'MultiLanguageProperty') {
      clean.value = [];
    } else if (
      (el.modelType === 'SubmodelElementCollection' || el.modelType === 'SubmodelElementList') &&
      Array.isArray(el.value)
    ) {
      clean.value = stripValues(el.value as Record<string, unknown>[]);
    } else {
      clean.value = '';
    }
    return clean;
  });
}

/**
 * Collect all semanticId values from a submodel and its elements (recursively).
 */
function collectSemanticIds(sm: Record<string, unknown>): Set<string> {
  const ids = new Set<string>();
  function addRef(ref: unknown) {
    if (ref && typeof ref === 'object' && 'keys' in (ref as Record<string, unknown>)) {
      const keys = (ref as { keys: { value: string }[] }).keys;
      if (Array.isArray(keys)) {
        for (const k of keys) if (k.value) ids.add(k.value);
      }
    }
  }
  addRef(sm.semanticId);
  function scanElements(elements: unknown[]) {
    for (const el of elements) {
      if (!el || typeof el !== 'object') continue;
      const e = el as Record<string, unknown>;
      addRef(e.semanticId);
      if (Array.isArray(e.value)) scanElements(e.value);
    }
  }
  if (Array.isArray(sm.submodelElements)) scanElements(sm.submodelElements);
  return ids;
}

// ─── Ghost node/edge helpers ───

let ghostCounter = 0;

function makeGhostId(prefix: string): string {
  return `ghost_${prefix}_${++ghostCounter}`;
}

function createGhostAasNode(
  idShort: string,
  id: string,
  position: { x: number; y: number },
): { node: Node; edge?: undefined } {
  const nodeId = makeGhostId('aas');
  return {
    node: {
      id: nodeId,
      type: 'aasNode',
      position,
      data: {
        type: 'aas',
        isGhost: true,
        shell: {
          id,
          idShort,
          modelType: 'AssetAdministrationShell',
          assetInformation: { assetKind: 'Type', globalAssetId: '' },
        },
      },
    },
  };
}

function createGhostSubmodelNode(
  idShort: string,
  id: string,
  parentNodeId: string,
  position: { x: number; y: number },
): { node: Node; edge: Edge } {
  const nodeId = makeGhostId('sm');
  return {
    node: {
      id: nodeId,
      type: 'submodelNode',
      position,
      data: {
        type: 'submodel',
        isGhost: true,
        submodel: { id, idShort, modelType: 'Submodel', submodelElements: [] },
        submodelId: nodeId,
      },
    },
    edge: {
      id: `ghost-edge-${parentNodeId}-${nodeId}`,
      source: parentNodeId,
      target: nodeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--border-hover)', strokeWidth: 2, strokeDasharray: '6 3' },
    },
  };
}

// ─── Main orchestration ───

/**
 * Phase 1: Start classification + text extraction in parallel.
 * Called when user drops a file on canvas.
 */
export async function startClassification(file: File): Promise<void> {
  const store = useExtractionStore.getState();
  const ai = useAiStore.getState();

  store.setPhase('classifying');
  store.setPdfFile(file);

  try {
    // Run classification and text extraction in parallel
    const classifyPromise = classifyDocument(file, {
      provider: ai.provider,
      model: ai.model,
      apiKey: ai.apiKey,
    });

    const textPromise = isImageFile(file.name)
      ? Promise.resolve('')
      : extractText(file).catch(() => '');

    const [classification, pdfText] = await Promise.all([classifyPromise, textPromise]);

    store.setClassification(classification);
    store.setPdfText(pdfText);
    store.setPhase('configuring');
  } catch (err) {
    store.reset();
    throw err;
  }
}

/**
 * Phase 2: Run the extraction (streaming) after user confirms in ClassificationDialog.
 * Creates ghost nodes on the canvas as data arrives.
 */
export async function runExtraction(): Promise<void> {
  const exStore = useExtractionStore.getState();
  const ai = useAiStore.getState();
  const file = exStore.pdfFile;
  if (!file) throw new Error('Keine Datei vorhanden');

  exStore.setPhase('extracting');
  ghostCounter = 0;

  const dropPos = exStore.dropPosition;

  // Prepare images if vision is enabled
  let text = exStore.pdfText;
  let images: string[] | undefined;
  const useImages = ai.imageAnalysis && (isImageFile(file.name) || file.name.endsWith('.pdf'));

  if (useImages) {
    images = await extractImages(file);
  }
  if (!text && !images?.length) {
    text = await extractText(file);
  }

  // Enrich prompt with classification context
  const classification = exStore.classification;
  let contextPrefix = '';
  if (classification) {
    contextPrefix = `Kontext: Dokumenttyp="${classification.documentType}", Produkt="${classification.productName}", Hersteller="${classification.manufacturer}", Artikelnr="${classification.productId}".\n\n`;
  }

  // Create initial ghost AAS node from classification data (no LLM needed)
  const aasIdShort = classification
    ? `AAS_${classification.productName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40)}`
    : 'AAS_Extracted';
  const aasId = `urn:example:aas:${Date.now()}`;
  const { node: aasGhost } = createGhostAasNode(aasIdShort, aasId, { ...dropPos });

  const initialNodes: Node[] = [aasGhost];
  const initialEdges: Edge[] = [];
  useExtractionStore.getState().setGhostNodes(initialNodes, initialEdges);

  // Track partial JSON to detect new submodels appearing during streaming
  let lastSubmodelCount = 0;

  const callbacks: StreamCallbacks = {
    onChunk: (partialJson: string) => {
      // Try to detect submodel names appearing in the stream
      try {
        // Count occurrences of "idShort" at the submodel level
        const matches = partialJson.match(/"idShort"\s*:\s*"([^"]+)"/g);
        if (matches && matches.length > lastSubmodelCount + 1) {
          // +1 because first idShort is from the submodel wrapper itself
          const newCount = matches.length - 1; // minus the top-level submodel idShort
          if (newCount > lastSubmodelCount) {
            // We detected new submodel-level elements appearing
            lastSubmodelCount = newCount;
          }
        }
      } catch { /* parsing incomplete JSON is expected to fail */ }
    },
  };

  // Prepare mapping schemas if mapping mode is active
  let mappingSchemas: Record<string, unknown>[] | undefined;
  let mappingConceptDescriptions: Record<string, unknown>[] | undefined;
  if (exStore.targetMode === 'mapping' && exStore.selectedSubmodelIds.length > 0) {
    // Collect submodels and CDs from all projects (fetched during classification dialog)
    const allSubmodels = exStore.allProjectSubmodels.flatMap((p) => p.submodels);
    const allCDs = exStore.allProjectSubmodels.flatMap((p) => p.conceptDescriptions);

    mappingSchemas = exStore.selectedSubmodelIds
      .map((id) => allSubmodels.find((sm) => sm.id === id))
      .filter(Boolean)
      .map((sm) => {
        const schema = {
          idShort: sm!.idShort,
          id: sm!.id,
          semanticId: sm!.semanticId,
          submodelElements: stripValues((sm!.submodelElements ?? []) as Record<string, unknown>[]),
        };
        return schema;
      });

    // Collect all semanticId references from selected submodels and find matching CDs
    const referencedIds = new Set<string>();
    for (const schema of mappingSchemas) {
      for (const id of collectSemanticIds(schema)) referencedIds.add(id);
    }
    if (referencedIds.size > 0 && allCDs.length > 0) {
      mappingConceptDescriptions = allCDs
        .filter((cd) => referencedIds.has(cd.id))
        .map((cd) => ({
          id: cd.id,
          idShort: cd.idShort,
          embeddedDataSpecifications: cd.embeddedDataSpecifications,
        }));
    }
  }

  try {
    const result = await generateAas(
      contextPrefix + text,
      { provider: ai.provider, model: ai.model, apiKey: ai.apiKey, images, mappingSchemas, mappingConceptDescriptions },
      callbacks,
    );

    // Run post-processing (includes JSON repair)
    useExtractionStore.getState().setPhase('postprocessing');
    const { processed, metadata } = postProcess(result.json, exStore.pdfText);
    useExtractionStore.getState().setMetadata(metadata);
    useExtractionStore.getState().setCorrections(metadata.corrections);

    // Store the post-processed JSON (this is what commitGhostNodes uses)
    useExtractionStore.getState().setExtractedJson(processed as Record<string, unknown>);

    // Build ghost nodes from the processed result
    buildGhostNodesFromResult(processed as Record<string, unknown>, dropPos);

    useExtractionStore.getState().setPhase('preview');
  } catch (err) {
    useExtractionStore.getState().reset();
    throw err;
  }
}

/**
 * Normalize extraction JSON: handles both singular (aas/submodel) and
 * plural (assetAdministrationShells/submodels) formats that the AI might return.
 */
function normalizeExtractionJson(json: Record<string, unknown>): {
  aas: Record<string, unknown> | undefined;
  submodels: Record<string, unknown>[];
} {
  // AAS: singular object or array
  let aas = json.aas as Record<string, unknown> | undefined;
  if (!aas && Array.isArray(json.assetAdministrationShells) && json.assetAdministrationShells.length > 0) {
    aas = json.assetAdministrationShells[0] as Record<string, unknown>;
  }

  // Submodel(s): singular object, plural array, or standard AAS format
  const submodels: Record<string, unknown>[] = [];
  if (json.submodel && typeof json.submodel === 'object' && !Array.isArray(json.submodel)) {
    submodels.push(json.submodel as Record<string, unknown>);
  }
  if (Array.isArray(json.submodels)) {
    for (const sm of json.submodels) {
      if (sm && typeof sm === 'object') submodels.push(sm as Record<string, unknown>);
    }
  }

  return { aas, submodels };
}

/**
 * Build complete ghost node tree from the final extraction result.
 */
function buildGhostNodesFromResult(
  json: Record<string, unknown>,
  dropPos: { x: number; y: number },
): void {
  ghostCounter = 0;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const { aas, submodels } = normalizeExtractionJson(json);

  // AAS node
  const aasIdShort = (aas?.idShort as string) || 'AAS_Extracted';
  const aasId = (aas?.id as string) || `urn:example:aas:${Date.now()}`;
  const { node: aasNode } = createGhostAasNode(aasIdShort, aasId, { ...dropPos });

  // Attach full shell data
  if (aas) {
    (aasNode.data as Record<string, unknown>).shell = {
      ...aas,
      id: aasId,
      modelType: 'AssetAdministrationShell',
    };
  }
  nodes.push(aasNode);

  // Submodel nodes (supports multiple submodels)
  let smYOffset = 0;
  for (const submodel of submodels) {
    const smIdShort = (submodel.idShort as string) || 'TechnicalData';
    const smId = (submodel.id as string) || `urn:example:submodel:${Date.now()}_${smYOffset}`;
    const smPos = { x: dropPos.x, y: dropPos.y + 160 + smYOffset };
    const { node: smNode, edge: smEdge } = createGhostSubmodelNode(smIdShort, smId, aasNode.id, smPos);

    // Attach full submodel data
    (smNode.data as Record<string, unknown>).submodel = {
      ...submodel,
      id: smId,
      modelType: 'Submodel',
    };
    nodes.push(smNode);
    edges.push(smEdge);

    // Element nodes (flattened first level only — deeper nesting stays inside the submodel data)
    const elements = (submodel.submodelElements as Record<string, unknown>[]) || [];
    let elemYOffset = 0;
    for (const elem of elements) {
      const elemIdShort = (elem.idShort as string) || 'Element';
      const elemNodeId = makeGhostId('elem');
      const elemPos = { x: smPos.x + 300, y: smPos.y + elemYOffset };

      nodes.push({
        id: elemNodeId,
        type: 'elementNode',
        position: elemPos,
        data: {
          type: 'element',
          isGhost: true,
          element: { ...elem, _nodeId: elemNodeId },
          submodelId: smNode.id,
        },
      });

      edges.push({
        id: `ghost-edge-${smNode.id}-${elemNodeId}`,
        source: smNode.id,
        target: elemNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--border-hover)', strokeWidth: 2, strokeDasharray: '6 3' },
      });

      elemYOffset += 80;
    }

    smYOffset += 160 + elemYOffset + 40;
  }

  useExtractionStore.getState().setGhostNodes(nodes, edges);
}

/**
 * Phase 3: Commit ghost nodes → real nodes in aasStore.
 * Transforms extraction format { aas, submodel } → standard AAS environment
 * format { assetAdministrationShells, submodels } for importEnvironment.
 */
export function commitGhostNodes(): void {
  const store = useExtractionStore.getState();
  const { extractedJson } = store;
  if (!extractedJson) return;

  const aasStore = useAasStore.getState();
  const dropPos = store.dropPosition;

  const { aas, submodels } = normalizeExtractionJson(extractedJson);

  const envSubmodels = submodels.map((sm) => ({
    ...sm,
    modelType: 'Submodel',
  }));

  const environment = {
    assetAdministrationShells: aas ? [{
      ...aas,
      modelType: 'AssetAdministrationShell',
      submodels: envSubmodels.map((sm) => ({
        type: 'ModelReference',
        keys: [{ type: 'Submodel', value: sm.id || `urn:example:submodel:${Date.now()}` }],
      })),
    }] : [],
    submodels: envSubmodels,
    conceptDescriptions: [],
  };

  aasStore.importEnvironment(JSON.stringify(environment), dropPos);
  useExtractionStore.getState().reset();
}

/**
 * Discard ghost nodes and reset extraction.
 */
export function discardGhostNodes(): void {
  useExtractionStore.getState().reset();
}
