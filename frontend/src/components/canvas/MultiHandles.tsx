import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';

const POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left];

// Position the invisible hover zone at each edge of the node
function getHoverZoneStyle(pos: Position): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute', zIndex: 10, width: 28, height: 28 };
  switch (pos) {
    case Position.Top:
      return { ...base, top: -14, left: '50%', transform: 'translateX(-50%)' };
    case Position.Right:
      return { ...base, right: -14, top: '50%', transform: 'translateY(-50%)' };
    case Position.Bottom:
      return { ...base, bottom: -14, left: '50%', transform: 'translateX(-50%)' };
    case Position.Left:
      return { ...base, left: -14, top: '50%', transform: 'translateY(-50%)' };
  }
}

// "+" button offset — positioned outward from the hover zone
const PLUS_OFFSET: Record<string, React.CSSProperties> = {
  [Position.Top]: { bottom: '100%', left: '50%', transform: 'translate(-50%, -4px)' },
  [Position.Right]: { left: '100%', top: '50%', transform: 'translate(4px, -50%)' },
  [Position.Bottom]: { top: '100%', left: '50%', transform: 'translate(-50%, 4px)' },
  [Position.Left]: { right: '100%', top: '50%', transform: 'translate(-4px, -50%)' },
};

// Dropdown popup offset
const POPUP_OFFSET: Record<string, React.CSSProperties> = {
  [Position.Top]: { bottom: '100%', left: '50%', transform: 'translate(-50%, -36px)', marginBottom: 4 },
  [Position.Right]: { left: '100%', top: '50%', transform: 'translate(36px, -50%)' },
  [Position.Bottom]: { top: '100%', left: '50%', transform: 'translate(-50%, 36px)', marginTop: 4 },
  [Position.Left]: { right: '100%', top: '50%', transform: 'translate(-36px, -50%)' },
};

export interface AddOption {
  value: string;
  label: string;
  color: string;
}

export const ELEMENT_OPTIONS: AddOption[] = [
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

interface MultiHandlesProps {
  color: string;
  addMode?: 'direct' | 'dropdown';
  onAdd?: (modelType?: string, position?: Position) => void;
  addOptions?: AddOption[];
}

export function MultiHandles({ color, addMode, onAdd, addOptions }: MultiHandlesProps) {
  const [hoveredPos, setHoveredPos] = useState<Position | null>(null);
  const [popupPos, setPopupPos] = useState<Position | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const plusBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

  const cancelHide = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  }, []);

  const startHide = useCallback(
    (pos: Position) => {
      cancelHide();
      hideTimeout.current = setTimeout(() => {
        setHoveredPos((current) => {
          if (current === pos && popupPos !== pos) return null;
          return current;
        });
        hideTimeout.current = null;
      }, 300);
    },
    [cancelHide, popupPos],
  );

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!popupPos) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as HTMLElement)) {
        setPopupPos(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popupPos]);

  const handlePlusClick = (pos: Position, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onAdd) return;

    if (addMode === 'direct') {
      onAdd(undefined, pos);
    } else if (addMode === 'dropdown') {
      if (popupPos === pos) {
        setPopupPos(null);
      } else {
        // Calculate portal position from the "+" button
        const btn = plusBtnRefs.current[pos];
        if (btn) {
          const rect = btn.getBoundingClientRect();
          const style: React.CSSProperties = { position: 'fixed', zIndex: 9999 };
          switch (pos) {
            case Position.Top:
              style.left = rect.left + rect.width / 2;
              style.top = rect.top - 4;
              style.transform = 'translate(-50%, -100%)';
              break;
            case Position.Bottom:
              style.left = rect.left + rect.width / 2;
              style.top = rect.bottom + 4;
              style.transform = 'translateX(-50%)';
              break;
            case Position.Right:
              style.left = rect.right + 4;
              style.top = rect.top + rect.height / 2;
              style.transform = 'translateY(-50%)';
              break;
            case Position.Left:
              style.left = rect.left - 4;
              style.top = rect.top + rect.height / 2;
              style.transform = 'translate(-100%, -50%)';
              break;
          }
          setPortalStyle(style);
        }
        setPopupPos(pos);
      }
    }
  };

  // Shared handle style — small colored dot
  const handleDotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    backgroundColor: color,
    border: '2px solid var(--bg-elevated)',
    opacity: 0.6,
  };

  return (
    <>
      {/* Portal dropdown — rendered outside node stacking context */}
      {popupPos && addOptions && createPortal(
        <div
          ref={popupRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            ...portalStyle,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            padding: '4px 0',
            minWidth: 160,
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          {addOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                if (onAdd) onAdd(opt.value, popupPos);
                setPopupPos(null);
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
                  backgroundColor: opt.color,
                  flexShrink: 0,
                }}
              />
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}

      {/* Native React Flow handles — positioned automatically by React Flow */}
      {POSITIONS.map((pos) => (
        <Handle
          key={`source-${pos}`}
          type="source"
          position={pos}
          id={`source-${pos}`}
          style={handleDotStyle}
        />
      ))}
      {POSITIONS.map((pos) => (
        <Handle
          key={`target-${pos}`}
          type="target"
          position={pos}
          id={`target-${pos}`}
          style={{ ...handleDotStyle, opacity: 0, width: 16, height: 16 }}
        />
      ))}

      {/* Hover zones — separate overlay divs for the "+" UI */}
      {POSITIONS.map((pos) => (
        <div
          key={`hover-${pos}`}
          onMouseEnter={() => {
            cancelHide();
            setHoveredPos(pos);
          }}
          onMouseLeave={() => startHide(pos)}
          style={getHoverZoneStyle(pos)}
        >
          {/* "+" button on hover */}
          {addMode && onAdd && (hoveredPos === pos || popupPos === pos) && (
            <button
              ref={(el) => { plusBtnRefs.current[pos] = el; }}
              onClick={(e) => handlePlusClick(pos, e)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={cancelHide}
              onMouseLeave={() => startHide(pos)}
              type="button"
              style={{
                position: 'absolute',
                ...PLUS_OFFSET[pos],
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: color,
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                padding: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      ))}
    </>
  );
}
