import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { Submodel, ConceptDescription } from '../types/aas';

// --- Types ---

export interface ClassificationResult {
  documentType: 'technical_datasheet' | 'nameplate' | 'certificate' | 'manual' | 'unknown';
  productName: string;
  productId: string;
  manufacturer: string;
  productCategory: string;
  language: string;
  pageCount: number;
  confidence: number;
}

export interface Correction {
  type: string;
  [key: string]: unknown;
}

export interface ExtractionMetadata {
  extractedProperties: number;
  skippedItems: string[];
  confidence: number;
  warnings: string[];
  corrections: Correction[];
  hallucinationSuspects: number;
}

export type TargetMode = 'new' | 'mapping';

export interface ProjectSubmodels {
  projectId: string;
  projectName: string;
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
}

export type ExtractionPhase =
  | 'idle'
  | 'classifying'
  | 'configuring'
  | 'extracting'
  | 'postprocessing'
  | 'preview'
  | 'reviewing';

// Accepted/rejected state per element in review
export interface ReviewState {
  [idShort: string]: boolean; // true = accepted, false = rejected
}

interface ExtractionState {
  phase: ExtractionPhase;
  classification: ClassificationResult | null;
  pdfText: string;
  pdfFile: File | null;
  ghostNodes: Node[];
  ghostEdges: Edge[];
  metadata: ExtractionMetadata | null;
  corrections: Correction[];
  reviewState: ReviewState;
  dropPosition: { x: number; y: number };
  extractedJson: Record<string, unknown> | null;
  targetMode: TargetMode;
  selectedSubmodelIds: string[];
  allProjectSubmodels: ProjectSubmodels[];
}

interface ExtractionActions {
  setPhase: (phase: ExtractionPhase) => void;
  setClassification: (c: ClassificationResult) => void;
  updateClassification: (partial: Partial<ClassificationResult>) => void;
  setPdfText: (text: string) => void;
  setPdfFile: (file: File) => void;
  setDropPosition: (pos: { x: number; y: number }) => void;
  addGhostNode: (node: Node) => void;
  addGhostEdge: (edge: Edge) => void;
  setGhostNodes: (nodes: Node[], edges: Edge[]) => void;
  setMetadata: (m: ExtractionMetadata) => void;
  setCorrections: (c: Correction[]) => void;
  setExtractedJson: (json: Record<string, unknown>) => void;
  setReviewState: (state: ReviewState) => void;
  toggleReviewItem: (idShort: string) => void;
  setTargetMode: (mode: TargetMode) => void;
  toggleSubmodelId: (id: string) => void;
  setAllProjectSubmodels: (data: ProjectSubmodels[]) => void;
  reset: () => void;
}

const initialState: ExtractionState = {
  phase: 'idle',
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
  targetMode: 'new',
  selectedSubmodelIds: [],
  allProjectSubmodels: [],
};

export const useExtractionStore = create<ExtractionState & ExtractionActions>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setClassification: (classification) => set({ classification }),

  updateClassification: (partial) => {
    const current = get().classification;
    if (current) set({ classification: { ...current, ...partial } });
  },

  setPdfText: (pdfText) => set({ pdfText }),

  setPdfFile: (pdfFile) => set({ pdfFile }),

  setDropPosition: (dropPosition) => set({ dropPosition }),

  addGhostNode: (node) => set((s) => ({ ghostNodes: [...s.ghostNodes, node] })),

  addGhostEdge: (edge) => set((s) => ({ ghostEdges: [...s.ghostEdges, edge] })),

  setGhostNodes: (ghostNodes, ghostEdges) => set({ ghostNodes, ghostEdges }),

  setMetadata: (metadata) => set({ metadata }),

  setCorrections: (corrections) => set({ corrections }),

  setExtractedJson: (extractedJson) => set({ extractedJson }),

  setReviewState: (reviewState) => set({ reviewState }),

  toggleReviewItem: (idShort) => {
    const current = get().reviewState;
    set({ reviewState: { ...current, [idShort]: !current[idShort] } });
  },

  setTargetMode: (targetMode) => set({ targetMode }),

  setAllProjectSubmodels: (allProjectSubmodels) => set({ allProjectSubmodels }),

  toggleSubmodelId: (id) => {
    const current = get().selectedSubmodelIds;
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    set({ selectedSubmodelIds: next });
  },

  reset: () => set(initialState),
}));
