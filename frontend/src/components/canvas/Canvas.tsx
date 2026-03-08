import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sparkles, Loader, Copy, Clipboard, Trash2 } from 'lucide-react';
import { useAasStore } from '../../store/aasStore';
import type { AasNodeData, AASNodeData } from '../../store/aasStore';
import { useApiStore } from '../../store/apiStore';
import { useAiStore } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { useExtractionStore } from '../../store/extractionStore';
import { isSupportedDocument, isImageFile } from '../../lib/extractText';
import { startClassification, runExtraction } from '../../lib/streamExtraction';
import { AASNode } from './AASNode';
import { SubmodelNode } from './SubmodelNode';
import { SubmodelElementNode } from './SubmodelElementNode';
import { ConceptDescriptionNode } from './ConceptDescriptionNode';
import { Toolbar } from '../toolbar/Toolbar';
import {
  ContextMenu,
  buildNodeActions,
  buildCanvasActions,
} from '../ui/ContextMenu';
import { DetailPanel } from '../detail/DetailPanel';
import { ExplorerPanel } from '../explorer/ExplorerPanel';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ClassificationDialog } from '../ui/ClassificationDialog';
import { GhostActionBar } from '../ui/GhostActionBar';
import { ReviewPanel } from '../ui/ReviewPanel';

const nodeTypes = {
  aasNode: AASNode,
  submodelNode: SubmodelNode,
  elementNode: SubmodelElementNode,
  conceptDescriptionNode: ConceptDescriptionNode,
};

interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  nodeType?: string;
}

export function Canvas() {
  const nodes = useAasStore((s) => s.nodes);
  const edges = useAasStore((s) => s.edges);
  const onNodesChange = useAasStore((s) => s.onNodesChange);
  const onEdgesChange = useAasStore((s) => s.onEdgesChange);
  const onConnect = useAasStore((s) => s.onConnect);
  const deleteNode = useAasStore((s) => s.deleteNode);
  const duplicateNode = useAasStore((s) => s.duplicateNode);
  const copyNodes = useAasStore((s) => s.copyNodes);
  const pasteNodes = useAasStore((s) => s.pasteNodes);
  const clipboard = useAasStore((s) => s.clipboard);
  const addShell = useAasStore((s) => s.addShell);
  const addSubmodelElement = useAasStore((s) => s.addSubmodelElement);
  const addConceptDescription = useAasStore((s) => s.addConceptDescription);
  const importEnvironment = useAasStore((s) => s.importEnvironment);
  const showConceptDescriptions = useAasStore((s) => s.showConceptDescriptions);
  const { screenToFlowPosition } = useReactFlow();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  // Extraction state
  const extractionPhase = useExtractionStore((s) => s.phase);
  const extractionFile = useExtractionStore((s) => s.pdfFile);
  const ghostNodes = useExtractionStore((s) => s.ghostNodes);
  const ghostEdges = useExtractionStore((s) => s.ghostEdges);

  const isExtracting = extractionPhase === 'extracting' || extractionPhase === 'postprocessing';
  const showClassificationDialog = extractionPhase === 'classifying' || extractionPhase === 'configuring';
  const showGhostPreview = extractionPhase === 'preview' || extractionPhase === 'reviewing';

  // Merge ghost nodes/edges with real nodes/edges
  const mergedNodes = useMemo(() => {
    if (ghostNodes.length === 0) return nodes;
    return [...nodes, ...ghostNodes];
  }, [nodes, ghostNodes]);

  const mergedEdges = useMemo(() => {
    if (ghostEdges.length === 0) return edges;
    return [...edges, ...ghostEdges];
  }, [edges, ghostEdges]);

  // Track selected node for detail panel (single pass)
  const { selectedCount, selectedNodeId } = useMemo(() => {
    let count = 0;
    let lastId: string | null = null;
    for (const n of nodes) {
      if (n.selected) { count++; lastId = n.id; }
    }
    return { selectedCount: count, selectedNodeId: count === 1 ? lastId : null };
  }, [nodes]);

  const [detailOpen, setDetailOpen] = useState(true);

  // Re-open panel when a different node is selected
  useEffect(() => {
    if (selectedNodeId) setDetailOpen(true);
  }, [selectedNodeId]);

  // Delete with confirmation for AAS nodes
  const requestDelete = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const data = node.data as AasNodeData;
      if (data.type === 'aas') {
        setPendingDeleteNodeId(nodeId);
      } else {
        deleteNode(nodeId);
      }
    },
    [nodes, deleteNode],
  );

  // Fetch published API data on mount for delete-warning check
  const publishedShells = useApiStore((s) => s.shells);
  const fetchPublished = useApiStore((s) => s.fetchPublished);

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  const pendingDeleteInfo = useMemo(() => {
    if (!pendingDeleteNodeId) return null;
    const node = nodes.find((n) => n.id === pendingDeleteNodeId);
    if (!node) return null;
    const data = node.data as AASNodeData;
    const shell = data.shell;
    const submodelCount = shell.submodels?.length ?? 0;
    const isPublished = publishedShells.some((s) => s.shell_id === shell.id);
    return { idShort: shell.idShort || 'AAS', submodelCount, isPublished, shellAasId: shell.id };
  }, [pendingDeleteNodeId, nodes, publishedShells]);

  // Drag & drop file onto canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as HTMLElement)) return;
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const dropPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // JSON files → direct import (as before)
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          if (content) importEnvironment(content, dropPos);
        };
        reader.readAsText(file);
        return;
      }

      // Document & image files → AI extraction flow
      if (isSupportedDocument(file.name)) {
        const ai = useAiStore.getState();
        if (!ai.enabled) {
          if (isImageFile(file.name)) {
            addToast('Bilder werden nur mit AI-Modus unterstützt. In den Einstellungen aktivieren.', 'error');
          } else {
            addToast('Nur AAS-JSON-Dateien werden unterstützt. AI-Modus in den Einstellungen aktivieren.', 'error');
          }
          return;
        }
        if (!ai.apiKey) {
          addToast('Bitte API-Key in den AI-Einstellungen hinterlegen.', 'error');
          return;
        }
        if (isImageFile(file.name) && !ai.imageAnalysis) {
          addToast('Bildanalyse in den AI-Einstellungen aktivieren.', 'error');
          return;
        }

        // Start new extraction flow: classification + text extraction
        useExtractionStore.getState().setDropPosition(dropPos);
        startClassification(file).catch((err) => {
          const msg = err instanceof Error ? err.message : 'Klassifizierung fehlgeschlagen';
          addToast(msg, 'error');
        });
        return;
      }

      addToast('Dateityp nicht unterstützt. Erlaubt: .json, .pdf, .docx, .xlsx, .txt, .png, .jpg', 'error');
    },
    [screenToFlowPosition, importEnvironment, addToast],
  );

  // Handle extraction after user confirms in ClassificationDialog
  const handleExtract = useCallback(async () => {
    try {
      await runExtraction();
      const meta = useExtractionStore.getState().metadata;
      if (meta) {
        addToast(`${meta.extractedProperties} Properties extrahiert (Konfidenz: ${Math.round(meta.confidence * 100)}%)`, 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraktion fehlgeschlagen';
      addToast(msg, 'error');
    }
  }, [addToast]);

  const handleCancelExtraction = useCallback(() => {
    useExtractionStore.getState().reset();
  }, []);

  const getViewportCenter = useCallback(() => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, [screenToFlowPosition]);

  const minimapNodeColor = useCallback((node: { type?: string; data?: Record<string, unknown> }) => {
    if (node.type === 'aasNode') return 'var(--node-aas)';
    if (node.type === 'submodelNode') return 'var(--node-submodel)';
    if (node.type === 'elementNode') return '#06b6d4';
    if (node.type === 'conceptDescriptionNode') return '#f97316';
    return 'var(--border-hover)';
  }, []);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--border-hover)', strokeWidth: 2 },
    }),
    [],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when editing text inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Delete: handle ourselves (with confirmation for AAS)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();

        // Delete selected edges (onEdgesChange handles CD-edge semanticId cleanup)
        const selectedEdges = useAasStore.getState().edges.filter((edge) => edge.selected);
        if (selectedEdges.length > 0) {
          useAasStore.getState().onEdgesChange(
            selectedEdges.map((edge) => ({ type: 'remove' as const, id: edge.id })),
          );
        }

        const selected = useAasStore.getState().nodes.filter((n) => n.selected);
        for (const n of selected) {
          const data = n.data as AasNodeData;
          if (data.type === 'aas') {
            setPendingDeleteNodeId(n.id);
            return; // Show dialog for first AAS, handle one at a time
          }
        }
        // No AAS selected — delete all selected directly
        selected.forEach((n) => useAasStore.getState().deleteNode(n.id));
        return;
      }

      // Undo: Ctrl+Z
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        useAasStore.temporal.getState().undo();
      }

      // Redo: Ctrl+Shift+Z
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        useAasStore.temporal.getState().redo();
      }

      // Duplicate: Ctrl+D
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const selected = useAasStore.getState().nodes.filter((n) => n.selected);
        selected.forEach((n) => duplicateNode(n.id));
      }

      // Select all: Ctrl+A
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { nodes: allNodes } = useAasStore.getState();
        const selectedNodes = allNodes.map((n) => ({ ...n, selected: true }));
        useAasStore.setState({ nodes: selectedNodes });
      }

      // Copy: Ctrl+C
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        const count = copyNodes();
        if (count > 0) {
          addToast(`${count} Node${count > 1 ? 's' : ''} kopiert`, 'info');
        }
      }

      // Paste: Ctrl+V
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const center = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        pasteNodes(center);
      }

      // Search: Ctrl+F
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Dispatch custom event for ExplorerPanel to pick up
        window.dispatchEvent(new CustomEvent('aas-focus-search'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [duplicateNode, copyNodes, pasteNodes, addToast, screenToFlowPosition]);

  // Node right-click
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const data = node.data as AasNodeData;
      const nodeType = data.type === 'aas' ? 'aasNode' : data.type === 'submodel' ? 'submodelNode' : data.type === 'conceptDescription' ? 'conceptDescriptionNode' : 'elementNode';
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType,
      });
    },
    [],
  );

  // Canvas right-click
  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  // Build context menu actions
  const contextMenuActions = useMemo(() => {
    if (!contextMenu) return [];

    if (contextMenu.nodeId && contextMenu.nodeType) {
      return buildNodeActions(contextMenu.nodeId, contextMenu.nodeType, {
        onDelete: requestDelete,
        onDuplicate: duplicateNode,
        onCopy: () => {
          const count = copyNodes();
          if (count > 0) addToast(`${count} Node${count > 1 ? 's' : ''} kopiert`, 'info');
        },
        onAddElement:
          contextMenu.nodeType === 'submodelNode'
            ? (id: string) => addSubmodelElement(id, 'Property')
            : undefined,
      });
    }

    const pos = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    });

    return buildCanvasActions({
      onAddShell: () => addShell(pos),
      onAddCD: () => addConceptDescription(pos),
      onPaste: clipboard ? () => pasteNodes(pos) : undefined,
    });
  }, [contextMenu, requestDelete, duplicateNode, copyNodes, pasteNodes, clipboard, addSubmodelElement, addShell, addConceptDescription, screenToFlowPosition, addToast]);

  const showDetail = selectedNodeId !== null && detailOpen;

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ExplorerPanel />

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Toolbar getViewportCenter={getViewportCenter} />

        <ReactFlow
          className={showConceptDescriptions ? 'cd-mode-active' : undefined}
          nodes={mergedNodes}
          edges={mergedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView={false}
          snapToGrid
          snapGrid={[20, 20]}
          deleteKeyCode={null}
          multiSelectionKeyCode="Shift"
          proOptions={{ hideAttribution: true }}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onPaneClick={() => setContextMenu(null)}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--border)"
          />
          <Controls
            showInteractive={false}
            style={{ bottom: 16, left: 16 }}
          />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="rgba(0, 0, 0, 0.7)"
            style={{
              bottom: 16,
              right: 16,
              width: 180,
              height: 120,
            }}
          />
        </ReactFlow>

        {/* Ghost Action Bar */}
        {showGhostPreview && !reviewOpen && (
          <GhostActionBar onReview={() => setReviewOpen(true)} />
        )}

        {/* Multi-select info bar */}
        {selectedCount > 1 && !showGhostPreview && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              fontSize: 12,
            }}
          >
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {selectedCount} Nodes
            </span>
            <div style={{ width: 1, height: 16, backgroundColor: 'var(--border)' }} />
            <button
              type="button"
              onClick={() => {
                const count = copyNodes();
                if (count > 0) addToast(`${count} Nodes kopiert`, 'info');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                backgroundColor: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
                fontFamily: 'inherit', padding: '2px 4px', borderRadius: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Kopieren (Ctrl+C)"
            >
              <Copy size={13} /> Kopieren
            </button>
            <button
              type="button"
              onClick={() => {
                const selected = useAasStore.getState().nodes.filter((n) => n.selected);
                selected.forEach((n) => duplicateNode(n.id));
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                backgroundColor: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
                fontFamily: 'inherit', padding: '2px 4px', borderRadius: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Duplizieren (Ctrl+D)"
            >
              <Clipboard size={13} /> Duplizieren
            </button>
            <button
              type="button"
              onClick={() => {
                const selected = useAasStore.getState().nodes.filter((n) => n.selected);
                for (const n of selected) {
                  const data = n.data as AasNodeData;
                  if (data.type === 'aas') {
                    setPendingDeleteNodeId(n.id);
                    return;
                  }
                }
                selected.forEach((n) => deleteNode(n.id));
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                backgroundColor: 'transparent', border: 'none',
                color: 'var(--error)', cursor: 'pointer', fontSize: 12,
                fontFamily: 'inherit', padding: '2px 4px', borderRadius: 4,
                opacity: 0.8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              title="Löschen (Delete)"
            >
              <Trash2 size={13} /> Löschen
            </button>
          </div>
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            actions={contextMenuActions}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>

      {showDetail && !reviewOpen && (
        <DetailPanel
          selectedNodeId={selectedNodeId}
          onClose={() => setDetailOpen(false)}
        />
      )}

      {/* Review Panel (replaces detail panel when open) */}
      {reviewOpen && showGhostPreview && (
        <ReviewPanel onClose={() => setReviewOpen(false)} />
      )}

      {pendingDeleteNodeId && pendingDeleteInfo && (
        <ConfirmDialog
          title={`"${pendingDeleteInfo.idShort}" löschen?`}
          message={
            (() => {
              let msg = pendingDeleteInfo.submodelCount > 0
                ? `Diese AAS und alle verbundenen Submodels (${pendingDeleteInfo.submodelCount}) sowie deren Elemente werden unwiderruflich gelöscht.`
                : 'Diese AAS wird unwiderruflich gelöscht.';
              if (pendingDeleteInfo.isPublished) {
                msg += '\n\n⚠ Diese AAS ist in der API publiziert und wird beim Speichern dort ebenfalls entfernt.';
              }
              return msg;
            })()
          }
          onConfirm={() => {
            deleteNode(pendingDeleteNodeId);
            setPendingDeleteNodeId(null);
          }}
          onCancel={() => setPendingDeleteNodeId(null)}
        />
      )}

      {/* Classification Dialog */}
      {showClassificationDialog && extractionFile && (
        <ClassificationDialog
          fileName={extractionFile.name}
          fileSize={extractionFile.size}
          onExtract={handleExtract}
          onCancel={handleCancelExtraction}
        />
      )}

      {/* Drag-over indicator */}
      {dragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '2px dashed var(--accent)',
            borderRadius: 12,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            padding: '16px 28px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}>
            <Sparkles size={24} style={{ color: 'var(--accent)', marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Datei hier ablegen
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              .json, .pdf, .docx, .xlsx, .txt
            </div>
          </div>
        </div>
      )}

      {/* AI extraction loading overlay */}
      {isExtracting && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 95,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div style={{
            padding: '20px 32px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Loader size={20} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {extractionPhase === 'postprocessing' ? 'Nachbearbeitung...' : 'AI extrahiert Daten...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Dies kann einige Sekunden dauern
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
