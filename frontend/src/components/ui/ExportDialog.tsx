import { useState, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import type { AssetAdministrationShell } from '../../types/aas';

interface ExportDialogProps {
  shells: AssetAdministrationShell[];
  onExport: (shellId: string, format: string, filename: string) => void;
  onCancel: () => void;
}

const FORMATS = [
  { value: 'json', label: 'JSON', enabled: true },
  { value: 'xml', label: 'XML', enabled: false },
  { value: 'aasx', label: 'AASX', enabled: false },
];

export function ExportDialog({ shells, onExport, onCancel }: ExportDialogProps) {
  const [selectedId, setSelectedId] = useState(shells[0]?.id ?? '');
  const [format, setFormat] = useState('json');
  const [filename, setFilename] = useState('');
  const exportRef = useRef<HTMLButtonElement>(null);

  // Auto-generate filename from selected shell
  useEffect(() => {
    const shell = shells.find((s) => s.id === selectedId);
    if (shell) {
      setFilename(`${shell.idShort || 'aas'}.${format}`);
    }
  }, [selectedId, format, shells]);

  useEffect(() => {
    exportRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleExport = () => {
    if (!selectedId) return;
    onExport(selectedId, format, filename);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          padding: '24px',
          maxWidth: 440,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={18} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            AAS exportieren
          </h3>
        </div>

        {/* AAS Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Asset Administration Shell
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {shells.map((shell) => {
              const isSelected = shell.id === selectedId;
              return (
                <button
                  key={shell.id}
                  type="button"
                  onClick={() => setSelectedId(shell.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    padding: '10px 12px',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-base)',
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hover, var(--text-muted))';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                        backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {shell.idShort || '(kein idShort)'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginLeft: 18,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shell.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Format
          </label>
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 8,
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                disabled={!f.enabled}
                onClick={() => f.enabled && setFormat(f.value)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  backgroundColor: format === f.value ? 'var(--accent)' : 'transparent',
                  border: 'none',
                  borderRight: '1px solid var(--border)',
                  color: format === f.value ? '#fff' : f.enabled ? 'var(--text-secondary)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: f.enabled ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  opacity: f.enabled ? 1 : 0.4,
                  position: 'relative',
                }}
              >
                {f.label}
                {!f.enabled && (
                  <span style={{ fontSize: 9, display: 'block', fontWeight: 400, opacity: 0.7 }}>
                    bald
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filename */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dateiname
          </label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 18px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover, var(--text-muted))';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Abbrechen
          </button>
          <button
            ref={exportRef}
            type="button"
            onClick={handleExport}
            disabled={!selectedId}
            style={{
              padding: '8px 18px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid var(--success)',
              borderRadius: 8,
              color: 'var(--success)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
              e.currentTarget.style.color = 'var(--success)';
            }}
          >
            <Download size={14} />
            Exportieren
          </button>
        </div>
      </div>
    </div>
  );
}
