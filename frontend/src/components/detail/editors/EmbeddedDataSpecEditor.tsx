import { Plus, X } from 'lucide-react';
import type { EmbeddedDataSpecification, DataSpecificationIec61360, LangString, Reference, ReferenceTypes } from '../../../types/aas';
import { inputStyle, selectStyle } from '../sections/Section';
import { LangStringEditor } from './LangStringEditor';
import { Section } from '../sections/Section';

interface EmbeddedDataSpecEditorProps {
  value: EmbeddedDataSpecification[];
  onChange?: (value: EmbeddedDataSpecification[]) => void;
  readonly?: boolean;
}

function emptySpec(): EmbeddedDataSpecification {
  return {
    dataSpecification: {
      type: 'ExternalReference' as ReferenceTypes,
      keys: [{ type: 'GlobalReference', value: 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0' }],
    },
    dataSpecificationContent: {
      preferredName: [{ language: 'de', text: '' }],
    },
  };
}

export function EmbeddedDataSpecEditor({ value, onChange, readonly }: EmbeddedDataSpecEditorProps) {
  const addSpec = () => {
    onChange?.([...value, emptySpec()]);
  };

  const removeSpec = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const updateContent = (index: number, changes: Partial<DataSpecificationIec61360>) => {
    onChange?.(
      value.map((spec, i) =>
        i === index
          ? { ...spec, dataSpecificationContent: { ...spec.dataSpecificationContent, ...changes } }
          : spec,
      ),
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value.map((spec, i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--bg-base)',
            borderRadius: 6,
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 8px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              IEC 61360 #{i + 1}
            </span>
            {!readonly && (
              <button
                type="button"
                onClick={() => removeSpec(i)}
                style={{
                  backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel label="preferredName">
              <LangStringEditor
                value={spec.dataSpecificationContent.preferredName}
                onChange={(v) => updateContent(i, { preferredName: v })}
              />
            </FieldLabel>
            <FieldLabel label="shortName">
              <LangStringEditor
                value={spec.dataSpecificationContent.shortName ?? []}
                onChange={(v) => updateContent(i, { shortName: v.length > 0 ? v : undefined })}
              />
            </FieldLabel>
            <FieldLabel label="unit">
              <input
                value={spec.dataSpecificationContent.unit || ''}
                onChange={(e) => updateContent(i, { unit: e.target.value || undefined })}
                style={inputStyle}
                placeholder="mm, kg, ..."
                readOnly={readonly}
              />
            </FieldLabel>
            <FieldLabel label="dataType">
              <input
                value={spec.dataSpecificationContent.dataType || ''}
                onChange={(e) => updateContent(i, { dataType: e.target.value || undefined })}
                style={inputStyle}
                placeholder="STRING_TRANSLATABLE"
                readOnly={readonly}
              />
            </FieldLabel>
            <FieldLabel label="definition">
              <LangStringEditor
                value={spec.dataSpecificationContent.definition ?? []}
                onChange={(v) => updateContent(i, { definition: v.length > 0 ? v : undefined })}
              />
            </FieldLabel>
            <FieldLabel label="value">
              <input
                value={spec.dataSpecificationContent.value || ''}
                onChange={(e) => updateContent(i, { value: e.target.value || undefined })}
                style={inputStyle}
                placeholder="value"
                readOnly={readonly}
              />
            </FieldLabel>
          </div>
        </div>
      ))}

      {!readonly && (
        <button
          type="button"
          onClick={addSpec}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            backgroundColor: 'transparent', border: '1px dashed var(--border)',
            borderRadius: 6, padding: '4px 8px', color: 'var(--text-muted)',
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
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
          <Plus size={12} /> Data Specification hinzufügen
        </button>
      )}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}
