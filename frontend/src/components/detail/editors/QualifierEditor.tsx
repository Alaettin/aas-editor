import { Plus, X } from 'lucide-react';
import type { Qualifier, DataTypeDefXsd, QualifierKind, Reference } from '../../../types/aas';
import { inputStyle, selectStyle } from '../sections/Section';
import { ReferenceEditor } from './ReferenceEditor';
import { ALL_XSD_TYPES } from '../../../utils/constants';

interface QualifierEditorProps {
  value: Qualifier[];
  onChange: (value: Qualifier[]) => void;
}

const QUALIFIER_KINDS: QualifierKind[] = ['ConceptQualifier', 'ValueQualifier', 'TemplateQualifier'];

export function QualifierEditor({ value, onChange }: QualifierEditorProps) {
  const addQualifier = () => {
    onChange([
      ...value,
      { type: '', valueType: 'xs:string' as DataTypeDefXsd, kind: 'ConceptQualifier' as QualifierKind },
    ]);
  };

  const removeQualifier = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateQualifier = (index: number, changes: Partial<Qualifier>) => {
    onChange(value.map((q, i) => (i === index ? { ...q, ...changes } : q)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value.map((q, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '8px',
            backgroundColor: 'var(--bg-base)',
            borderRadius: 6,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              Qualifier {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQualifier(i)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 2,
                borderRadius: 4,
                display: 'flex',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={12} />
            </button>
          </div>
          <select
            value={q.kind || 'ConceptQualifier'}
            onChange={(e) => updateQualifier(i, { kind: e.target.value as QualifierKind })}
            style={selectStyle}
          >
            {QUALIFIER_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            value={q.type}
            onChange={(e) => updateQualifier(i, { type: e.target.value })}
            style={inputStyle}
            placeholder="type"
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <select
              value={q.valueType}
              onChange={(e) => updateQualifier(i, { valueType: e.target.value as DataTypeDefXsd })}
              style={{ ...selectStyle, width: '45%' }}
            >
              {ALL_XSD_TYPES.map((vt) => (
                <option key={vt} value={vt}>{vt}</option>
              ))}
            </select>
            <input
              value={q.value || ''}
              onChange={(e) => updateQualifier(i, { value: e.target.value || undefined })}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="value"
            />
          </div>
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>valueId</span>
            <ReferenceEditor
              value={q.valueId}
              onChange={(ref: Reference | undefined) => updateQualifier(i, { valueId: ref })}
            />
          </div>
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>semanticId</span>
            <ReferenceEditor
              value={q.semanticId}
              onChange={(ref: Reference | undefined) => updateQualifier(i, { semanticId: ref })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQualifier}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 6,
          padding: '4px 8px',
          color: 'var(--text-muted)',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <Plus size={12} /> Qualifier hinzufügen
      </button>
    </div>
  );
}
