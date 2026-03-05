import { memo } from 'react';
import { type NodeProps, NodeResizer, Handle, Position } from '@xyflow/react';

import type { ConceptDescriptionNodeData } from '../../store/aasStore';
import { useAasStore } from '../../store/aasStore';
import { InlineEdit } from '../ui/InlineEdit';

const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  backgroundColor: 'var(--node-cd)',
  border: '2px solid var(--bg-elevated)',
  opacity: 0.6,
};

function ConceptDescriptionNodeComponent({ data, selected }: NodeProps) {
  const { conceptDescription: cd } = data as ConceptDescriptionNodeData;
  const updateConceptDescriptionField = useAasStore((s) => s.updateConceptDescriptionField);

  const specCount = cd.embeddedDataSpecifications?.length ?? 0;
  const caseOfCount = cd.isCaseOf?.length ?? 0;

  return (
    <div
      style={{
        minWidth: 240,
        minHeight: 80,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-elevated)',
        borderLeft: `1px solid ${selected ? 'var(--node-cd)' : 'var(--border)'}`,
        borderRight: `1px solid ${selected ? 'var(--node-cd)' : 'var(--border)'}`,
        borderBottom: `1px solid ${selected ? 'var(--node-cd)' : 'var(--border)'}`,
        borderTop: '3px solid var(--node-cd)',
        borderRadius: 12,
        boxShadow: selected ? '0 0 20px rgba(249, 115, 22, 0.3)' : 'var(--node-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <NodeResizer
        minWidth={240}
        minHeight={80}
        isVisible={!!selected}
        color="var(--node-cd)"
      />

      {/* Target handles only — CDs are referenced, they don't reference others */}
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((pos) => (
        <Handle
          key={`target-${pos}`}
          type="target"
          position={pos}
          id={`target-${pos}`}
          style={{ ...handleStyle, opacity: 0, width: 16, height: 16 }}
        />
      ))}
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((pos) => (
        <Handle
          key={`source-${pos}`}
          type="source"
          position={pos}
          id={`source-${pos}`}
          style={handleStyle}
        />
      ))}

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
            color: 'var(--node-cd)',
            backgroundColor: 'color-mix(in srgb, var(--node-cd) 15%, transparent)',
            padding: '2px 7px',
            borderRadius: 4,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
          }}
        >
          CD
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineEdit
            value={cd.idShort || 'ConceptDescription'}
            onSave={(v) => updateConceptDescriptionField(cd.id, 'idShort', v)}
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
            value={cd.id}
            onSave={(v) => updateConceptDescriptionField(cd.id, 'id', v)}
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

      {/* Info */}
      {(specCount > 0 || caseOfCount > 0) && (
        <div
          style={{
            padding: '8px 16px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {specCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Data Specs</span>
              <span style={{ color: 'var(--node-cd)', fontWeight: 500 }}>{specCount}</span>
            </div>
          )}
          {caseOfCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>isCaseOf</span>
              <span style={{ color: 'var(--node-cd)', fontWeight: 500 }}>{caseOfCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const ConceptDescriptionNode = memo(ConceptDescriptionNodeComponent);
