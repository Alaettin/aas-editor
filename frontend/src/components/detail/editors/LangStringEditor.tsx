import { Plus, X } from 'lucide-react';
import type { LangString } from '../../../types/aas';
import { inputStyle } from '../sections/Section';

interface LangStringEditorProps {
  value: LangString[];
  onChange: (value: LangString[]) => void;
}

const COMMON_LANGUAGES = ['de', 'en', 'fr', 'es', 'it', 'zh', 'ja', 'ko', 'pt', 'ru'];

export function LangStringEditor({ value, onChange }: LangStringEditorProps) {
  const addEntry = () => {
    const usedLangs = new Set(value.map((v) => v.language));
    const nextLang = COMMON_LANGUAGES.find((l) => !usedLangs.has(l)) || 'de';
    onChange([...value, { language: nextLang, text: '' }]);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: 'language' | 'text', val: string) => {
    onChange(value.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {value.map((entry, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <input
            value={entry.language}
            onChange={(e) => updateEntry(i, 'language', e.target.value)}
            style={{ ...inputStyle, width: 44, flexShrink: 0, textAlign: 'center' }}
            placeholder="de"
          />
          <input
            value={entry.text}
            onChange={(e) => updateEntry(i, 'text', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Text..."
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
        <Plus size={12} /> Sprache hinzufügen
      </button>
    </div>
  );
}
