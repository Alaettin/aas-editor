import { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';

import type { SubmodelNodeData } from '../../store/aasStore';
import { useAasStore } from '../../store/aasStore';
import { InlineEdit } from '../ui/InlineEdit';
import { MultiHandles, type AddOption } from './MultiHandles';

const ELEMENT_OPTIONS: AddOption[] = [
  { value: 'Property', label: 'Property', color: 'var(--node-property)' },
  { value: 'SubmodelElementCollection', label: 'Submodel Element Collection', color: 'var(--node-collection)' },
  { value: 'SubmodelElementList', label: 'Submodel Element List', color: 'var(--node-collection)' },
  { value: 'MultiLanguageProperty', label: 'Multi-Language', color: 'var(--node-property)' },
  { value: 'Range', label: 'Range', color: 'var(--node-property)' },
  { value: 'File', label: 'File', color: 'var(--text-secondary)' },
  { value: 'Blob', label: 'Blob', color: 'var(--text-secondary)' },
  { value: 'ReferenceElement', label: 'Reference', color: 'var(--text-secondary)' },
  { value: 'Entity', label: 'Entity', color: 'var(--node-property)' },
  { value: 'RelationshipElement', label: 'Relationship', color: 'var(--text-secondary)' },
  { value: 'AnnotatedRelationshipElement', label: 'Annotated Rel.', color: 'var(--text-secondary)' },
  { value: 'BasicEventElement', label: 'Event', color: 'var(--text-secondary)' },
  { value: 'Operation', label: 'Operation', color: 'var(--text-secondary)' },
  { value: 'Capability', label: 'Capability', color: 'var(--text-secondary)' },
];

function SubmodelNodeComponent({ data, selected }: NodeProps) {
  const { submodel } = data as SubmodelNodeData;
  const updateSubmodelIdShort = useAasStore((s) => s.updateSubmodelIdShort);
  const updateSubmodelId = useAasStore((s) => s.updateSubmodelId);
  const addSubmodelElement = useAasStore((s) => s.addSubmodelElement);

  // Check if connected to an AAS (incoming edge from aasNode)
  const isConnectedToAas = useAasStore((s) =>
    s.edges.some(
      (e) =>
        e.target === submodel.id &&
        s.nodes.find((n) => n.id === e.source)?.type === 'aasNode',
    ),
  );

  // Count connected element edges
  const connectedCount = useAasStore(
    (s) => s.edges.filter((e) => e.source === submodel.id).length,
  );

  return (
    <div
      style={{
        minWidth: 260,
        minHeight: 100,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-elevated)',
        borderLeft: `1px solid ${selected ? 'var(--node-submodel)' : 'var(--border)'}`,
        borderRight: `1px solid ${selected ? 'var(--node-submodel)' : 'var(--border)'}`,
        borderBottom: `1px solid ${selected ? 'var(--node-submodel)' : 'var(--border)'}`,
        borderTop: '3px solid var(--node-submodel)',
        borderRadius: 12,
        boxShadow: selected ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'var(--node-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <NodeResizer
        minWidth={260}
        minHeight={100}
        isVisible={!!selected}
        color="var(--node-submodel)"
      />
      <MultiHandles
        color="var(--node-submodel)"
        addMode="dropdown"
        onAdd={(modelType, pos) => {
          if (modelType) addSubmodelElement(submodel.id, modelType, pos);
        }}
        addOptions={ELEMENT_OPTIONS}
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
            color: 'var(--node-submodel)',
            backgroundColor: 'color-mix(in srgb, var(--node-submodel) 15%, transparent)',
            padding: '2px 7px',
            borderRadius: 4,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
          }}
        >
          Submodel
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineEdit
            value={submodel.idShort || 'Submodel'}
            onSave={(v) => updateSubmodelIdShort(submodel.id, v)}
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
            value={submodel.id}
            onSave={(v) => updateSubmodelId(submodel.id, v)}
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

      {/* Info — only when NOT connected to AAS */}
      {!isConnectedToAas && (
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
            <span style={{ color: 'var(--text-secondary)' }}>Elemente</span>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{connectedCount}</span>
          </div>
          {submodel.semanticId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Semantik</span>
              <span
                style={{
                  color: 'var(--success)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {submodel.semanticId.keys[0]?.value}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const SubmodelNode = memo(SubmodelNodeComponent);
