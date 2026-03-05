import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAasStore } from '../../store/aasStore';

export function ExplorerPanel() {
  const [open, setOpen] = useState(true);
  const shells = useAasStore((s) => s.shells);
  const nodes = useAasStore((s) => s.nodes);
  const { fitBounds, getNode } = useReactFlow();

  const selectedNodeId = (() => {
    const sel = nodes.filter((n) => n.selected);
    return sel.length === 1 ? sel[0].id : null;
  })();

  const focusNode = (nodeId: string) => {
    const node = getNode(nodeId);
    if (!node) return;

    // Select the node
    const updatedNodes = nodes.map((n) => ({
      ...n,
      selected: n.id === nodeId,
    }));
    useAasStore.setState({ nodes: updatedNodes });

    // Zoom to node
    fitBounds(
      {
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? 280,
        height: node.measured?.height ?? 120,
      },
      { padding: 0.5, duration: 400 },
    );
  };

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
            width: 220,
            height: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
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

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {shells.length === 0 && (
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

            {shells.map((shell) => {
              const isSelected = selectedNodeId === shell.id;

              return (
                <button
                  key={shell.id}
                  type="button"
                  onClick={() => focusNode(shell.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: isSelected ? 10 : 12,
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    border: 'none',
                    borderLeft: isSelected ? '2px solid var(--node-aas)' : '2px solid transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shell.idShort || 'AAS'}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shell.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
