import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, AlertCircle } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from '../canvas/Canvas';
import { useProjectStore } from '../../store/projectStore';
import { useAasStore } from '../../store/aasStore';
import { useToastStore } from '../../store/toastStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { loadProject, saveProject, currentProjectId, saving, isDirty, markDirty } = useProjectStore();
  const [projectName, setProjectName] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Load project on mount
  useEffect(() => {
    if (!projectId) return;
    loadProject(projectId).then((ok) => {
      if (!ok) {
        navigate('/projects', { replace: true });
        return;
      }
      // Fetch project name
      import('../../lib/supabase').then(({ supabase }) => {
        supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single()
          .then(({ data }) => {
            if (data) setProjectName(data.name);
          });
      });
      setLoaded(true);
    });

    return () => {
      useAasStore.getState().clearCanvas();
      useProjectStore.setState({ currentProjectId: null, isDirty: false });
    };
  }, [projectId, loadProject, navigate]);

  // Track dirty state by subscribing to aasStore changes
  useEffect(() => {
    if (!loaded) return;
    const unsub = useAasStore.subscribe(() => {
      if (useProjectStore.getState().currentProjectId) {
        markDirty();
      }
    });
    return unsub;
  }, [loaded, markDirty]);

  // Ctrl+S save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = useCallback(async () => {
    if (!currentProjectId || saving) return;
    setSaveError(false);
    const ok = await saveProject();
    if (!ok) setSaveError(true);
  }, [currentProjectId, saving, saveProject]);

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
    } else {
      navigate('/projects');
    }
  };

  const handleNameBlur = async () => {
    if (!projectId || !projectName.trim()) return;
    const ok = await useProjectStore.getState().renameProject(projectId, projectName.trim());
    if (!ok) {
      // Revert to current stored name
      const current = useProjectStore.getState().projects.find((p) => p.id === projectId);
      if (current) setProjectName(current.name);
      useToastStore.getState().addToast('Projektname bereits vergeben', 'error');
    }
  };

  const status: SaveStatus = saveError ? 'error' : saving ? 'saving' : isDirty ? 'dirty' : 'saved';

  if (!loaded) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-secondary)',
          fontSize: 14,
        }}
      >
        Projekt wird geladen...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          zIndex: 30,
        }}
      >
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          title="Zurück zur Projektliste"
        >
          <ArrowLeft size={16} />
          Zurück
        </button>

        <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />

        <input
          ref={nameRef}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={handleNameBlur}
          maxLength={100}
          onKeyDown={(e) => {
            if (e.key === 'Enter') nameRef.current?.blur();
          }}
          style={{
            flex: 1,
            maxWidth: 300,
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--border)')}
          onBlurCapture={(e) => (e.target.style.borderColor = 'transparent')}
        />

        <div style={{ flex: 1 }} />

        {/* Save status pill */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color:
              status === 'saved'
                ? 'var(--success)'
                : status === 'error'
                  ? 'var(--error)'
                  : status === 'dirty'
                    ? 'var(--warning)'
                    : 'var(--text-secondary)',
            backgroundColor:
              status === 'saved'
                ? 'var(--success-subtle)'
                : status === 'error'
                  ? 'var(--error-subtle)'
                  : status === 'dirty'
                    ? 'var(--warning-subtle)'
                    : 'var(--accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 12,
            transition: 'all 0.2s',
          }}
        >
          {status === 'saved' && <><Check size={12} /> Gespeichert</>}
          {status === 'dirty' && <><AlertCircle size={12} /> Ungespeichert</>}
          {status === 'saving' && 'Speichert...'}
          {status === 'error' && <><AlertCircle size={12} /> Fehler</>}
        </span>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            backgroundColor: isDirty ? 'var(--accent)' : 'var(--bg-elevated)',
            border: isDirty ? 'none' : '1px solid var(--border)',
            borderRadius: 8,
            color: isDirty ? '#fff' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
            cursor: isDirty && !saving ? 'pointer' : 'default',
            transition: 'all 0.2s',
            animation: isDirty && !saving ? 'pulse-save 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={(e) => {
            if (isDirty && !saving) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            if (isDirty) e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
          title="Ctrl+S"
        >
          <Save size={14} />
          Speichern
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </div>

      {showLeaveDialog && (
        <ConfirmDialog
          title="Ungespeicherte Änderungen"
          message="Du hast ungespeicherte Änderungen. Möchtest du wirklich zurück zur Projektliste?"
          confirmLabel="Verlassen"
          cancelLabel="Abbrechen"
          onConfirm={() => navigate('/projects')}
          onCancel={() => setShowLeaveDialog(false)}
        />
      )}
    </div>
  );
}
