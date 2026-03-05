import { Plus, X } from 'lucide-react';
import { Section } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { Reference, ReferenceTypes } from '../../../types/aas';

interface SemanticIdSectionProps {
  semanticId: Reference | undefined;
  supplementalSemanticIds?: Reference[];
  onChange: (value: Reference | undefined) => void;
  onSupplementalChange?: (value: Reference[] | undefined) => void;
}

export function SemanticIdSection({ semanticId, supplementalSemanticIds, onChange, onSupplementalChange }: SemanticIdSectionProps) {
  const addSupplemental = () => {
    if (!onSupplementalChange) return;
    const current = supplementalSemanticIds ?? [];
    onSupplementalChange([
      ...current,
      { type: 'ExternalReference' as ReferenceTypes, keys: [{ type: 'GlobalReference', value: '' }] },
    ]);
  };

  const updateSupplemental = (index: number, ref: Reference | undefined) => {
    if (!onSupplementalChange) return;
    const current = supplementalSemanticIds ?? [];
    if (!ref) {
      const updated = current.filter((_, i) => i !== index);
      onSupplementalChange(updated.length > 0 ? updated : undefined);
    } else {
      onSupplementalChange(current.map((r, i) => (i === index ? ref : r)));
    }
  };

  return (
    <Section title="Semantik" defaultOpen={!!semanticId}>
      <ReferenceEditor value={semanticId} onChange={onChange} />

      {onSupplementalChange && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
            supplementalSemanticIds
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {(supplementalSemanticIds ?? []).map((ref, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <ReferenceEditor
                  value={ref}
                  onChange={(r) => updateSupplemental(i, r)}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addSupplemental}
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
              <Plus size={12} /> Supplemental hinzufügen
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
