import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FolderOpen, Clock } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  return new Date(dateStr).toLocaleDateString('de-DE');
}

export function ProjectListPage() {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredCreate, setHoveredCreate] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    setCreating(true);
    const id = await createProject();
    setCreating(false);
    if (id) navigate(`/editor/${id}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            Projekte
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Verwalte deine AAS-Canvas-Projekte.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          onMouseEnter={() => setHoveredCreate(true)}
          onMouseLeave={() => setHoveredCreate(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            backgroundColor: hoveredCreate && !creating ? 'var(--accent-hover)' : 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: creating ? 'not-allowed' : 'pointer',
            opacity: creating ? 0.6 : 1,
            transition: 'all 0.2s ease',
            transform: hoveredCreate && !creating ? 'translateY(-1px)' : 'none',
            boxShadow: hoveredCreate && !creating ? '0 4px 12px var(--accent-glow)' : 'none',
          }}
        >
          <Plus size={16} />
          Neues Projekt
        </button>
      </div>

      {/* Content */}
      {loading ? (
        /* Skeleton Loading */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--border)',
                borderRadius: 14,
                padding: 24,
                height: 120,
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 16,
            padding: '64px 32px',
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          <FolderOpen size={56} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Noch keine Projekte
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Erstelle dein erstes Projekt, um loszulegen.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={16} />
            Neues Projekt
          </button>
        </div>
      ) : (
        /* Project Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {projects.map((project) => {
            const isHovered = hoveredCard === project.id;
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                onMouseEnter={() => setHoveredCard(project.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--bg-surface)',
                  borderTop: `1px solid ${isHovered ? 'var(--border-hover)' : 'var(--border)'}`,
                  borderRight: `1px solid ${isHovered ? 'var(--border-hover)' : 'var(--border)'}`,
                  borderBottom: `1px solid ${isHovered ? 'var(--border-hover)' : 'var(--border)'}`,
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 14,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  boxShadow: isHovered ? 'var(--card-hover-shadow)' : 'none',
                }}
              >
                {/* Delete button - appears on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(project.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: 6,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isHovered ? 1 : 0,
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

                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, paddingRight: 32 }}>
                  {project.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatRelativeTime(project.updated_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Projekt löschen"
          message="Möchtest du dieses Projekt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

    </div>
  );
}
