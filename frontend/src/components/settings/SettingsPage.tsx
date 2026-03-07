import { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, RefreshCw, Database, Sparkles, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useAiStore, PROVIDER_MODELS, type AiProvider } from '../../store/aiStore';
import { useRepoStore, type ExternalRepo } from '../../store/repoStore';
import { useToastStore } from '../../store/toastStore';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
};

function StatusBadge({ repo }: { repo: ExternalRepo }) {
  if (repo.status === 'valid') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>
        <CheckCircle2 size={12} />
        {repo.submodel_count} Submodel{repo.submodel_count !== 1 ? 's' : ''}
      </span>
    );
  }
  if (repo.status === 'invalid') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--error)', fontWeight: 500 }}>
        <XCircle size={12} />
        Nicht erreichbar
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
      <HelpCircle size={12} />
      Nicht geprüft
    </span>
  );
}

function borderColor(status: string) {
  if (status === 'valid') return 'var(--success)';
  if (status === 'invalid') return 'var(--error)';
  return 'var(--border)';
}

function dotColor(status: string) {
  if (status === 'valid') return 'var(--success)';
  if (status === 'invalid') return 'var(--error)';
  return 'var(--text-muted)';
}

export function SettingsPage() {
  // AI Store
  const { enabled, imageAnalysis, provider, model, apiKey, setEnabled, setImageAnalysis, setProvider, setModel, setApiKey } = useAiStore();
  const [showKey, setShowKey] = useState(false);
  const models = PROVIDER_MODELS[provider];

  // Repo Store
  const { repos, loading, fetchRepos, addRepo, deleteRepo, revalidateRepo } = useRepoStore();
  const addToast = useToastStore((s) => s.addToast);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [revalidatingId, setRevalidatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handleAddRepo = async () => {
    if (!repoName.trim() || !repoUrl.trim()) {
      addToast('Name und URL sind erforderlich', 'error');
      return;
    }
    setAdding(true);
    const result = await addRepo(repoName, repoUrl);
    setAdding(false);

    if (result.error) {
      addToast(result.error, 'error');
    } else {
      addToast('Repository hinzugefügt', 'success');
      setRepoName('');
      setRepoUrl('');
      setShowAddForm(false);
    }
  };

  const handleRevalidate = async (id: string) => {
    setRevalidatingId(id);
    await revalidateRepo(id);
    setRevalidatingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteRepo(id);
    addToast('Repository entfernt', 'info');
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Verwalte deine Einstellungen.
        </p>
      </div>

      {/* AI Settings Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            AI Einstellungen
          </h2>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 24,
          }}
        >
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
              marginBottom: enabled ? 20 : 0,
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

              {/* Provider + Model row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
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
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
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
              </div>

              {/* API Key */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'openai' ? 'sk-...' : 'AIza...'}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
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
        </div>
      </div>

      {/* External Repositories Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Externe Repositories
            </h2>
            {repos.length > 0 && (
              <span
                style={{
                  padding: '2px 10px',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {repos.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: showAddForm ? 'var(--bg-elevated)' : 'var(--accent)',
              border: showAddForm ? '1px solid var(--border)' : 'none',
              borderRadius: 10,
              color: showAddForm ? 'var(--text-secondary)' : '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={14} style={{ transform: showAddForm ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
            {showAddForm ? 'Abbrechen' : 'Hinzufügen'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--accent)',
              borderRadius: 14,
              padding: 20,
              marginBottom: 12,
              animation: 'toast-in 0.2s ease-out',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Name
                </label>
                <input
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="z.B. AASX Server"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddRepo(); }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Base URL
                </label>
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://aas-server.example.com/api/v3.0"
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddRepo(); }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Die URL wird auf /submodels geprüft (AAS V3 API).
              </div>
              <button
                onClick={handleAddRepo}
                disabled={adding || !repoName.trim() || !repoUrl.trim()}
                style={{
                  padding: '8px 20px',
                  backgroundColor: adding ? 'var(--bg-active)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: adding ? 'not-allowed' : 'pointer',
                  opacity: (!repoName.trim() || !repoUrl.trim()) ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {adding && (
                  <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {adding ? 'Prüfe...' : 'Prüfen & Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Repo List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--border)',
                  borderRadius: 12,
                  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        ) : repos.length === 0 && !showAddForm ? (
          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 16,
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <Database size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Noch keine Repositories konfiguriert
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Verbinde externe AAS-Server, um Submodelle in deine Projekte zu importieren.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {repos.map((repo) => (
              <div
                key={repo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${borderColor(repo.status)}`,
                  borderRadius: 12,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dotColor(repo.status),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {repo.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <code
                        style={{
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-elevated)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 400,
                        }}
                      >
                        {repo.base_url}
                      </code>
                      <span style={{ color: 'var(--border-hover)' }}>·</span>
                      <StatusBadge repo={repo} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {/* Revalidate */}
                  <button
                    onClick={() => handleRevalidate(repo.id)}
                    disabled={revalidatingId === repo.id}
                    style={{
                      padding: 6,
                      backgroundColor: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: 6,
                      color: 'var(--text-muted)',
                      cursor: revalidatingId === repo.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    title="Erneut prüfen"
                  >
                    <RefreshCw
                      size={14}
                      style={{
                        animation: revalidatingId === repo.id ? 'spin 1s linear infinite' : 'none',
                      }}
                    />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(repo.id)}
                    style={{
                      padding: 6,
                      backgroundColor: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: 6,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--error)';
                      e.currentTarget.style.color = 'var(--error)';
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Entfernen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CORS hint */}
        {repos.some((r) => r.status === 'invalid') && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Nicht erreichbar — mögliche Ursachen: Server offline, CORS nicht konfiguriert, oder falsche URL.
          </div>
        )}
      </div>

      {/* Spin animation for RefreshCw */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
