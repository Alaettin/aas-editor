import { Plus, X } from 'lucide-react';
import type { Extension, DataTypeDefXsd } from '../../../types/aas';
import { inputStyle, selectStyle } from '../sections/Section';
import { ALL_XSD_TYPES } from '../../../utils/constants';

interface ExtensionEditorProps {
  value: Extension[];
  onChange: (value: Extension[]) => void;
}

export function ExtensionEditor({ value, onChange }: ExtensionEditorProps) {
  const addExtension = () => {
    onChange([...value, { name: '' }]);
  };

  const removeExtension = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateExtension = (index: number, changes: Partial<Extension>) => {
    onChange(value.map((ext, i) => (i === index ? { ...ext, ...changes } : ext)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value.map((ext, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: 8,
            backgroundColor: 'var(--bg-base)',
            borderRadius: 6,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              Extension {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeExtension(i)}
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
          <input
            value={ext.name}
            onChange={(e) => updateExtension(i, { name: e.target.value })}
            style={inputStyle}
            placeholder="name"
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <select
              value={ext.valueType || ''}
              onChange={(e) => updateExtension(i, { valueType: (e.target.value || undefined) as DataTypeDefXsd | undefined })}
              style={{ ...selectStyle, width: '45%' }}
            >
              <option value="">(kein Typ)</option>
              {ALL_XSD_TYPES.map((vt) => (
                <option key={vt} value={vt}>{vt}</option>
              ))}
            </select>
            <input
              value={ext.value || ''}
              onChange={(e) => updateExtension(i, { value: e.target.value || undefined })}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="value"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addExtension}
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
        <Plus size={12} /> Extension hinzufügen
      </button>
    </div>
  );
}
