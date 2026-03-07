import { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Search, Database, Loader2, AlertCircle } from 'lucide-react';
import { useRepoStore, type ExternalRepo } from '../../store/repoStore';

interface RepoImportDialogProps {
  onImport: (submodelJson: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface SubmodelEntry {
  idShort?: string;
  id?: string;
  [key: string]: unknown;
}

export function RepoImportDialog({ onImport, onCancel }: RepoImportDialogProps) {
  const repos = useRepoStore((s) => s.repos);
  const fetchSubmodels = useRepoStore((s) => s.fetchSubmodels);

  const validRepos = repos.filter((r) => r.status === 'valid');

  const [selectedRepo, setSelectedRepo] = useState<ExternalRepo | null>(null);
  const [submodels, setSubmodels] = useState<SubmodelEntry[]>([]);
  const [selectedSmId, setSelectedSmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleSelectRepo = async (repo: ExternalRepo) => {
    setSelectedRepo(repo);
    setLoading(true);
    setError('');
    setSubmodels([]);
    setSelectedSmId(null);
    setSearch('');

    const result = await fetchSubmodels(repo.id);
    if (result.length === 0) {
      setError('Keine Submodelle gefunden oder Verbindung fehlgeschlagen');
    }
    setSubmodels(result as SubmodelEntry[]);
    setLoading(false);
  };

  const handleBack = () => {
    setSelectedRepo(null);
    setSubmodels([]);
    setSelectedSmId(null);
    setSearch('');
    setError('');
  };

  const handleImport = () => {
    const sm = submodels.find((s) => s.id === selectedSmId);
    if (sm) onImport(sm);
  };

  const filtered = submodels.filter((sm) => {
    const q = search.toLowerCase();
    return (
      (sm.idShort?.toLowerCase().includes(q) ?? false) ||
      (sm.id?.toLowerCase().includes(q) ?? false)
    );
  });

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
          maxWidth: 480,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '70vh',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {selectedRepo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
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
              <ArrowLeft size={14} />
            </button>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {selectedRepo.name}
            </h3>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Submodel aus Repository importieren
            </h3>
          </div>
        )}

        {/* Content */}
        {!selectedRepo ? (
          /* Step 1: Repo list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
            {validRepos.map((repo) => (
              <button
                key={repo.id}
                type="button"
                onClick={() => handleSelectRepo(repo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {repo.name}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {repo.submodel_count} Submodels
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Submodel list */
          <>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 30px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                overflowY: 'auto',
                minHeight: 100,
                maxHeight: 320,
              }}
            >
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: 'var(--text-muted)' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13 }}>Lade Submodelle...</span>
                </div>
              )}

              {error && !loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, color: 'var(--error)', fontSize: 13 }}>
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Keine Submodelle gefunden
                </div>
              )}

              {!loading && filtered.map((sm) => {
                const isSelected = sm.id === selectedSmId;
                return (
                  <button
                    key={sm.id}
                    type="button"
                    onClick={() => setSelectedSmId(sm.id ?? null)}
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
                        {sm.idShort || '(kein idShort)'}
                      </span>
                    </div>
                    {sm.id && (
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
                        {sm.id}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

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

          {selectedRepo && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedSmId}
              style={{
                padding: '8px 18px',
                backgroundColor: selectedSmId ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: `1px solid ${selectedSmId ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
                color: selectedSmId ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedSmId ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: selectedSmId ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (selectedSmId) {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSmId) {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.color = 'var(--accent)';
                }
              }}
            >
              <Upload size={14} />
              Importieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
