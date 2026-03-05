import { useState, useCallback, useRef } from 'react';
import { PanelLeft, LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAasStore, isContainerElement, getContainerChildren } from '../../store/aasStore';
import type { SubmodelElement } from '../../types/aas';

// --- Type badge config ---

interface TypeBadge {
  label: string;
  color: string;
}

function getElementBadge(modelType: string): TypeBadge {
  switch (modelType) {
    case 'Property':
      return { label: 'P', color: 'var(--text-muted)' };
    case 'MultiLanguageProperty':
      return { label: 'ML', color: 'var(--text-muted)' };
    case 'Range':
      return { label: 'R', color: 'var(--text-muted)' };
    case 'SubmodelElementCollection':
      return { label: 'SMC', color: '#eab308' };
    case 'SubmodelElementList':
      return { label: 'SML', color: '#eab308' };
    case 'Entity':
      return { label: 'E', color: 'var(--node-container, var(--text-secondary))' };
    case 'Blob':
      return { label: 'B', color: 'var(--text-muted)' };
    case 'File':
      return { label: 'F', color: 'var(--text-muted)' };
    case 'ReferenceElement':
      return { label: 'Ref', color: 'var(--text-muted)' };
    case 'Operation':
      return { label: 'Op', color: 'var(--text-muted)' };
    default:
      return { label: modelType.slice(0, 3), color: 'var(--text-muted)' };
  }
}

function getElementChildren(el: SubmodelElement): SubmodelElement[] {
  if (isContainerElement(el)) return getContainerChildren(el);
  if (el.modelType === 'Entity') return (el as { statements?: SubmodelElement[] }).statements ?? [];
  return [];
}

// --- Tree Node Component ---

interface TreeNodeProps {
  nodeId: string;
  label: string;
  depth: number;
  badge?: TypeBadge;
  badgeColor?: string;
  selectedNodeId: string | null;
  children?: SubmodelElement[];
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
}

function TreeNode({ nodeId, label, depth, badge, badgeColor, selectedNodeId, children, expanded, onToggle, onFocus }: TreeNodeProps) {
  const isSelected = selectedNodeId === nodeId;
  const hasChildren = children && children.length > 0;
  const isExpanded = expanded[nodeId] ?? false;

  return (
    <>
      <button
        type="button"
        onClick={() => onFocus(nodeId)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          padding: '4px 8px',
          paddingLeft: 8 + depth * 14,
          backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
          border: 'none',
          borderLeft: isSelected ? '2px solid var(--node-aas)' : '2px solid transparent',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          fontSize: 12,
          lineHeight: '20px',
          transition: 'background-color 0.1s',
          minHeight: 26,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Chevron */}
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggle(nodeId);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              flexShrink: 0,
              padding: '0 1px',
            }}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}

        {/* Badge */}
        {badge && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: badgeColor ?? badge.color,
              backgroundColor: `color-mix(in srgb, ${badgeColor ?? badge.color} 12%, transparent)`,
              padding: '1px 4px',
              borderRadius: 3,
              fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
              lineHeight: '14px',
            }}
          >
            {badge.label}
          </span>
        )}

        {/* Label */}
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: depth === 0 ? 500 : 400,
            color: isSelected ? 'var(--text-primary)' : depth <= 1 ? 'var(--text-secondary)' : 'var(--text-muted)',
          }}
          title={label}
        >
          {label}
        </span>
      </button>

      {/* Children */}
      {hasChildren && isExpanded && children!.map((child) => {
        const childId = child._nodeId ?? child.idShort;
        if (!childId) return null;
        const childBadge = getElementBadge(child.modelType);
        const grandChildren = getElementChildren(child);
        return (
          <TreeNode
            key={childId}
            nodeId={childId}
            label={child.idShort || '(unnamed)'}
            depth={depth + 1}
            badge={childBadge}
            selectedNodeId={selectedNodeId}
            children={grandChildren.length > 0 ? grandChildren : undefined}
            expanded={expanded}
            onToggle={onToggle}
            onFocus={onFocus}
          />
        );
      })}
    </>
  );
}

// --- Explorer Panel ---

const MIN_WIDTH = 180;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 240;

export function ExplorerPanel() {
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const shells = useAasStore((s) => s.shells);
  const submodels = useAasStore((s) => s.submodels);
  const nodes = useAasStore((s) => s.nodes);
  const relayoutCanvas = useAasStore((s) => s.relayoutCanvas);
  const { fitBounds, getNode, fitView } = useReactFlow();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + ev.clientX - startX));
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const selectedNodeId = (() => {
    const sel = nodes.filter((n) => n.selected);
    return sel.length === 1 ? sel[0].id : null;
  })();

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const focusNode = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (!node) return;

    const updatedNodes = nodes.map((n) => ({
      ...n,
      selected: n.id === nodeId,
    }));
    useAasStore.setState({ nodes: updatedNodes });

    fitBounds(
      {
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? 280,
        height: node.measured?.height ?? 120,
      },
      { padding: 0.5, duration: 400 },
    );
  }, [nodes, getNode, fitBounds]);

  // Collect all submodel IDs referenced by shells
  const referencedSubmodelIds = new Set<string>();
  for (const shell of shells) {
    for (const ref of shell.submodels ?? []) {
      const id = ref.keys?.[0]?.value;
      if (id) referencedSubmodelIds.add(id);
    }
  }

  const standaloneSubmodels = submodels.filter((sm) => !referencedSubmodelIds.has(sm.id));

  // Auto-expand shells on first render
  const ensureShellsExpanded = () => {
    let changed = false;
    const next = { ...expanded };
    for (const shell of shells) {
      if (!(shell.id in next)) {
        next[shell.id] = true;
        changed = true;
      }
    }
    if (changed) setExpanded(next);
  };
  ensureShellsExpanded();

  return (
    <>
      {/* Toggle button — visible when panel is closed */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            zIndex: 21,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 8,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--node-aas)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
          title="Explorer öffnen"
        >
          <PanelLeft size={16} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          style={{
            width,
            height: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={startResize}
            style={{
              position: 'absolute',
              top: 0,
              right: -3,
              width: 6,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 10,
            }}
          />
          {/* Header */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--node-aas)',
                  backgroundColor: 'color-mix(in srgb, var(--node-aas) 15%, transparent)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.02em',
                }}
              >
                AAS
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                Explorer
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                onClick={() => {
                  relayoutCanvas();
                  setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 4,
                  display: 'flex',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Anordnen"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 4,
                  display: 'flex',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Explorer schließen"
              >
                <PanelLeft size={14} />
              </button>
            </div>
          </div>

          {/* Tree */}
          <div className="explorer-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {shells.length === 0 && standaloneSubmodels.length === 0 && (
              <div
                style={{
                  padding: '20px 12px',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                Keine AAS vorhanden
              </div>
            )}

            {/* Shells with their submodels */}
            {shells.map((shell) => {
              const shellExpanded = expanded[shell.id] ?? true;
              const submodelRefs = shell.submodels?.map((ref) => ref.keys?.[0]?.value).filter(Boolean) ?? [];

              return (
                <div key={shell.id}>
                  {/* Shell row */}
                  <button
                    type="button"
                    onClick={() => focusNode(shell.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      width: '100%',
                      padding: '4px 8px',
                      paddingLeft: 8,
                      backgroundColor: selectedNodeId === shell.id ? 'var(--bg-hover)' : 'transparent',
                      border: 'none',
                      borderLeft: selectedNodeId === shell.id ? '2px solid var(--node-aas)' : '2px solid transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: '20px',
                      transition: 'background-color 0.1s',
                      minHeight: 28,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedNodeId !== shell.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedNodeId !== shell.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {submodelRefs.length > 0 ? (
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleExpand(shell.id); }}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: '0 1px' }}
                      >
                        {shellExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                    ) : (
                      <span style={{ width: 14, flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--node-aas)',
                        backgroundColor: 'color-mix(in srgb, var(--node-aas) 15%, transparent)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontFamily: "'JetBrains Mono', monospace",
                        flexShrink: 0,
                        lineHeight: '14px',
                      }}
                    >
                      AAS
                    </span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: selectedNodeId === shell.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                      title={shell.idShort ?? shell.id}
                    >
                      {shell.idShort || 'AAS'}
                    </span>
                  </button>

                  {/* Submodels */}
                  {shellExpanded && submodelRefs.map((smId) => {
                    const sm = submodels.find((s) => s.id === smId);
                    if (!sm) return null;
                    const smExpanded = expanded[sm.id] ?? false;
                    const elements = sm.submodelElements ?? [];

                    return (
                      <div key={sm.id}>
                        {/* Submodel row */}
                        <button
                          type="button"
                          onClick={() => focusNode(sm.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            width: '100%',
                            padding: '4px 8px',
                            paddingLeft: 8 + 14,
                            backgroundColor: selectedNodeId === sm.id ? 'var(--bg-hover)' : 'transparent',
                            border: 'none',
                            borderLeft: selectedNodeId === sm.id ? '2px solid var(--node-aas)' : '2px solid transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            fontSize: 12,
                            lineHeight: '20px',
                            transition: 'background-color 0.1s',
                            minHeight: 26,
                          }}
                          onMouseEnter={(e) => {
                            if (selectedNodeId !== sm.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedNodeId !== sm.id) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {elements.length > 0 ? (
                            <span
                              onClick={(e) => { e.stopPropagation(); toggleExpand(sm.id); }}
                              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: '0 1px' }}
                            >
                              {smExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </span>
                          ) : (
                            <span style={{ width: 14, flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: 'var(--node-submodel, #3b82f6)',
                              backgroundColor: 'color-mix(in srgb, var(--node-submodel, #3b82f6) 12%, transparent)',
                              padding: '1px 4px',
                              borderRadius: 3,
                              fontFamily: "'JetBrains Mono', monospace",
                              flexShrink: 0,
                              lineHeight: '14px',
                            }}
                          >
                            SM
                          </span>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: selectedNodeId === sm.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                            title={sm.idShort ?? sm.id}
                          >
                            {sm.idShort || sm.id}
                          </span>
                        </button>

                        {/* Elements */}
                        {smExpanded && elements.map((el) => {
                          const elId = el._nodeId ?? el.idShort;
                          if (!elId) return null;
                          const badge = getElementBadge(el.modelType);
                          const children = getElementChildren(el);
                          return (
                            <TreeNode
                              key={elId}
                              nodeId={elId}
                              label={el.idShort || '(unnamed)'}
                              depth={2}
                              badge={badge}
                              selectedNodeId={selectedNodeId}
                              children={children.length > 0 ? children : undefined}
                              expanded={expanded}
                              onToggle={toggleExpand}
                              onFocus={focusNode}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Standalone submodels */}
            {standaloneSubmodels.length > 0 && (
              <>
                <div
                  style={{
                    padding: '8px 12px 4px',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderTop: shells.length > 0 ? '1px solid var(--border)' : undefined,
                    marginTop: shells.length > 0 ? 4 : 0,
                  }}
                >
                  Standalone
                </div>
                {standaloneSubmodels.map((sm) => {
                  const smExpanded = expanded[sm.id] ?? false;
                  const elements = sm.submodelElements ?? [];

                  return (
                    <div key={sm.id}>
                      <button
                        type="button"
                        onClick={() => focusNode(sm.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          width: '100%',
                          padding: '4px 8px',
                          paddingLeft: 8,
                          backgroundColor: selectedNodeId === sm.id ? 'var(--bg-hover)' : 'transparent',
                          border: 'none',
                          borderLeft: selectedNodeId === sm.id ? '2px solid var(--node-aas)' : '2px solid transparent',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          lineHeight: '20px',
                          transition: 'background-color 0.1s',
                          minHeight: 26,
                        }}
                        onMouseEnter={(e) => {
                          if (selectedNodeId !== sm.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedNodeId !== sm.id) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {elements.length > 0 ? (
                          <span
                            onClick={(e) => { e.stopPropagation(); toggleExpand(sm.id); }}
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: '0 1px' }}
                          >
                            {smExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </span>
                        ) : (
                          <span style={{ width: 14, flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'var(--node-submodel, #3b82f6)',
                            backgroundColor: 'color-mix(in srgb, var(--node-submodel, #3b82f6) 12%, transparent)',
                            padding: '1px 4px',
                            borderRadius: 3,
                            fontFamily: "'JetBrains Mono', monospace",
                            flexShrink: 0,
                            lineHeight: '14px',
                          }}
                        >
                          SM
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: selectedNodeId === sm.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                          title={sm.idShort ?? sm.id}
                        >
                          {sm.idShort || sm.id}
                        </span>
                      </button>

                      {smExpanded && elements.map((el) => {
                        const elId = el._nodeId ?? el.idShort;
                        if (!elId) return null;
                        const badge = getElementBadge(el.modelType);
                        const children = getElementChildren(el);
                        return (
                          <TreeNode
                            key={elId}
                            nodeId={elId}
                            label={el.idShort || '(unnamed)'}
                            depth={1}
                            badge={badge}
                            selectedNodeId={selectedNodeId}
                            children={children.length > 0 ? children : undefined}
                            expanded={expanded}
                            onToggle={toggleExpand}
                            onFocus={focusNode}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
