import { useState } from 'react';
import { X, Check, ChevronRight, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useExtractionStore } from '../../store/extractionStore';
import { commitGhostNodes, discardGhostNodes } from '../../lib/streamExtraction';

interface ReviewPanelProps {
  onClose: () => void;
}

interface SubmodelElement {
  idShort?: string;
  modelType?: string;
  valueType?: string;
  value?: unknown;
  min?: string;
  max?: string;
  [key: string]: unknown;
}

export function ReviewPanel({ onClose }: ReviewPanelProps) {
  const extractedJson = useExtractionStore((s) => s.extractedJson);
  const metadata = useExtractionStore((s) => s.metadata);
  const reviewState = useExtractionStore((s) => s.reviewState);
  const toggleReviewItem = useExtractionStore((s) => s.toggleReviewItem);
  const setReviewState = useExtractionStore((s) => s.setReviewState);

  if (!extractedJson) return null;

  const submodel = extractedJson.submodel as Record<string, unknown> | undefined;
  const elements = (submodel?.submodelElements as SubmodelElement[]) ?? [];

  const acceptedCount = Object.values(reviewState).filter(Boolean).length;
  const totalCount = countElements(elements);

  const handleAcceptAll = () => {
    const newState: Record<string, boolean> = {};
    collectIdShorts(elements, newState, true);
    setReviewState(newState);
  };

  const handleCommitSelected = () => {
    // Filter extractedJson to only include accepted elements
    if (Object.keys(reviewState).length > 0) {
      const filtered = filterElements(elements, reviewState);
      const updatedJson = {
        ...extractedJson,
        submodel: { ...submodel, submodelElements: filtered },
      };
      useExtractionStore.getState().setExtractedJson(updatedJson);
    }
    commitGhostNodes();
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        zIndex: 60,
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Extraktion pruefen
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {acceptedCount}/{totalCount} akzeptiert
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Warnings */}
      {metadata && metadata.warnings.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--warning-subtle)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)' }}>
              {metadata.warnings.length} Warnungen
            </span>
          </div>
          <div style={{ maxHeight: 80, overflowY: 'auto' }}>
            {metadata.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Element tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {elements.map((elem, i) => (
          <ElementTreeItem
            key={elem.idShort || i}
            element={elem}
            depth={0}
            reviewState={reviewState}
            onToggle={toggleReviewItem}
          />
        ))}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={handleAcceptAll}
          style={{
            flex: 1,
            padding: '7px 12px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Alle akzeptieren
        </button>
        <button
          type="button"
          onClick={handleCommitSelected}
          style={{
            flex: 1,
            padding: '7px 12px',
            backgroundColor: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Check size={13} />
          Uebernehmen
        </button>
        <button
          type="button"
          onClick={() => { discardGhostNodes(); onClose(); }}
          style={{
            padding: '7px 12px',
            backgroundColor: 'transparent',
            border: '1px solid var(--error)',
            borderRadius: 8,
            color: 'var(--error)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Tree item ───

function ElementTreeItem({
  element,
  depth,
  reviewState,
  onToggle,
}: {
  element: SubmodelElement;
  depth: number;
  reviewState: Record<string, boolean>;
  onToggle: (idShort: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const idShort = element.idShort || '?';
  const isAccepted = reviewState[idShort] ?? true; // default accepted
  const isCollection =
    element.modelType === 'SubmodelElementCollection' ||
    element.modelType === 'SubmodelElementList';
  const children = isCollection && Array.isArray(element.value) ? (element.value as SubmodelElement[]) : [];

  const typeLabel = element.modelType || '?';
  const valuePreview = getValuePreview(element);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 12px 4px ' + (12 + depth * 16) + 'px',
          cursor: 'pointer',
          fontSize: 12,
          transition: 'background-color 0.1s',
          opacity: isAccepted ? 1 : 0.4,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Expand toggle for collections */}
        {children.length > 0 ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              width: 16,
              flexShrink: 0,
            }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}

        {/* Accept/Reject checkbox */}
        <button
          type="button"
          onClick={() => onToggle(idShort)}
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: `1px solid ${isAccepted ? 'var(--success)' : 'var(--border)'}`,
            backgroundColor: isAccepted ? 'var(--success)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          {isAccepted && <CheckCircle2 size={10} style={{ color: '#fff' }} />}
        </button>

        {/* Type badge */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--accent)',
            backgroundColor: 'var(--accent-subtle)',
            padding: '1px 5px',
            borderRadius: 3,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {typeLabel.length > 10 ? typeLabel.slice(0, 8) + '..' : typeLabel}
        </span>

        {/* idShort */}
        <span
          style={{
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {idShort}
        </span>

        {/* Value preview */}
        {valuePreview && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {valuePreview}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && children.map((child, i) => (
        <ElementTreeItem
          key={child.idShort || i}
          element={child}
          depth={depth + 1}
          reviewState={reviewState}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

// ─── Helpers ───

function getValuePreview(elem: SubmodelElement): string {
  if (elem.modelType === 'Property' && typeof elem.value === 'string') {
    return elem.value.length > 30 ? elem.value.slice(0, 27) + '...' : elem.value;
  }
  if (elem.modelType === 'Range') {
    return `${elem.min ?? '?'}..${elem.max ?? '?'}`;
  }
  if (elem.modelType === 'MultiLanguageProperty' && Array.isArray(elem.value)) {
    return `${elem.value.length} lang`;
  }
  return '';
}

function countElements(elements: SubmodelElement[]): number {
  let count = 0;
  for (const elem of elements) {
    count++;
    if (
      (elem.modelType === 'SubmodelElementCollection' || elem.modelType === 'SubmodelElementList') &&
      Array.isArray(elem.value)
    ) {
      count += countElements(elem.value as SubmodelElement[]);
    }
  }
  return count;
}

function collectIdShorts(elements: SubmodelElement[], state: Record<string, boolean>, value: boolean): void {
  for (const elem of elements) {
    if (elem.idShort) state[elem.idShort] = value;
    if (Array.isArray(elem.value) && typeof elem.value[0] === 'object') {
      collectIdShorts(elem.value as SubmodelElement[], state, value);
    }
  }
}

function filterElements(elements: SubmodelElement[], reviewState: Record<string, boolean>): SubmodelElement[] {
  return elements
    .filter((elem) => reviewState[elem.idShort || ''] !== false)
    .map((elem) => {
      if (
        (elem.modelType === 'SubmodelElementCollection' || elem.modelType === 'SubmodelElementList') &&
        Array.isArray(elem.value)
      ) {
        return { ...elem, value: filterElements(elem.value as SubmodelElement[], reviewState) };
      }
      return elem;
    });
}
