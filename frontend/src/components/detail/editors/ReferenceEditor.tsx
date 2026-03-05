import { Plus, X } from 'lucide-react';
import type { Reference, Key, ReferenceTypes } from '../../../types/aas';
import { inputStyle, selectStyle } from '../sections/Section';
import { ALL_KEY_TYPES } from '../../../utils/constants';

interface ReferenceEditorProps {
  value: Reference | undefined;
  onChange: (value: Reference | undefined) => void;
}

export function ReferenceEditor({ value, onChange }: ReferenceEditorProps) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() =>
          onChange({
            type: 'ExternalReference' as ReferenceTypes,
            keys: [{ type: 'GlobalReference', value: '' }],
          })
        }
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
          width: '100%',
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
        <Plus size={12} /> Referenz erstellen
      </button>
    );
  }

  const updateType = (type: string) => {
    onChange({ ...value, type: type as ReferenceTypes });
  };

  const updateKey = (index: number, field: keyof Key, val: string) => {
    const newKeys = value.keys.map((k, i) => (i === index ? { ...k, [field]: val } : k));
    onChange({ ...value, keys: newKeys });
  };

  const addKey = () => {
    onChange({ ...value, keys: [...value.keys, { type: 'GlobalReference', value: '' }] });
  };

  const removeKey = (index: number) => {
    if (value.keys.length <= 1) {
      onChange(undefined);
      return;
    }
    onChange({ ...value, keys: value.keys.filter((_, i) => i !== index) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <select
          value={value.type}
          onChange={(e) => updateType(e.target.value)}
          style={{ ...selectStyle, flex: 1 }}
        >
          <option value="ExternalReference">ExternalReference</option>
          <option value="ModelReference">ModelReference</option>
        </select>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <X size={12} />
        </button>
      </div>

      {value.keys.map((key, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <select
            value={key.type}
            onChange={(e) => updateKey(i, 'type', e.target.value)}
            style={{ ...selectStyle, width: 100, flexShrink: 0 }}
          >
            {ALL_KEY_TYPES.map((kt) => (
              <option key={kt} value={kt}>{kt}</option>
            ))}
          </select>
          <input
            value={key.value}
            onChange={(e) => updateKey(i, 'value', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="urn:..."
          />
          <button
            type="button"
            onClick={() => removeKey(i)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addKey}
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
        <Plus size={12} /> Key hinzufügen
      </button>
    </div>
  );
}
