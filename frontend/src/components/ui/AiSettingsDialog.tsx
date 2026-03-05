import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAiStore, PROVIDER_MODELS, type AiProvider } from '../../store/aiStore';

interface AiSettingsDialogProps {
  onClose: () => void;
}

export function AiSettingsDialog({ onClose }: AiSettingsDialogProps) {
  const { enabled, imageAnalysis, provider, model, apiKey, setEnabled, setImageAnalysis, setProvider, setModel, setApiKey } =
    useAiStore();
  const [showKey, setShowKey] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const models = PROVIDER_MODELS[provider];

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
      onMouseDown={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          padding: 24,
          maxWidth: 420,
          width: '90%',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 20,
          }}
        >
          AI Einstellungen
        </h3>

        {/* AI Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: enabled ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
            border: `1px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10,
            marginBottom: 20,
            transition: 'all 0.2s',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              AI-Modus
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Dokumente per Drag & Drop in AAS umwandeln
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              backgroundColor: enabled ? 'var(--accent)' : 'var(--bg-active)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: 3,
                left: enabled ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {/* Provider & Model & Key — only shown when enabled */}
        {enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Image Analysis Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Bildanalyse
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  PDFs als Bilder senden (bessere Tabellen, mehr Tokens)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageAnalysis(!imageAnalysis)}
                style={{
                  width: 38,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: imageAnalysis ? 'var(--accent)' : 'var(--bg-active)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: imageAnalysis ? 21 : 3,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>

            {/* Provider */}
            <div>
              <label
                style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}
              >
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AiProvider)}
                style={selectStyle}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            {/* Model */}
            <div>
              <label
                style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}
              >
                Modell
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={selectStyle}
              >
                {models.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label
                style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}
              >
                API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'openai' ? 'sk-...' : 'AIza...'}
                  style={{
                    width: '100%',
                    padding: '8px 40px 8px 12px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                  }}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Dein Key wird nur in deiner Browser-Sitzung gespeichert.
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 20px',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
