import { useRef, useState, useEffect } from 'react';
import { Box, Download, Upload, BookOpen, Eye, FileText, Database } from 'lucide-react';
import { useAasStore } from '../../store/aasStore';
import { useRepoStore } from '../../store/repoStore';
import { exportShellToJson, downloadJson } from '../../utils/exportAas';
import { ExportDialog } from '../ui/ExportDialog';
import { RepoImportDialog } from '../ui/RepoImportDialog';

interface ToolbarProps {
  getViewportCenter: () => { x: number; y: number };
}

const btnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  backgroundColor: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-secondary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '9px 14px',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
};

function hoverIn(e: React.MouseEvent, borderColor: string) {
  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
  e.currentTarget.style.color = 'var(--text-primary)';
  e.currentTarget.style.borderColor = borderColor;
}

function hoverOut(e: React.MouseEvent) {
  e.currentTarget.style.backgroundColor = 'transparent';
  e.currentTarget.style.color = 'var(--text-secondary)';
  e.currentTarget.style.borderColor = 'var(--border)';
}

export function Toolbar({ getViewportCenter }: ToolbarProps) {
  const addShell = useAasStore((s) => s.addShell);
  const addConceptDescription = useAasStore((s) => s.addConceptDescription);
  const importEnvironment = useAasStore((s) => s.importEnvironment);
  const shells = useAasStore((s) => s.shells);
  const showConceptDescriptions = useAasStore((s) => s.showConceptDescriptions);
  const toggleConceptDescriptions = useAasStore((s) => s.toggleConceptDescriptions);
  const repos = useRepoStore((s) => s.repos);
  const fetchRepos = useRepoStore((s) => s.fetchRepos);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showRepoDialog, setShowRepoDialog] = useState(false);

  const validRepos = repos.filter((r) => r.status === 'valid');

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  useEffect(() => {
    if (!showImportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
        setShowImportMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowImportMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showImportMenu]);

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) importEnvironment(content, getViewportCenter());
    };
    reader.readAsText(file);
  };

  const handleExport = (shellId: string, _format: string, filename: string) => {
    const { json, errors } = exportShellToJson(shellId);
    if (errors.length > 0) console.warn('AAS Validierung:', errors);
    downloadJson(filename, json);
    setShowExportDialog(false);
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--node-shadow)',
        }}
      >
        <button
          onClick={() => addShell(getViewportCenter())}
          style={btnStyle}
          onMouseEnter={(e) => hoverIn(e, 'var(--node-aas)')}
          onMouseLeave={hoverOut}
          title="Neue Asset Administration Shell erstellen"
          type="button"
        >
          <Box size={16} style={{ color: 'var(--node-aas)' }} />
          Neue AAS
        </button>

        <button
          onClick={() => addConceptDescription(getViewportCenter())}
          style={btnStyle}
          onMouseEnter={(e) => hoverIn(e, 'var(--node-cd)')}
          onMouseLeave={hoverOut}
          title="Neue Concept Description erstellen"
          type="button"
        >
          <BookOpen size={16} style={{ color: 'var(--node-cd)' }} />
          Neue CD
        </button>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border)', alignSelf: 'center' }} />

        <button
          onClick={() => setShowExportDialog(true)}
          style={btnStyle}
          onMouseEnter={(e) => hoverIn(e, 'var(--success)')}
          onMouseLeave={hoverOut}
          title="AAS exportieren"
          type="button"
        >
          <Download size={16} style={{ color: 'var(--success)' }} />
          Export
        </button>

        <div style={{ position: 'relative' }} ref={importMenuRef}>
          <button
            onClick={() => setShowImportMenu((v) => !v)}
            style={btnStyle}
            onMouseEnter={(e) => hoverIn(e, 'var(--accent)')}
            onMouseLeave={hoverOut}
            title="AAS importieren"
            type="button"
          >
            <Upload size={16} style={{ color: 'var(--accent)' }} />
            Import
          </button>

          {showImportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: 'var(--node-shadow)',
                zIndex: 30,
                minWidth: 180,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  setShowImportMenu(false);
                  fileInputRef.current?.click();
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                type="button"
              >
                <FileText size={15} style={{ color: 'var(--accent)' }} />
                Lokale Datei
              </button>
              <button
                onClick={() => {
                  setShowImportMenu(false);
                  setShowRepoDialog(true);
                }}
                disabled={validRepos.length === 0}
                style={{
                  ...menuItemStyle,
                  opacity: validRepos.length === 0 ? 0.4 : 1,
                  cursor: validRepos.length === 0 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (validRepos.length > 0) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                type="button"
              >
                <Database size={15} style={{ color: 'var(--accent)' }} />
                Repository
              </button>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border)', alignSelf: 'center' }} />

        <button
          onClick={toggleConceptDescriptions}
          style={{
            ...btnStyle,
            backgroundColor: showConceptDescriptions ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
            borderColor: showConceptDescriptions ? 'var(--node-cd)' : 'var(--border)',
            color: showConceptDescriptions ? 'var(--node-cd)' : 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (!showConceptDescriptions) hoverIn(e, 'var(--node-cd)');
          }}
          onMouseLeave={(e) => {
            if (!showConceptDescriptions) hoverOut(e);
          }}
          title="Concept Descriptions ein-/ausblenden"
          type="button"
        >
          <Eye size={16} style={{ color: 'var(--node-cd)' }} />
          Zeige CDs
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
        />
      </div>

      {showExportDialog && (
        <ExportDialog
          shells={shells}
          onExport={handleExport}
          onCancel={() => setShowExportDialog(false)}
        />
      )}

      {showRepoDialog && (
        <RepoImportDialog
          onImport={({ submodel, conceptDescriptions }) => {
            importEnvironment(
              JSON.stringify({ submodels: [submodel], conceptDescriptions }),
              getViewportCenter(),
            );
            setShowRepoDialog(false);
          }}
          onCancel={() => setShowRepoDialog(false)}
        />
      )}
    </>
  );
}
