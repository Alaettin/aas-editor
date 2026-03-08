import { Check, Settings2, X, AlertTriangle } from 'lucide-react';
import { useExtractionStore } from '../../store/extractionStore';
import { commitGhostNodes, discardGhostNodes } from '../../lib/streamExtraction';

interface GhostActionBarProps {
  onReview: () => void;
}

export function GhostActionBar({ onReview }: GhostActionBarProps) {
  const metadata = useExtractionStore((s) => s.metadata);
  const phase = useExtractionStore((s) => s.phase);

  if (phase !== 'preview' && phase !== 'reviewing') return null;

  const hasWarnings = (metadata?.warnings?.length ?? 0) > 0 || (metadata?.hallucinationSuspects ?? 0) > 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Info */}
      {metadata && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {metadata.extractedProperties} Properties
          </span>
          {hasWarnings && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--warning)' }}>
              <AlertTriangle size={12} />
              {metadata.hallucinationSuspects > 0
                ? `${metadata.hallucinationSuspects} verdaechtig`
                : `${metadata.warnings.length} Warnungen`}
            </span>
          )}
          <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />
        </div>
      )}

      {/* Buttons */}
      <ActionButton
        icon={<Check size={14} />}
        label="Uebernehmen"
        color="var(--success)"
        onClick={commitGhostNodes}
      />
      <ActionButton
        icon={<Settings2 size={14} />}
        label="Anpassen"
        color="var(--accent)"
        onClick={onReview}
      />
      <ActionButton
        icon={<X size={14} />}
        label="Verwerfen"
        color="var(--error)"
        onClick={discardGhostNodes}
      />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        backgroundColor: 'transparent',
        border: `1px solid ${color}40`,
        borderRadius: 8,
        color,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${color}15`;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = `${color}40`;
      }}
    >
      {icon}
      {label}
    </button>
  );
}
