import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Globe, FileText, AlertTriangle, Copy, Check, ChevronRight, FolderOpen } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useApiStore } from '../../store/apiStore';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { AssetAdministrationShell, Submodel } from '../../types/aas';

interface ProjectWithShells {
  id: string;
  name: string;
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
}

export function ApiConfigPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { shells: publishedShells, loading, fetchPublished, publishShell, unpublishShell } = useApiStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [projects, setProjects] = useState<ProjectWithShells[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deleteShellId, setDeleteShellId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishingShellId, setPublishingShellId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [hoveredAdd, setHoveredAdd] = useState(false);
  const [hoveredDocsCard, setHoveredDocsCard] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const userBaseUrl = `${apiBaseUrl}/${user?.id ?? ''}`;

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    const { data } = await supabase
      .from('projects')
      .select('id, name, canvas_data')
      .order('updated_at', { ascending: false });

    if (data) {
      const parsed: ProjectWithShells[] = data
        .map((p) => {
          const canvas = p.canvas_data as {
            shells?: AssetAdministrationShell[];
            submodels?: Submodel[];
          };
          return {
            id: p.id,
            name: p.name,
            shells: canvas?.shells ?? [],
            submodels: canvas?.submodels ?? [],
          };
        })
        .filter((p) => p.shells.length > 0);
      setProjects(parsed);
    }
    setLoadingProjects(false);
  };

  const handleOpenAddDialog = () => {
    setPublishError(null);
    loadProjects();
    setShowAddDialog(true);
  };

  const handlePublish = async (project: ProjectWithShells, shell: AssetAdministrationShell) => {
    setPublishingShellId(shell.id);
    setPublishError(null);

    const smIds = (shell.submodels ?? []).map((ref) => ref.keys?.[0]?.value).filter(Boolean);
    const relatedSms = project.submodels.filter((sm) => smIds.includes(sm.id));

    const result = await publishShell(project.id, shell, relatedSms);
    setPublishingShellId(null);

    if (result.error) {
      setPublishError(result.error);
    }
  };

  const handleUnpublish = async () => {
    if (!deleteShellId) return;
    await unpublishShell(deleteShellId);
    setDeleteShellId(null);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(userBaseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  // Build project name map for display
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (publishedShells.length === 0) return;
    const projectIds = [...new Set(publishedShells.map((s) => s.project_id))];
    supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          for (const p of data) map[p.id] = p.name;
          setProjectNames(map);
        }
      });
  }, [publishedShells]);

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            API Repository
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Verwalte deine publizierten Asset Administration Shells.
          </p>
        </div>
        <button
          onClick={handleOpenAddDialog}
          onMouseEnter={() => setHoveredAdd(true)}
          onMouseLeave={() => setHoveredAdd(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            backgroundColor: hoveredAdd ? 'var(--accent-hover)' : 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: hoveredAdd ? 'translateY(-1px)' : 'none',
            boxShadow: hoveredAdd ? '0 4px 12px var(--accent-glow)' : 'none',
          }}
        >
          <Plus size={16} />
          AAS hinzufügen
        </button>
      </div>

      {/* Info Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {/* Base URL Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Base URL
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Aktiv
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 11,
                color: 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: 'break-all',
              }}
            >
              {userBaseUrl}
            </code>
            <button
              onClick={copyUrl}
              style={{
                padding: 4,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="URL kopieren"
            >
              {copiedUrl ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Docs Link Card */}
        <div
          onClick={() => navigate('/api-docs')}
          onMouseEnter={() => setHoveredDocsCard(true)}
          onMouseLeave={() => setHoveredDocsCard(false)}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: `1px solid ${hoveredDocsCard ? 'var(--border-hover)' : 'var(--border)'}`,
            borderRadius: 14,
            padding: 20,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Dokumentation
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Endpunkt-Referenz und Try-It Playground
            </span>
            <ChevronRight
              size={16}
              style={{
                color: 'var(--text-muted)',
                transition: 'transform 0.2s ease',
                transform: hoveredDocsCard ? 'translateX(3px)' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Published AAS Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          Publizierte AAS
        </h2>
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
          {publishedShells.length}
        </span>
      </div>

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
      ) : publishedShells.length === 0 ? (
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 16,
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <Globe size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Noch keine AAS publiziert
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Füge AAS aus deinen Projekten hinzu, um sie über die API verfügbar zu machen.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {publishedShells.map((ps) => {
            const json = ps.shell_json as { idShort?: string; id?: string };
            return (
              <div
                key={ps.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--success)',
                  borderRadius: 12,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {json.idShort || json.id || ps.shell_id}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FolderOpen size={11} />
                      {projectNames[ps.project_id] || '...'}
                      <span style={{ color: 'var(--border-hover)' }}>·</span>
                      <code
                        style={{
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                          backgroundColor: 'var(--bg-elevated)',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {ps.shell_id}
                      </code>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteShellId(ps.shell_id)}
                  style={{
                    padding: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: 6,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
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
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add AAS Dialog */}
      {showAddDialog && (
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
          onMouseDown={() => setShowAddDialog(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
              maxWidth: 540,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                AAS zur API hinzufügen
              </h3>
            </div>

            {/* Dialog Content */}
            <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
              {publishError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '10px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--error)',
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <AlertTriangle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: 'var(--error)', lineHeight: 1.4 }}>{publishError}</span>
                </div>
              )}

              {loadingProjects ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Projekte werden geladen...</p>
              ) : projects.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Keine Projekte mit AAS gefunden.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {projects.map((project) => (
                    <div key={project.id}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                        }}
                      >
                        <FolderOpen size={12} />
                        {project.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {project.shells.map((shell) => {
                          const smCount = (shell.submodels ?? []).length;
                          const alreadyPublished = publishedShells.some((ps) => ps.shell_id === shell.id);

                          return (
                            <div
                              key={shell.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                opacity: alreadyPublished ? 0.5 : 1,
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {shell.idShort || shell.id}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {smCount} Submodel{smCount !== 1 ? 's' : ''}
                                  {alreadyPublished && (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '1px 8px',
                                        backgroundColor: 'var(--success-subtle)',
                                        color: 'var(--success)',
                                        borderRadius: 9999,
                                        fontSize: 10,
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Check size={10} />
                                      Publiziert
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!alreadyPublished && (() => {
                                const isPublishing = publishingShellId === shell.id;
                                return (
                                  <button
                                    onClick={() => handlePublish(project, shell)}
                                    disabled={publishingShellId !== null}
                                    style={{
                                      padding: '5px 12px',
                                      backgroundColor: 'var(--accent)',
                                      border: 'none',
                                      borderRadius: 6,
                                      color: '#fff',
                                      fontSize: 12,
                                      fontWeight: 500,
                                      cursor: publishingShellId !== null ? 'not-allowed' : 'pointer',
                                      opacity: publishingShellId !== null ? 0.6 : 1,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    {isPublishing ? '...' : 'Hinzufügen'}
                                  </button>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddDialog(false)}
                style={{
                  padding: '7px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteShellId && (
        <ConfirmDialog
          title="AAS aus API entfernen"
          message="Die AAS und ihre Submodels werden aus der öffentlichen API entfernt."
          confirmLabel="Entfernen"
          onConfirm={handleUnpublish}
          onCancel={() => setDeleteShellId(null)}
        />
      )}
    </div>
  );
}
