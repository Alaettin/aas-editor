import { X } from 'lucide-react';
import { useAasStore } from '../../store/aasStore';
import type {
  AASNodeData,
  SubmodelNodeData,
  SubmodelElementNodeData,
  ConceptDescriptionNodeData,
  AasNodeData,
} from '../../store/aasStore';
import type {
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  ConceptDescription,
  Property,
  Range,
  MultiLanguageProperty,
  AasFile,
  Blob,
  ReferenceElement,
  SubmodelElementList,
  Entity,
  RelationshipElement,
  AnnotatedRelationshipElement,
  BasicEventElement,
  Operation,
  LangString,
  Reference,
  Qualifier,
  Extension,
  EmbeddedDataSpecification,
  AdministrativeInformation,
  ModellingKind,
  AssetInformation,
} from '../../types/aas';

import { GeneralSection } from './sections/GeneralSection';
import { DescriptionSection } from './sections/DescriptionSection';
import { SemanticIdSection } from './sections/SemanticIdSection';
import { AdminSection } from './sections/AdminSection';
import { QualifierSection } from './sections/QualifierSection';
import { AssetInfoSection } from './sections/AssetInfoSection';
import { SubmodelKindSection } from './sections/SubmodelKindSection';
import { PropertySection } from './sections/PropertySection';
import { RangeSection } from './sections/RangeSection';
import { MlpSection } from './sections/MlpSection';
import { FileSection } from './sections/FileSection';
import { ReferenceSection } from './sections/ReferenceSection';
import { ListSection } from './sections/ListSection';
import { DisplayNameSection } from './sections/DisplayNameSection';
import { DerivedFromSection } from './sections/DerivedFromSection';
import { EntitySection } from './sections/EntitySection';
import { RelationshipSection } from './sections/RelationshipSection';
import { EventSection } from './sections/EventSection';
import { OperationSection } from './sections/OperationSection';
import { ExtensionSection } from './sections/ExtensionSection';
import { Section } from './sections/Section';
import { EmbeddedDataSpecEditor } from './editors/EmbeddedDataSpecEditor';

interface DetailPanelProps {
  selectedNodeId: string | null;
  onClose: () => void;
}

export function DetailPanel({ selectedNodeId, onClose }: DetailPanelProps) {
  const node = useAasStore((s) => s.nodes.find((n) => n.id === selectedNodeId));
  const updateShell = useAasStore((s) => s.updateShell);
  const updateShellIdShort = useAasStore((s) => s.updateShellIdShort);
  const updateShellId = useAasStore((s) => s.updateShellId);
  const updateSubmodel = useAasStore((s) => s.updateSubmodel);
  const updateSubmodelIdShort = useAasStore((s) => s.updateSubmodelIdShort);
  const updateSubmodelId = useAasStore((s) => s.updateSubmodelId);
  const updateSubmodelElement = useAasStore((s) => s.updateSubmodelElement);
  const updateConceptDescriptionField = useAasStore((s) => s.updateConceptDescriptionField);

  if (!node || !selectedNodeId) return null;

  const data = node.data as AasNodeData;

  const nodeType = data.type;
  const color =
    nodeType === 'aas'
      ? 'var(--node-aas)'
      : nodeType === 'submodel'
        ? 'var(--node-submodel)'
        : nodeType === 'conceptDescription'
          ? 'var(--node-cd)'
          : 'var(--node-property)';
  const label =
    nodeType === 'aas'
      ? 'AAS'
      : nodeType === 'submodel'
        ? 'Submodel'
        : nodeType === 'conceptDescription'
          ? 'CD'
          : (data as SubmodelElementNodeData).element.modelType;

  return (
    <div
      style={{
        width: 340,
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color,
              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
              padding: '2px 7px',
              borderRadius: 4,
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nodeType === 'aas'
              ? (data as AASNodeData).shell.idShort
              : nodeType === 'submodel'
                ? (data as SubmodelNodeData).submodel.idShort
                : nodeType === 'conceptDescription'
                  ? (data as ConceptDescriptionNodeData).conceptDescription.idShort
                  : (data as SubmodelElementNodeData).element.idShort}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {nodeType === 'aas' && (
          <AASDetail
            shell={(data as AASNodeData).shell}
            onUpdateShell={(changes) => updateShell(selectedNodeId, changes)}
            onIdShortChange={(v) => updateShellIdShort(selectedNodeId, v)}
            onIdChange={(oldId, newId) => updateShellId(oldId, newId)}
          />
        )}
        {nodeType === 'submodel' && (
          <SubmodelDetail
            submodel={(data as SubmodelNodeData).submodel}
            onUpdateSubmodel={(changes) => updateSubmodel(selectedNodeId, changes)}
            onIdShortChange={(v) => updateSubmodelIdShort(selectedNodeId, v)}
            onIdChange={(oldId, newId) => updateSubmodelId(oldId, newId)}
          />
        )}
        {nodeType === 'conceptDescription' && (
          <CDDetail
            cd={(data as ConceptDescriptionNodeData).conceptDescription}
            onUpdate={(field, value) => updateConceptDescriptionField(selectedNodeId, field, value)}
          />
        )}
        {nodeType === 'element' && (
          <ElementDetail
            element={(data as SubmodelElementNodeData).element}
            submodelId={(data as SubmodelElementNodeData).submodelId}
            onUpdate={(changes) =>
              updateSubmodelElement(
                (data as SubmodelElementNodeData).submodelId,
                (data as SubmodelElementNodeData).element._nodeId!,
                changes,
              )
            }
          />
        )}
      </div>
    </div>
  );
}

// --- AAS Detail ---
function AASDetail({
  shell,
  onUpdateShell,
  onIdShortChange,
  onIdChange,
}: {
  shell: AssetAdministrationShell;
  onUpdateShell: (changes: Partial<AssetAdministrationShell>) => void;
  onIdShortChange: (v: string) => void;
  onIdChange: (oldId: string, newId: string) => void;
}) {
  return (
    <>
      <GeneralSection
        idShort={shell.idShort || ''}
        id={shell.id}
        onIdShortChange={onIdShortChange}
        onIdChange={(v) => onIdChange(shell.id, v)}
      />
      <AssetInfoSection
        assetInformation={shell.assetInformation}
        onChange={(ai: AssetInformation) => onUpdateShell({ assetInformation: ai })}
      />
      <DisplayNameSection
        displayName={shell.displayName ?? []}
        onChange={(d: LangString[]) => onUpdateShell({ displayName: d.length > 0 ? d : undefined })}
      />
      <DescriptionSection
        description={shell.description ?? []}
        onChange={(d: LangString[]) => onUpdateShell({ description: d.length > 0 ? d : undefined })}
      />
      <DerivedFromSection
        derivedFrom={shell.derivedFrom}
        onChange={(ref: Reference | undefined) => onUpdateShell({ derivedFrom: ref })}
      />
      <AdminSection
        administration={shell.administration}
        onChange={(a: AdministrativeInformation | undefined) => onUpdateShell({ administration: a })}
      />
      <ExtensionSection
        extensions={shell.extensions ?? []}
        onChange={(e: Extension[]) => onUpdateShell({ extensions: e.length > 0 ? e : undefined })}
      />
      <Section title="Data Specifications" defaultOpen={(shell.embeddedDataSpecifications ?? []).length > 0}>
        <EmbeddedDataSpecEditor
          value={shell.embeddedDataSpecifications ?? []}
          onChange={(v: EmbeddedDataSpecification[]) => onUpdateShell({ embeddedDataSpecifications: v.length > 0 ? v : undefined })}
        />
      </Section>
    </>
  );
}

// --- Submodel Detail ---
function SubmodelDetail({
  submodel,
  onUpdateSubmodel,
  onIdShortChange,
  onIdChange,
}: {
  submodel: Submodel;
  onUpdateSubmodel: (changes: Partial<Submodel>) => void;
  onIdShortChange: (v: string) => void;
  onIdChange: (oldId: string, newId: string) => void;
}) {
  return (
    <>
      <GeneralSection
        idShort={submodel.idShort || ''}
        id={submodel.id}
        onIdShortChange={onIdShortChange}
        onIdChange={(v) => onIdChange(submodel.id, v)}
      />
      <SubmodelKindSection
        kind={submodel.kind}
        onChange={(k: ModellingKind | undefined) => onUpdateSubmodel({ kind: k })}
      />
      <SemanticIdSection
        semanticId={submodel.semanticId}
        onChange={(ref: Reference | undefined) => onUpdateSubmodel({ semanticId: ref })}
      />
      <DisplayNameSection
        displayName={submodel.displayName ?? []}
        onChange={(d: LangString[]) => onUpdateSubmodel({ displayName: d.length > 0 ? d : undefined })}
      />
      <DescriptionSection
        description={submodel.description ?? []}
        onChange={(d: LangString[]) => onUpdateSubmodel({ description: d.length > 0 ? d : undefined })}
      />
      <AdminSection
        administration={submodel.administration}
        onChange={(a: AdministrativeInformation | undefined) => onUpdateSubmodel({ administration: a })}
      />
      <QualifierSection
        qualifiers={submodel.qualifiers ?? []}
        onChange={(q: Qualifier[]) => onUpdateSubmodel({ qualifiers: q.length > 0 ? q : undefined })}
      />
      <ExtensionSection
        extensions={submodel.extensions ?? []}
        onChange={(e: Extension[]) => onUpdateSubmodel({ extensions: e.length > 0 ? e : undefined })}
      />
      <LinkedDataSpecSection
        semanticId={submodel.semanticId}
        ownSpecs={submodel.embeddedDataSpecifications ?? []}
        onOwnChange={(v: EmbeddedDataSpecification[]) => onUpdateSubmodel({ embeddedDataSpecifications: v.length > 0 ? v : undefined })}
      />
    </>
  );
}

// --- ConceptDescription Detail ---
function CDDetail({
  cd,
  onUpdate,
}: {
  cd: ConceptDescription;
  onUpdate: (field: string, value: unknown) => void;
}) {
  return (
    <>
      <GeneralSection
        idShort={cd.idShort || ''}
        id={cd.id}
        onIdShortChange={(v) => onUpdate('idShort', v)}
        onIdChange={(v) => onUpdate('id', v)}
      />
      <DisplayNameSection
        displayName={cd.displayName ?? []}
        onChange={(d: LangString[]) => onUpdate('displayName', d.length > 0 ? d : undefined)}
      />
      <DescriptionSection
        description={cd.description ?? []}
        onChange={(d: LangString[]) => onUpdate('description', d.length > 0 ? d : undefined)}
      />
      <AdminSection
        administration={cd.administration}
        onChange={(a: AdministrativeInformation | undefined) => onUpdate('administration', a)}
      />
      <ExtensionSection
        extensions={cd.extensions ?? []}
        onChange={(e: Extension[]) => onUpdate('extensions', e.length > 0 ? e : undefined)}
      />
      <Section title="Data Specifications" defaultOpen={(cd.embeddedDataSpecifications ?? []).length > 0}>
        <EmbeddedDataSpecEditor
          value={cd.embeddedDataSpecifications ?? []}
          onChange={(v: EmbeddedDataSpecification[]) => onUpdate('embeddedDataSpecifications', v.length > 0 ? v : undefined)}
        />
      </Section>
    </>
  );
}

// --- Linked Data Specifications (shows CD's specs read-only if connected, otherwise own editable) ---
function LinkedDataSpecSection({
  semanticId,
  ownSpecs,
  onOwnChange,
}: {
  semanticId: Reference | undefined;
  ownSpecs: EmbeddedDataSpecification[];
  onOwnChange: (v: EmbeddedDataSpecification[]) => void;
}) {
  const conceptDescriptions = useAasStore((s) => s.conceptDescriptions);
  const semIdValue = semanticId?.keys?.[0]?.value;
  const linkedCd = semIdValue ? conceptDescriptions.find((cd) => cd.id === semIdValue) : undefined;
  const cdSpecs = linkedCd?.embeddedDataSpecifications ?? [];

  if (linkedCd && cdSpecs.length > 0) {
    return (
      <Section title={`Data Specifications (CD: ${linkedCd.idShort || 'CD'})`} defaultOpen>
        <EmbeddedDataSpecEditor value={cdSpecs} readonly />
      </Section>
    );
  }

  if (linkedCd) {
    return (
      <Section title={`Data Specifications (CD: ${linkedCd.idShort || 'CD'})`} defaultOpen={false}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', display: 'block' }}>
          Keine Data Specifications in der verbundenen CD definiert.
        </span>
      </Section>
    );
  }

  // No CD linked — show own editable specs
  return (
    <Section title="Data Specifications" defaultOpen={ownSpecs.length > 0}>
      <EmbeddedDataSpecEditor value={ownSpecs} onChange={onOwnChange} />
    </Section>
  );
}

// --- Element Detail ---
function ElementDetail({
  element,
  submodelId,
  onUpdate,
}: {
  element: SubmodelElement;
  submodelId: string;
  onUpdate: (changes: Partial<SubmodelElement>) => void;
}) {
  return (
    <>
      <GeneralSection
        idShort={element.idShort}
        onIdShortChange={(v) => onUpdate({ idShort: v })}
      />

      {/* Type-specific sections */}
      {element.modelType === 'Property' && (
        <PropertySection
          valueType={(element as Property).valueType}
          value={(element as Property).value || ''}
          valueId={(element as Property).valueId}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'Range' && (
        <RangeSection
          valueType={(element as Range).valueType}
          min={(element as Range).min || ''}
          max={(element as Range).max || ''}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'MultiLanguageProperty' && (
        <MlpSection
          value={(element as MultiLanguageProperty).value ?? []}
          valueId={(element as MultiLanguageProperty).valueId}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {(element.modelType === 'File' || element.modelType === 'Blob') && (
        <FileSection
          modelType={element.modelType as 'File' | 'Blob'}
          contentType={(element as AasFile | Blob).contentType}
          value={(element as AasFile).value || ''}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'ReferenceElement' && (
        <ReferenceSection
          value={(element as ReferenceElement).value}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'SubmodelElementList' && (
        <ListSection
          typeValueListElement={(element as SubmodelElementList).typeValueListElement}
          valueTypeListElement={(element as SubmodelElementList).valueTypeListElement}
          semanticIdListElement={(element as SubmodelElementList).semanticIdListElement}
          orderRelevant={(element as SubmodelElementList).orderRelevant}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'Entity' && (
        <EntitySection
          entityType={(element as Entity).entityType}
          globalAssetId={(element as Entity).globalAssetId}
          specificAssetIds={(element as Entity).specificAssetIds ?? []}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {(element.modelType === 'RelationshipElement' || element.modelType === 'AnnotatedRelationshipElement') && (
        <RelationshipSection
          modelType={element.modelType}
          first={(element as RelationshipElement | AnnotatedRelationshipElement).first}
          second={(element as RelationshipElement | AnnotatedRelationshipElement).second}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'BasicEventElement' && (
        <EventSection
          observed={(element as BasicEventElement).observed}
          direction={(element as BasicEventElement).direction}
          state={(element as BasicEventElement).state}
          messageTopic={(element as BasicEventElement).messageTopic}
          messageBroker={(element as BasicEventElement).messageBroker}
          lastUpdate={(element as BasicEventElement).lastUpdate}
          minInterval={(element as BasicEventElement).minInterval}
          maxInterval={(element as BasicEventElement).maxInterval}
          onChange={(c) => onUpdate(c as Partial<SubmodelElement>)}
        />
      )}
      {element.modelType === 'Operation' && (
        <OperationSection
          inputCount={(element as Operation).inputVariables?.length ?? 0}
          outputCount={(element as Operation).outputVariables?.length ?? 0}
          inoutputCount={(element as Operation).inoutputVariables?.length ?? 0}
        />
      )}

      {/* Common metadata sections */}
      <SemanticIdSection
        semanticId={element.semanticId}
        onChange={(ref) => onUpdate({ semanticId: ref } as Partial<SubmodelElement>)}
      />
      <DisplayNameSection
        displayName={element.displayName ?? []}
        onChange={(d) => onUpdate({ displayName: d.length > 0 ? d : undefined } as Partial<SubmodelElement>)}
      />
      <DescriptionSection
        description={element.description ?? []}
        onChange={(d) => onUpdate({ description: d.length > 0 ? d : undefined } as Partial<SubmodelElement>)}
      />
      <QualifierSection
        qualifiers={element.qualifiers ?? []}
        onChange={(q) => onUpdate({ qualifiers: q.length > 0 ? q : undefined } as Partial<SubmodelElement>)}
      />
      <ExtensionSection
        extensions={element.extensions ?? []}
        onChange={(e) => onUpdate({ extensions: e.length > 0 ? e : undefined } as Partial<SubmodelElement>)}
      />
      <LinkedDataSpecSection
        semanticId={element.semanticId}
        ownSpecs={element.embeddedDataSpecifications ?? []}
        onOwnChange={(v) => onUpdate({ embeddedDataSpecifications: v.length > 0 ? v : undefined } as Partial<SubmodelElement>)}
      />
    </>
  );
}
