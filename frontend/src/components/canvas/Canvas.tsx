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
import { useAasStore } from '../../store/aasStore';
import type { AasNodeData, AASNodeData } from '../../store/aasStore';
import { useApiStore } from '../../store/apiStore';
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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useAasStore();
  const deleteNode = useAasStore((s) => s.deleteNode);
  const duplicateNode = useAasStore((s) => s.duplicateNode);
  const addShell = useAasStore((s) => s.addShell);
  const addSubmodelElement = useAasStore((s) => s.addSubmodelElement);
  const addConceptDescription = useAasStore((s) => s.addConceptDescription);
  const importEnvironment = useAasStore((s) => s.importEnvironment);
  const showConceptDescriptions = useAasStore((s) => s.showConceptDescriptions);
  const { screenToFlowPosition } = useReactFlow();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);

  // Track selected node for detail panel
  const selectedNodeId = useMemo(() => {
    const selected = nodes.filter((n) => n.selected);
    return selected.length === 1 ? selected[0].id : null;
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

  // Drag & drop JSON file onto canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.name.endsWith('.json')) return;

      const dropPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) importEnvironment(content, dropPos);
      };
      reader.readAsText(file);
    },
    [screenToFlowPosition, importEnvironment],
  );

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

        // Delete selected CD-edges (removes semanticId from source)
        const selectedEdges = useAasStore.getState().edges.filter(
          (edge) => edge.selected && edge.id.startsWith('cd-edge-'),
        );
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [duplicateNode]);

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
    });
  }, [contextMenu, requestDelete, duplicateNode, addSubmodelElement, addShell, addConceptDescription, screenToFlowPosition]);

  const showDetail = selectedNodeId !== null && detailOpen;

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ExplorerPanel />

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Toolbar getViewportCenter={getViewportCenter} />

        <ReactFlow
          className={showConceptDescriptions ? 'cd-mode-active' : undefined}
          nodes={nodes}
          edges={edges}
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

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            actions={contextMenuActions}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>

      {showDetail && (
        <DetailPanel
          selectedNodeId={selectedNodeId}
          onClose={() => setDetailOpen(false)}
        />
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
    </div>
  );
}
