import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

const ELEMENT_TYPES = [
  { value: 'Property', label: 'Property', color: 'var(--node-property)' },
  { value: 'SubmodelElementCollection', label: 'Collection', color: 'var(--node-collection)' },
  { value: 'SubmodelElementList', label: 'List', color: 'var(--node-collection)' },
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

interface ElementTypeSelectProps {
  onSelect: (modelType: string) => void;
}

export function ElementTypeSelect({ onSelect }: ElementTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          width: '100%',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 6,
          color: 'var(--text-muted)',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
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
        <Plus size={14} />
        Element
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 70,
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          {ELEMENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(type.value);
                setOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: type.color,
                  flexShrink: 0,
                }}
              />
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
