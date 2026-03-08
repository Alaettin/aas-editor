import { useEffect, useRef, useState } from 'react';
import { Sparkles, FileText, Loader2, ChevronDown } from 'lucide-react';
import { useExtractionStore, type ClassificationResult, type TargetMode, type ProjectSubmodels } from '../../store/extractionStore';
import { useProjectStore } from '../../store/projectStore';
import { supabase } from '../../lib/supabase';
import type { Submodel, SubmodelElement, ConceptDescription } from '../../types/aas';
import { countProperties } from '../../lib/postProcess';

interface ClassificationDialogProps {
  fileName: string;
  fileSize: number;
  onExtract: () => void;
  onCancel: () => void;
}

const DOCUMENT_TYPES: { value: ClassificationResult['documentType']; label: string }[] = [
  { value: 'technical_datasheet', label: 'Technisches Datenblatt' },
  { value: 'nameplate', label: 'Typenschild' },
  { value: 'certificate', label: 'Zertifikat' },
  { value: 'manual', label: 'Handbuch / Anleitung' },
  { value: 'unknown', label: 'Unbekannt' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export function ClassificationDialog({ fileName, fileSize, onExtract, onCancel }: ClassificationDialogProps) {
  const extractRef = useRef<HTMLButtonElement>(null);
  const phase = useExtractionStore((s) => s.phase);
  const classification = useExtractionStore((s) => s.classification);
  const updateClassification = useExtractionStore((s) => s.updateClassification);

  const isClassifying = phase === 'classifying';
  const hasClassification = !!classification;

  // Local editable state initialized from classification
  const [docType, setDocType] = useState<ClassificationResult['documentType']>('unknown');
  const [productName, setProductName] = useState('');
  const [productId, setProductId] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  // Sync from classification result when it arrives
  useEffect(() => {
    if (classification) {
      setDocType(classification.documentType);
      setProductName(classification.productName);
      setProductId(classification.productId);
      setManufacturer(classification.manufacturer);
    }
  }, [classification]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  // Focus extract button when classification is ready
  useEffect(() => {
    if (hasClassification) extractRef.current?.focus();
  }, [hasClassification]);

  const targetMode = useExtractionStore((s) => s.targetMode);
  const selectedSubmodelIds = useExtractionStore((s) => s.selectedSubmodelIds);

  const canExtract = hasClassification && (targetMode === 'new' || selectedSubmodelIds.length > 0);

  const handleExtract = () => {
    if (!canExtract) return;
    // Push local edits back to store before extracting
    updateClassification({
      documentType: docType,
      productName,
      productId,
      manufacturer,
    });
    onExtract();
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
          padding: 24,
          maxWidth: 480,
          width: '90%',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText size={18} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Dokument erkannt
          </h3>
        </div>

        {/* File info */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              marginRight: 12,
            }}
          >
            {fileName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {formatSize(fileSize)}
          </span>
        </div>

        {/* Classification fields */}
        {isClassifying ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', justifyContent: 'center' }}>
            <Loader2 size={16} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Dokument wird analysiert...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {/* Document Type */}
            <div>
              <label style={labelStyle}>Typ</label>
              <div style={{ position: 'relative', marginTop: 4 }}>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as ClassificationResult['documentType'])}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    paddingRight: 28,
                    cursor: 'pointer',
                  }}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label style={labelStyle}>Produkt</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Produktbezeichnung"
                style={{ ...inputStyle, marginTop: 4 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label style={labelStyle}>Hersteller</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Herstellername"
                style={{ ...inputStyle, marginTop: 4 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Product ID */}
            <div>
              <label style={labelStyle}>Artikelnr.</label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Artikelnummer / Bestellnummer"
                style={{ ...inputStyle, marginTop: 4 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>
        )}

        {/* Separator */}
        <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '4px 0 16px' }} />

        {/* Target structure */}
        <TargetSection />

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '7px 16px',
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
              e.currentTarget.style.borderColor = 'var(--border-hover)';
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
            ref={extractRef}
            type="button"
            onClick={handleExtract}
            disabled={isClassifying || !canExtract}
            style={{
              padding: '7px 16px',
              backgroundColor: (isClassifying || !canExtract) ? 'var(--bg-elevated)' : 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: (isClassifying || !canExtract) ? 'var(--text-muted)' : '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: (isClassifying || !canExtract) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (!isClassifying && canExtract) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isClassifying && canExtract) e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            <Sparkles size={14} />
            Extrahieren
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Target Mode Selection ---

function TargetSection() {
  const targetMode = useExtractionStore((s) => s.targetMode);
  const setTargetMode = useExtractionStore((s) => s.setTargetMode);
  const selectedSubmodelIds = useExtractionStore((s) => s.selectedSubmodelIds);
  const toggleSubmodelId = useExtractionStore((s) => s.toggleSubmodelId);
  const allProjectSubmodels = useExtractionStore((s) => s.allProjectSubmodels);
  const setAllProjectSubmodels = useExtractionStore((s) => s.setAllProjectSubmodels);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const [loading, setLoading] = useState(false);

  // Fetch submodels from all projects on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, canvas_data');
      if (cancelled || error || !data) {
        setLoading(false);
        return;
      }
      const result: ProjectSubmodels[] = [];
      for (const project of data) {
        const canvas = project.canvas_data as {
          submodels?: Submodel[];
          conceptDescriptions?: ConceptDescription[];
        } | null;
        const sms = canvas?.submodels ?? [];
        if (sms.length > 0) {
          result.push({
            projectId: project.id,
            projectName: project.name,
            submodels: sms,
            conceptDescriptions: canvas?.conceptDescriptions ?? [],
          });
        }
      }
      // Sort: current project first, then alphabetically
      result.sort((a, b) => {
        if (a.projectId === currentProjectId) return -1;
        if (b.projectId === currentProjectId) return 1;
        return a.projectName.localeCompare(b.projectName);
      });
      setAllProjectSubmodels(result);
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [currentProjectId, setAllProjectSubmodels]);

  const totalSubmodels = allProjectSubmodels.reduce((sum, p) => sum + p.submodels.length, 0);
  const hasSubmodels = totalSubmodels > 0;

  const radioStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    backgroundColor: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
    borderRadius: 6,
    border: `1px solid ${active ? 'rgba(59, 130, 246, 0.2)' : 'var(--border)'}`,
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        Wohin extrahieren?
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Option 1: New */}
        <label style={radioStyle(targetMode === 'new')}>
          <input
            type="radio"
            name="target"
            checked={targetMode === 'new'}
            onChange={() => setTargetMode('new')}
            style={{ accentColor: 'var(--accent)' }}
          />
          Neu erstellen (KI gruppiert selbst)
        </label>

        {/* Option 2: Map to existing */}
        <label
          style={{
            ...radioStyle(targetMode === 'mapping'),
            opacity: (hasSubmodels || loading) ? 1 : 0.5,
            cursor: (hasSubmodels || loading) ? 'pointer' : 'not-allowed',
          }}
        >
          <input
            type="radio"
            name="target"
            checked={targetMode === 'mapping'}
            onChange={() => { if (hasSubmodels) setTargetMode('mapping'); }}
            disabled={!hasSubmodels && !loading}
            style={{ accentColor: 'var(--accent)' }}
          />
          Auf bestehende Submodels mappen
          {!loading && !hasSubmodels && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Keine vorhanden
            </span>
          )}
          {loading && (
            <Loader2 size={12} style={{ color: 'var(--text-muted)', marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />
          )}
        </label>
      </div>

      {/* Submodel list when mapping mode is active */}
      {targetMode === 'mapping' && hasSubmodels && (
        <div
          style={{
            marginTop: 8,
            marginLeft: 24,
            maxHeight: 200,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {allProjectSubmodels.map((project) => (
            <div key={project.projectId}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '6px 8px 2px',
                marginTop: 4,
              }}>
                {project.projectName}
                {project.projectId === currentProjectId && (
                  <span style={{ fontWeight: 400, marginLeft: 4 }}>(aktuell)</span>
                )}
              </div>
              {project.submodels.map((sm) => {
                const propCount = countProperties(sm.submodelElements ?? []);
                const checked = selectedSubmodelIds.includes(sm.id);
                return (
                  <label
                    key={sm.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      backgroundColor: checked ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubmodelId(sm.id)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontWeight: 500 }}>{sm.idShort}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      ({propCount} Properties)
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, marginLeft: 4 }}>
        {targetMode === 'new'
          ? 'Es wird automatisch eine neue AAS erstellt.'
          : 'Daten werden in die Struktur der ausgewaehlten Submodels eingefuellt (Kopie).'}
      </p>
    </div>
  );
}
