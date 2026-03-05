import { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import type { SubmodelElementNodeData } from '../../store/aasStore';
import { useAasStore } from '../../store/aasStore';
import { InlineEdit } from '../ui/InlineEdit';
import { MultiHandles, ELEMENT_OPTIONS } from './MultiHandles';
import type { DataTypeDefXsd } from '../../types/aas';

const TYPE_COLORS = Object.fromEntries(ELEMENT_OPTIONS.map((o) => [o.value, o.color]));

const TYPE_LABELS: Record<string, string> = {
  Property: 'Property',
  MultiLanguageProperty: 'Multi-Language Property',
  Range: 'Range',
  SubmodelElementCollection: 'Submodel Element Collection',
  SubmodelElementList: 'Submodel Element List',
  File: 'File',
  Blob: 'Blob',
  ReferenceElement: 'Reference',
  Entity: 'Entity',
  RelationshipElement: 'Relationship',
  AnnotatedRelationshipElement: 'Annotated Rel.',
  BasicEventElement: 'Event',
  Operation: 'Operation',
  Capability: 'Capability',
};

const VALUE_TYPES: DataTypeDefXsd[] = [
  'xs:string' as DataTypeDefXsd,
  'xs:boolean' as DataTypeDefXsd,
  'xs:int' as DataTypeDefXsd,
  'xs:long' as DataTypeDefXsd,
  'xs:double' as DataTypeDefXsd,
  'xs:float' as DataTypeDefXsd,
  'xs:decimal' as DataTypeDefXsd,
  'xs:dateTime' as DataTypeDefXsd,
  'xs:date' as DataTypeDefXsd,
];

function SubmodelElementNodeComponent({ data, selected }: NodeProps) {
  const { submodelId, element } = data as SubmodelElementNodeData;
  const updateSubmodelElement = useAasStore((s) => s.updateSubmodelElement);
  const addSubmodelElement = useAasStore((s) => s.addSubmodelElement);

  const nodeId = element._nodeId!;
  const color = TYPE_COLORS[element.modelType] || 'var(--text-muted)';
  const label = TYPE_LABELS[element.modelType] || element.modelType;
  const isContainer =
    element.modelType === 'SubmodelElementCollection' ||
    element.modelType === 'SubmodelElementList';

  // Count connected children for containers
  const connectedChildren = useAasStore(
    (s) => (isContainer ? s.edges.filter((e) => e.source === nodeId).length : 0),
  );

  return (
    <div
      style={{
        minWidth: 220,
        minHeight: 80,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-elevated)',
        borderLeft: `1px solid ${selected ? color : 'var(--border)'}`,
        borderRight: `1px solid ${selected ? color : 'var(--border)'}`,
        borderBottom: `1px solid ${selected ? color : 'var(--border)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 10,
        boxShadow: selected ? `0 0 16px ${color}40` : 'var(--node-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <NodeResizer
        minWidth={220}
        minHeight={80}
        isVisible={!!selected}
        color={color}
      />
      <MultiHandles
        color={color}
        addMode={isContainer ? 'dropdown' : undefined}
        onAdd={isContainer ? (modelType, pos) => {
          if (modelType) addSubmodelElement(nodeId, modelType, pos);
        } : undefined}
        addOptions={isContainer ? ELEMENT_OPTIONS : undefined}
      />

      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color,
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
            padding: '2px 7px',
            borderRadius: 4,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineEdit
            value={element.idShort}
            onSave={(v) => updateSubmodelElement(submodelId, nodeId, { idShort: v })}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          />
        </div>
      </div>

      {/* Body — type-specific fields */}
      <div
        style={{
          padding: '6px 14px 10px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {/* Property fields */}
        {element.modelType === 'Property' && (
          <>
            <FieldRow label="valueType">
              <select
                value={(element as { valueType?: string }).valueType || 'xs:string'}
                onChange={(e) => {
                  e.stopPropagation();
                  updateSubmodelElement(submodelId, nodeId, {
                    valueType: e.target.value as DataTypeDefXsd,
                  } as Record<string, unknown>);
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={selectStyle}
              >
                {VALUE_TYPES.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="value">
              <InlineEdit
                value={(element as { value?: string }).value || ''}
                onSave={(v) =>
                  updateSubmodelElement(submodelId, nodeId, { value: v } as Record<string, unknown>)
                }
                validate={() => true}
                placeholder="(leer)"
                style={monoStyle}
              />
            </FieldRow>
          </>
        )}

        {/* Range fields */}
        {element.modelType === 'Range' && (
          <>
            <FieldRow label="valueType">
              <select
                value={(element as { valueType?: string }).valueType || 'xs:double'}
                onChange={(e) => {
                  e.stopPropagation();
                  updateSubmodelElement(submodelId, nodeId, {
                    valueType: e.target.value as DataTypeDefXsd,
                  } as Record<string, unknown>);
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={selectStyle}
              >
                {VALUE_TYPES.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="min">
              <InlineEdit
                value={(element as { min?: string }).min || ''}
                onSave={(v) =>
                  updateSubmodelElement(submodelId, nodeId, { min: v } as Record<string, unknown>)
                }
                validate={() => true}
                placeholder="(leer)"
                style={monoStyle}
              />
            </FieldRow>
            <FieldRow label="max">
              <InlineEdit
                value={(element as { max?: string }).max || ''}
                onSave={(v) =>
                  updateSubmodelElement(submodelId, nodeId, { max: v } as Record<string, unknown>)
                }
                validate={() => true}
                placeholder="(leer)"
                style={monoStyle}
              />
            </FieldRow>
          </>
        )}

        {/* File / Blob fields */}
        {(element.modelType === 'File' || element.modelType === 'Blob') && (
          <FieldRow label="contentType">
            <InlineEdit
              value={(element as { contentType?: string }).contentType || ''}
              onSave={(v) =>
                updateSubmodelElement(submodelId, nodeId, { contentType: v } as Record<string, unknown>)
              }
              validate={() => true}
              placeholder="application/octet-stream"
              style={monoStyle}
            />
          </FieldRow>
        )}

        {/* MLP fields */}
        {element.modelType === 'MultiLanguageProperty' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {((element as { value?: unknown[] }).value ?? []).length} Sprachen
          </div>
        )}

        {/* ReferenceElement */}
        {element.modelType === 'ReferenceElement' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Referenz-Element
          </div>
        )}

        {/* Entity */}
        {element.modelType === 'Entity' && (
          <FieldRow label="entityType">
            <span style={monoStyle}>
              {(element as { entityType?: string }).entityType || '–'}
            </span>
          </FieldRow>
        )}

        {/* Relationship */}
        {(element.modelType === 'RelationshipElement' || element.modelType === 'AnnotatedRelationshipElement') && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {element.modelType === 'AnnotatedRelationshipElement' ? 'Annotierte Beziehung' : 'Beziehung'}
          </div>
        )}

        {/* BasicEventElement */}
        {element.modelType === 'BasicEventElement' && (
          <FieldRow label="direction">
            <span style={monoStyle}>
              {(element as { direction?: string }).direction || '–'}
            </span>
          </FieldRow>
        )}

        {/* Operation */}
        {element.modelType === 'Operation' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Operation
          </div>
        )}

        {/* Capability */}
        {element.modelType === 'Capability' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Capability
          </div>
        )}

        {/* Collection / List — show child count */}
        {isContainer && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>Elemente</span>
            <span style={{ color: 'var(--node-collection)', fontWeight: 500 }}>
              {connectedChildren}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared styles
const selectStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '2px 4px',
  color: 'var(--text-primary)',
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
};

const monoStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 65, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export const SubmodelElementNode = memo(SubmodelElementNodeComponent);
