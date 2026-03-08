import { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';

import type { AASNodeData } from '../../store/aasStore';
import { useAasStore } from '../../store/aasStore';
import { InlineEdit } from '../ui/InlineEdit';
import { MultiHandles } from './MultiHandles';

function AASNodeComponent({ data, selected }: NodeProps) {
  const { shell } = data as AASNodeData;
  const isGhost = !!(data as Record<string, unknown>).isGhost;
  const updateShellIdShort = useAasStore((s) => s.updateShellIdShort);
  const updateShellId = useAasStore((s) => s.updateShellId);
  const addSubmodelToShell = useAasStore((s) => s.addSubmodelToShell);

  return (
    <div
      className={isGhost ? 'ghost-node' : undefined}
      style={{
        minWidth: 260,
        minHeight: 100,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-elevated)',
        borderLeft: `1px solid ${selected ? 'var(--node-aas)' : 'var(--border)'}`,
        borderRight: `1px solid ${selected ? 'var(--node-aas)' : 'var(--border)'}`,
        borderBottom: `1px solid ${selected ? 'var(--node-aas)' : 'var(--border)'}`,
        borderTop: '3px solid var(--node-aas)',
        borderRadius: 12,
        boxShadow: selected ? 'var(--glow-shadow)' : 'var(--node-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...(isGhost ? { borderStyle: 'dashed' } : {}),
      }}
    >
      <NodeResizer
        minWidth={260}
        minHeight={100}
        isVisible={!!selected}
        color="var(--node-aas)"
      />
      <MultiHandles
        color="var(--node-aas)"
        addMode="direct"
        onAdd={(_, pos) => addSubmodelToShell(shell.id, pos)}
      />

      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--node-aas)',
            backgroundColor: 'color-mix(in srgb, var(--node-aas) 15%, transparent)',
            padding: '2px 7px',
            borderRadius: 4,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
          }}
        >
          AAS
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineEdit
            value={shell.idShort || 'AAS'}
            onSave={(v) => updateShellIdShort(shell.id, v)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          />
          <InlineEdit
            value={shell.id}
            onSave={(v) => updateShellId(shell.id, v)}
            validate={() => true}
            placeholder="urn:..."
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          />
        </div>
      </div>

      {/* Asset Info */}
      <div
        style={{
          padding: '8px 16px 12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Asset Kind</span>
          <span
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
            }}
          >
            {shell.assetInformation.assetKind}
          </span>
        </div>
        {shell.assetInformation.globalAssetId && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
            <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>Global Asset ID</span>
            <span
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={shell.assetInformation.globalAssetId}
            >
              {shell.assetInformation.globalAssetId}
            </span>
          </div>
        )}
        {shell.assetInformation.assetType && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
            <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>Asset Type</span>
            <span
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={shell.assetInformation.assetType}
            >
              {shell.assetInformation.assetType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const AASNode = memo(AASNodeComponent);
