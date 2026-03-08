import { describe, it, expect, beforeEach } from 'vitest';
import { useExtractionStore } from '../extractionStore';
import type { ClassificationResult, ExtractionMetadata, Correction, ReviewState, ProjectSubmodels } from '../extractionStore';
import type { Node, Edge } from '@xyflow/react';

const initialState = {
  phase: 'idle' as const,
  classification: null,
  pdfText: '',
  pdfFile: null,
  ghostNodes: [],
  ghostEdges: [],
  metadata: null,
  corrections: [],
  reviewState: {},
  dropPosition: { x: 0, y: 0 },
  extractedJson: null,
  targetMode: 'new' as const,
  selectedSubmodelIds: [],
  allProjectSubmodels: [],
};

describe('extractionStore', () => {
  beforeEach(() => {
    useExtractionStore.setState(initialState);
  });

  it('setPhase sets phase', () => {
    useExtractionStore.getState().setPhase('classifying');
    expect(useExtractionStore.getState().phase).toBe('classifying');
  });

  it('setClassification sets classification object', () => {
    const classification: ClassificationResult = {
      documentType: 'technical_datasheet',
      productName: 'Widget',
      productId: 'W-001',
      manufacturer: 'Acme',
      productCategory: 'Sensors',
      language: 'en',
      pageCount: 5,
      confidence: 0.95,
    };
    useExtractionStore.getState().setClassification(classification);
    expect(useExtractionStore.getState().classification).toEqual(classification);
  });

  it('updateClassification merges partial into existing classification', () => {
    const classification: ClassificationResult = {
      documentType: 'nameplate',
      productName: 'Old Name',
      productId: 'P-1',
      manufacturer: 'Maker',
      productCategory: 'Cat',
      language: 'de',
      pageCount: 1,
      confidence: 0.8,
    };
    useExtractionStore.setState({ classification });
    useExtractionStore.getState().updateClassification({ productName: 'New Name', confidence: 0.99 });
    const result = useExtractionStore.getState().classification!;
    expect(result.productName).toBe('New Name');
    expect(result.confidence).toBe(0.99);
    expect(result.manufacturer).toBe('Maker');
  });

  it('updateClassification does nothing when classification is null', () => {
    useExtractionStore.getState().updateClassification({ productName: 'Test' });
    expect(useExtractionStore.getState().classification).toBeNull();
  });

  it('setPdfText sets text', () => {
    useExtractionStore.getState().setPdfText('Hello PDF');
    expect(useExtractionStore.getState().pdfText).toBe('Hello PDF');
  });

  it('setPdfFile sets file', () => {
    const file = new File([''], 'test.pdf');
    useExtractionStore.getState().setPdfFile(file);
    expect(useExtractionStore.getState().pdfFile).toBe(file);
  });

  it('setDropPosition sets position', () => {
    useExtractionStore.getState().setDropPosition({ x: 100, y: 200 });
    expect(useExtractionStore.getState().dropPosition).toEqual({ x: 100, y: 200 });
  });

  it('addGhostNode appends to ghostNodes array', () => {
    const node1 = { id: 'n1', position: { x: 0, y: 0 }, data: {} } as Node;
    const node2 = { id: 'n2', position: { x: 1, y: 1 }, data: {} } as Node;
    useExtractionStore.getState().addGhostNode(node1);
    useExtractionStore.getState().addGhostNode(node2);
    expect(useExtractionStore.getState().ghostNodes).toHaveLength(2);
    expect(useExtractionStore.getState().ghostNodes[0].id).toBe('n1');
    expect(useExtractionStore.getState().ghostNodes[1].id).toBe('n2');
  });

  it('addGhostEdge appends to ghostEdges array', () => {
    const edge1 = { id: 'e1', source: 'a', target: 'b' } as Edge;
    const edge2 = { id: 'e2', source: 'c', target: 'd' } as Edge;
    useExtractionStore.getState().addGhostEdge(edge1);
    useExtractionStore.getState().addGhostEdge(edge2);
    expect(useExtractionStore.getState().ghostEdges).toHaveLength(2);
    expect(useExtractionStore.getState().ghostEdges[1].id).toBe('e2');
  });

  it('setGhostNodes sets both arrays at once', () => {
    const nodes = [{ id: 'n1', position: { x: 0, y: 0 }, data: {} } as Node];
    const edges = [{ id: 'e1', source: 'a', target: 'b' } as Edge];
    useExtractionStore.getState().setGhostNodes(nodes, edges);
    expect(useExtractionStore.getState().ghostNodes).toEqual(nodes);
    expect(useExtractionStore.getState().ghostEdges).toEqual(edges);
  });

  it('setMetadata sets metadata', () => {
    const metadata: ExtractionMetadata = {
      extractedProperties: 10,
      skippedItems: ['item1'],
      confidence: 0.9,
      warnings: ['warn1'],
      corrections: [],
      hallucinationSuspects: 2,
    };
    useExtractionStore.getState().setMetadata(metadata);
    expect(useExtractionStore.getState().metadata).toEqual(metadata);
  });

  it('setCorrections sets corrections array', () => {
    const corrections: Correction[] = [
      { type: 'typo', field: 'name' },
      { type: 'value', field: 'id' },
    ];
    useExtractionStore.getState().setCorrections(corrections);
    expect(useExtractionStore.getState().corrections).toEqual(corrections);
  });

  it('setExtractedJson sets json', () => {
    const json = { submodels: [{ idShort: 'sm1' }] };
    useExtractionStore.getState().setExtractedJson(json);
    expect(useExtractionStore.getState().extractedJson).toEqual(json);
  });

  it('setReviewState sets entire review state', () => {
    const reviewState: ReviewState = { prop1: true, prop2: false };
    useExtractionStore.getState().setReviewState(reviewState);
    expect(useExtractionStore.getState().reviewState).toEqual(reviewState);
  });

  it('toggleReviewItem toggles from undefined to true', () => {
    useExtractionStore.getState().toggleReviewItem('prop1');
    expect(useExtractionStore.getState().reviewState.prop1).toBe(true);
  });

  it('toggleReviewItem toggles from true to false', () => {
    useExtractionStore.setState({ reviewState: { prop1: true } });
    useExtractionStore.getState().toggleReviewItem('prop1');
    expect(useExtractionStore.getState().reviewState.prop1).toBe(false);
  });

  it('setTargetMode changes mode', () => {
    useExtractionStore.getState().setTargetMode('mapping');
    expect(useExtractionStore.getState().targetMode).toBe('mapping');
  });

  it('toggleSubmodelId adds ID when not present', () => {
    useExtractionStore.getState().toggleSubmodelId('sm-1');
    expect(useExtractionStore.getState().selectedSubmodelIds).toEqual(['sm-1']);
  });

  it('toggleSubmodelId removes ID when already present', () => {
    useExtractionStore.setState({ selectedSubmodelIds: ['sm-1', 'sm-2'] });
    useExtractionStore.getState().toggleSubmodelId('sm-1');
    expect(useExtractionStore.getState().selectedSubmodelIds).toEqual(['sm-2']);
  });

  it('setAllProjectSubmodels sets project submodels', () => {
    const data: ProjectSubmodels[] = [
      {
        projectId: 'p1',
        projectName: 'Project 1',
        submodels: [],
        conceptDescriptions: [],
      },
    ];
    useExtractionStore.getState().setAllProjectSubmodels(data);
    expect(useExtractionStore.getState().allProjectSubmodels).toEqual(data);
  });

  it('reset resets to initial state', () => {
    useExtractionStore.setState({
      phase: 'extracting',
      pdfText: 'some text',
      selectedSubmodelIds: ['a', 'b'],
      targetMode: 'mapping',
    });
    useExtractionStore.getState().reset();
    const state = useExtractionStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.pdfText).toBe('');
    expect(state.selectedSubmodelIds).toEqual([]);
    expect(state.targetMode).toBe('new');
    expect(state.classification).toBeNull();
  });
});
