import { Plus, X } from 'lucide-react';
import type { SpecificAssetId } from '../../../types/aas';
import { inputStyle } from '../sections/Section';

interface SpecificAssetIdEditorProps {
  value: SpecificAssetId[];
  onChange: (value: SpecificAssetId[]) => void;
}

export function SpecificAssetIdEditor({ value, onChange }: SpecificAssetIdEditorProps) {
  const addEntry = () => {
    onChange([...value, { name: '', value: '' }]);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, changes: Partial<SpecificAssetId>) => {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...changes } : entry)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {value.map((entry, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'flex-start',
          }}
        >
          <input
            value={entry.name}
            onChange={(e) => updateEntry(i, { name: e.target.value })}
            style={{ ...inputStyle, width: '40%', flexShrink: 0 }}
            placeholder="name"
          />
          <input
            value={entry.value}
            onChange={(e) => updateEntry(i, { value: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="value"
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
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
        onClick={addEntry}
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
        <Plus size={12} /> Asset-ID hinzufügen
      </button>
    </div>
  );
}
