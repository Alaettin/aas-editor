import * as aas from '@aas-core-works/aas-core3.1-typescript';
import type {
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
  AssetInformation,
  LangString,
  ConceptDescription,
  Qualifier,
  Extension,
  SpecificAssetId,
  AdministrativeInformation,
  EmbeddedDataSpecification,
  DataSpecificationIec61360,
} from '../types/aas';
import { useAasStore } from '../store/aasStore';

// --- Enum mappings (our string enums → aas-core-works numeric enums) ---

const DATA_TYPE_MAP: Record<string, aas.types.DataTypeDefXsd> = {
  'xs:anyURI': aas.types.DataTypeDefXsd.AnyUri,
  'xs:base64Binary': aas.types.DataTypeDefXsd.Base64Binary,
  'xs:boolean': aas.types.DataTypeDefXsd.Boolean,
  'xs:byte': aas.types.DataTypeDefXsd.Byte,
  'xs:date': aas.types.DataTypeDefXsd.Date,
  'xs:dateTime': aas.types.DataTypeDefXsd.DateTime,
  'xs:decimal': aas.types.DataTypeDefXsd.Decimal,
  'xs:double': aas.types.DataTypeDefXsd.Double,
  'xs:duration': aas.types.DataTypeDefXsd.Duration,
  'xs:float': aas.types.DataTypeDefXsd.Float,
  'xs:gDay': aas.types.DataTypeDefXsd.GDay,
  'xs:gMonth': aas.types.DataTypeDefXsd.GMonth,
  'xs:gMonthDay': aas.types.DataTypeDefXsd.GMonthDay,
  'xs:gYear': aas.types.DataTypeDefXsd.GYear,
  'xs:gYearMonth': aas.types.DataTypeDefXsd.GYearMonth,
  'xs:hexBinary': aas.types.DataTypeDefXsd.HexBinary,
  'xs:int': aas.types.DataTypeDefXsd.Int,
  'xs:integer': aas.types.DataTypeDefXsd.Integer,
  'xs:long': aas.types.DataTypeDefXsd.Long,
  'xs:negativeInteger': aas.types.DataTypeDefXsd.NegativeInteger,
  'xs:nonNegativeInteger': aas.types.DataTypeDefXsd.NonNegativeInteger,
  'xs:nonPositiveInteger': aas.types.DataTypeDefXsd.NonPositiveInteger,
  'xs:positiveInteger': aas.types.DataTypeDefXsd.PositiveInteger,
  'xs:short': aas.types.DataTypeDefXsd.Short,
  'xs:string': aas.types.DataTypeDefXsd.String,
  'xs:time': aas.types.DataTypeDefXsd.Time,
  'xs:unsignedByte': aas.types.DataTypeDefXsd.UnsignedByte,
  'xs:unsignedInt': aas.types.DataTypeDefXsd.UnsignedInt,
  'xs:unsignedLong': aas.types.DataTypeDefXsd.UnsignedLong,
  'xs:unsignedShort': aas.types.DataTypeDefXsd.UnsignedShort,
};

const ASSET_KIND_MAP: Record<string, aas.types.AssetKind> = {
  Type: aas.types.AssetKind.Type,
  Instance: aas.types.AssetKind.Instance,
  NotApplicable: aas.types.AssetKind.NotApplicable,
};

const REFERENCE_TYPE_MAP: Record<string, aas.types.ReferenceTypes> = {
  ExternalReference: aas.types.ReferenceTypes.ExternalReference,
  ModelReference: aas.types.ReferenceTypes.ModelReference,
};

const KEY_TYPE_MAP: Record<string, aas.types.KeyTypes> = {
  Submodel: aas.types.KeyTypes.Submodel,
  AssetAdministrationShell: aas.types.KeyTypes.AssetAdministrationShell,
  ConceptDescription: aas.types.KeyTypes.ConceptDescription,
  GlobalReference: aas.types.KeyTypes.GlobalReference,
  FragmentReference: aas.types.KeyTypes.FragmentReference,
  Property: aas.types.KeyTypes.Property,
  SubmodelElementCollection: aas.types.KeyTypes.SubmodelElementCollection,
  SubmodelElementList: aas.types.KeyTypes.SubmodelElementList,
  File: aas.types.KeyTypes.File,
  Blob: aas.types.KeyTypes.Blob,
  Range: aas.types.KeyTypes.Range,
  MultiLanguageProperty: aas.types.KeyTypes.MultiLanguageProperty,
  ReferenceElement: aas.types.KeyTypes.ReferenceElement,
  Entity: aas.types.KeyTypes.Entity,
  Operation: aas.types.KeyTypes.Operation,
  Capability: aas.types.KeyTypes.Capability,
  BasicEventElement: aas.types.KeyTypes.BasicEventElement,
  AnnotatedRelationshipElement: aas.types.KeyTypes.AnnotatedRelationshipElement,
  RelationshipElement: aas.types.KeyTypes.RelationshipElement,
  SubmodelElement: aas.types.KeyTypes.SubmodelElement,
  DataElement: aas.types.KeyTypes.DataElement,
  EventElement: aas.types.KeyTypes.EventElement,
};

const SME_LIST_TYPE_MAP: Record<string, aas.types.AasSubmodelElements> = {
  SubmodelElement: aas.types.AasSubmodelElements.SubmodelElement,
  Property: aas.types.AasSubmodelElements.Property,
  MultiLanguageProperty: aas.types.AasSubmodelElements.MultiLanguageProperty,
  Range: aas.types.AasSubmodelElements.Range,
  Blob: aas.types.AasSubmodelElements.Blob,
  File: aas.types.AasSubmodelElements.File,
  ReferenceElement: aas.types.AasSubmodelElements.ReferenceElement,
  SubmodelElementCollection: aas.types.AasSubmodelElements.SubmodelElementCollection,
  SubmodelElementList: aas.types.AasSubmodelElements.SubmodelElementList,
  Entity: aas.types.AasSubmodelElements.Entity,
  RelationshipElement: aas.types.AasSubmodelElements.RelationshipElement,
  AnnotatedRelationshipElement: aas.types.AasSubmodelElements.AnnotatedRelationshipElement,
  Operation: aas.types.AasSubmodelElements.Operation,
  Capability: aas.types.AasSubmodelElements.Capability,
  BasicEventElement: aas.types.AasSubmodelElements.BasicEventElement,
};

const ENTITY_TYPE_MAP: Record<string, aas.types.EntityType> = {
  SelfManagedEntity: aas.types.EntityType.SelfManagedEntity,
  CoManagedEntity: aas.types.EntityType.CoManagedEntity,
};

const DIRECTION_MAP: Record<string, aas.types.Direction> = {
  input: aas.types.Direction.Input,
  output: aas.types.Direction.Output,
};

const STATE_MAP: Record<string, aas.types.StateOfEvent> = {
  on: aas.types.StateOfEvent.On,
  off: aas.types.StateOfEvent.Off,
};

const QUALIFIER_KIND_MAP: Record<string, aas.types.QualifierKind> = {
  ConceptQualifier: aas.types.QualifierKind.ConceptQualifier,
  ValueQualifier: aas.types.QualifierKind.ValueQualifier,
  TemplateQualifier: aas.types.QualifierKind.TemplateQualifier,
};

const DATA_TYPE_IEC61360_MAP: Record<string, aas.types.DataTypeIec61360> = {
  DATE: aas.types.DataTypeIec61360.Date,
  STRING: aas.types.DataTypeIec61360.String,
  STRING_TRANSLATABLE: aas.types.DataTypeIec61360.StringTranslatable,
  INTEGER_MEASURE: aas.types.DataTypeIec61360.IntegerMeasure,
  INTEGER_COUNT: aas.types.DataTypeIec61360.IntegerCount,
  INTEGER_CURRENCY: aas.types.DataTypeIec61360.IntegerCurrency,
  REAL_MEASURE: aas.types.DataTypeIec61360.RealMeasure,
  REAL_COUNT: aas.types.DataTypeIec61360.RealCount,
  REAL_CURRENCY: aas.types.DataTypeIec61360.RealCurrency,
  BOOLEAN: aas.types.DataTypeIec61360.Boolean,
  IRI: aas.types.DataTypeIec61360.Iri,
  IRDI: aas.types.DataTypeIec61360.Irdi,
  RATIONAL: aas.types.DataTypeIec61360.Rational,
  RATIONAL_MEASURE: aas.types.DataTypeIec61360.RationalMeasure,
  TIME: aas.types.DataTypeIec61360.Time,
  TIMESTAMP: aas.types.DataTypeIec61360.Timestamp,
  FILE: aas.types.DataTypeIec61360.File,
  HTML: aas.types.DataTypeIec61360.Html,
  BLOB: aas.types.DataTypeIec61360.Blob,
};

// --- Conversion functions ---

function convertLangStrings(strs?: LangString[]): aas.types.LangStringTextType[] | undefined {
  if (!strs || strs.length === 0) return undefined;
  return strs.map((s) => new aas.types.LangStringTextType(s.language, s.text));
}

function convertLangStringNames(strs?: LangString[]): aas.types.LangStringNameType[] | undefined {
  if (!strs || strs.length === 0) return undefined;
  return strs.map((s) => new aas.types.LangStringNameType(s.language, s.text));
}

function convertKey(k: { type: string; value: string }): aas.types.Key {
  return new aas.types.Key(KEY_TYPE_MAP[k.type] ?? aas.types.KeyTypes.GlobalReference, k.value);
}

function convertReference(ref: Reference): aas.types.Reference {
  const result = new aas.types.Reference(
    REFERENCE_TYPE_MAP[ref.type] ?? aas.types.ReferenceTypes.ExternalReference,
    ref.keys.map(convertKey),
  );
  if (ref.referredSemanticId) result.referredSemanticId = convertReference(ref.referredSemanticId);
  return result;
}

function convertQualifiers(qualifiers?: Qualifier[]): aas.types.Qualifier[] | undefined {
  if (!qualifiers || qualifiers.length === 0) return undefined;
  return qualifiers.map((q) => {
    const result = new aas.types.Qualifier(
      q.type,
      DATA_TYPE_MAP[q.valueType] ?? aas.types.DataTypeDefXsd.String,
    );
    if (q.kind) result.kind = QUALIFIER_KIND_MAP[q.kind];
    if (q.value) result.value = q.value;
    if (q.valueId) result.valueId = convertReference(q.valueId);
    if (q.semanticId) result.semanticId = convertReference(q.semanticId);
    return result;
  });
}

function convertExtensions(extensions?: Extension[]): aas.types.Extension[] | undefined {
  if (!extensions || extensions.length === 0) return undefined;
  return extensions.map((ext) => {
    const result = new aas.types.Extension(ext.name);
    if (ext.valueType) result.valueType = DATA_TYPE_MAP[ext.valueType];
    if (ext.value) result.value = ext.value;
    if (ext.semanticId) result.semanticId = convertReference(ext.semanticId);
    if (ext.refersTo && ext.refersTo.length > 0) result.refersTo = ext.refersTo.map(convertReference);
    return result;
  });
}

function convertSpecificAssetIds(ids?: SpecificAssetId[]): aas.types.SpecificAssetId[] | undefined {
  if (!ids || ids.length === 0) return undefined;
  return ids.map((id) => {
    const result = new aas.types.SpecificAssetId(id.name, id.value);
    if (id.externalSubjectId) result.externalSubjectId = convertReference(id.externalSubjectId);
    if (id.semanticId) result.semanticId = convertReference(id.semanticId);
    return result;
  });
}

function convertAdministration(admin?: AdministrativeInformation): aas.types.AdministrativeInformation | undefined {
  if (!admin) return undefined;
  const result = new aas.types.AdministrativeInformation();
  if (admin.version) result.version = admin.version;
  if (admin.revision) result.revision = admin.revision;
  if (admin.templateId) result.templateId = admin.templateId;
  if (admin.creator) result.creator = convertReference(admin.creator);
  return result;
}

function convertEmbeddedDataSpecs(specs?: EmbeddedDataSpecification[]): aas.types.EmbeddedDataSpecification[] | undefined {
  if (!specs || specs.length === 0) return undefined;
  return specs.map((spec) => {
    const content = convertDataSpecIec61360(spec.dataSpecificationContent);
    return new aas.types.EmbeddedDataSpecification(convertReference(spec.dataSpecification), content);
  });
}

function convertDataSpecIec61360(ds: DataSpecificationIec61360): aas.types.DataSpecificationIec61360 {
  const prefName = ds.preferredName.map(
    (s) => new aas.types.LangStringPreferredNameTypeIec61360(s.language, s.text),
  );
  const result = new aas.types.DataSpecificationIec61360(prefName);
  if (ds.shortName && ds.shortName.length > 0) {
    result.shortName = ds.shortName.map(
      (s) => new aas.types.LangStringShortNameTypeIec61360(s.language, s.text),
    );
  }
  if (ds.unit) result.unit = ds.unit;
  if (ds.dataType) {
    const mapped = DATA_TYPE_IEC61360_MAP[ds.dataType.toUpperCase()];
    if (mapped !== undefined) result.dataType = mapped;
  }
  if (ds.definition && ds.definition.length > 0) {
    result.definition = ds.definition.map(
      (s) => new aas.types.LangStringDefinitionTypeIec61360(s.language, s.text),
    );
  }
  if (ds.value) result.value = ds.value;
  if (ds.valueFormat) result.valueFormat = ds.valueFormat;
  return result;
}

function convertAssetInformation(ai: AssetInformation): aas.types.AssetInformation {
  const result = new aas.types.AssetInformation(
    ASSET_KIND_MAP[ai.assetKind] ?? aas.types.AssetKind.Instance,
  );
  if (ai.globalAssetId) result.globalAssetId = ai.globalAssetId;
  if (ai.assetType) result.assetType = ai.assetType;
  if (ai.specificAssetIds) result.specificAssetIds = convertSpecificAssetIds(ai.specificAssetIds);
  if (ai.defaultThumbnail) {
    result.defaultThumbnail = new aas.types.Resource(ai.defaultThumbnail.path);
    if (ai.defaultThumbnail.contentType) result.defaultThumbnail.contentType = ai.defaultThumbnail.contentType;
  }
  return result;
}

// Apply common fields shared by all SubmodelElements
function applyCommonFields(target: aas.types.ISubmodelElement, el: SubmodelElement): void {
  target.idShort = el.idShort;
  if (el.semanticId) target.semanticId = convertReference(el.semanticId);
  if (el.description) target.description = convertLangStrings(el.description);
  if (el.displayName) target.displayName = convertLangStringNames(el.displayName);
  if (el.qualifiers) target.qualifiers = convertQualifiers(el.qualifiers);
  if (el.extensions) target.extensions = convertExtensions(el.extensions);
  if (el.embeddedDataSpecifications) target.embeddedDataSpecifications = convertEmbeddedDataSpecs(el.embeddedDataSpecifications);
}

function convertSubmodelElement(el: SubmodelElement): aas.types.ISubmodelElement {
  switch (el.modelType) {
    case 'Property': {
      const p = new aas.types.Property(
        DATA_TYPE_MAP[el.valueType] ?? aas.types.DataTypeDefXsd.String,
      );
      applyCommonFields(p, el);
      if (el.value) p.value = el.value;
      if (el.valueId) p.valueId = convertReference(el.valueId);
      return p;
    }

    case 'MultiLanguageProperty': {
      const mlp = new aas.types.MultiLanguageProperty();
      applyCommonFields(mlp, el);
      if (el.value && el.value.length > 0) {
        mlp.value = el.value.map((s) => new aas.types.LangStringTextType(s.language, s.text));
      }
      if (el.valueId) mlp.valueId = convertReference(el.valueId);
      return mlp;
    }

    case 'Range': {
      const r = new aas.types.Range(
        DATA_TYPE_MAP[el.valueType] ?? aas.types.DataTypeDefXsd.Double,
      );
      applyCommonFields(r, el);
      if (el.min) r.min = el.min;
      if (el.max) r.max = el.max;
      return r;
    }

    case 'File': {
      const f = new aas.types.File();
      applyCommonFields(f, el);
      f.contentType = el.contentType;
      if (el.value) f.value = el.value;
      return f;
    }

    case 'Blob': {
      const b = new aas.types.Blob();
      applyCommonFields(b, el);
      b.contentType = el.contentType;
      if (el.value) b.value = el.value;
      return b;
    }

    case 'ReferenceElement': {
      const re = new aas.types.ReferenceElement();
      applyCommonFields(re, el);
      if (el.value) re.value = convertReference(el.value);
      return re;
    }

    case 'SubmodelElementCollection': {
      const smc = new aas.types.SubmodelElementCollection();
      applyCommonFields(smc, el);
      if (el.value && el.value.length > 0) {
        smc.value = el.value.map(convertSubmodelElement);
      }
      return smc;
    }

    case 'SubmodelElementList': {
      const sml = new aas.types.SubmodelElementList(
        SME_LIST_TYPE_MAP[el.typeValueListElement] ?? aas.types.AasSubmodelElements.SubmodelElement,
      );
      applyCommonFields(sml, el);
      if (el.value && el.value.length > 0) {
        sml.value = el.value.map(convertSubmodelElement);
      }
      if (el.valueTypeListElement) sml.valueTypeListElement = DATA_TYPE_MAP[el.valueTypeListElement];
      if (el.semanticIdListElement) sml.semanticIdListElement = convertReference(el.semanticIdListElement);
      if (el.orderRelevant !== undefined) sml.orderRelevant = el.orderRelevant;
      return sml;
    }

    case 'Entity': {
      const ent = new aas.types.Entity();
      applyCommonFields(ent, el);
      ent.entityType = ENTITY_TYPE_MAP[el.entityType] ?? aas.types.EntityType.SelfManagedEntity;
      if (el.globalAssetId) ent.globalAssetId = el.globalAssetId;
      if (el.specificAssetIds) ent.specificAssetIds = convertSpecificAssetIds(el.specificAssetIds);
      if (el.statements && el.statements.length > 0) {
        ent.statements = el.statements.map(convertSubmodelElement);
      }
      return ent;
    }

    case 'RelationshipElement': {
      const rel = new aas.types.RelationshipElement();
      applyCommonFields(rel, el);
      if (el.first) rel.first = convertReference(el.first);
      if (el.second) rel.second = convertReference(el.second);
      return rel;
    }

    case 'AnnotatedRelationshipElement': {
      const arel = new aas.types.AnnotatedRelationshipElement();
      applyCommonFields(arel, el);
      if (el.first) arel.first = convertReference(el.first);
      if (el.second) arel.second = convertReference(el.second);
      if (el.annotations && el.annotations.length > 0) {
        arel.annotations = el.annotations.map(convertSubmodelElement) as aas.types.IDataElement[];
      }
      return arel;
    }

    case 'BasicEventElement': {
      const bee = new aas.types.BasicEventElement(
        el.observed ? convertReference(el.observed) : new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, []),
        DIRECTION_MAP[el.direction] ?? aas.types.Direction.Output,
        STATE_MAP[el.state] ?? aas.types.StateOfEvent.On,
      );
      applyCommonFields(bee, el);
      if (el.messageTopic) bee.messageTopic = el.messageTopic;
      if (el.messageBroker) bee.messageBroker = convertReference(el.messageBroker);
      if (el.lastUpdate) bee.lastUpdate = el.lastUpdate;
      if (el.minInterval) bee.minInterval = el.minInterval;
      if (el.maxInterval) bee.maxInterval = el.maxInterval;
      return bee;
    }

    case 'Operation': {
      const op = new aas.types.Operation();
      applyCommonFields(op, el);
      if (el.inputVariables && el.inputVariables.length > 0) {
        op.inputVariables = el.inputVariables.map((v) => new aas.types.OperationVariable(convertSubmodelElement(v.value)));
      }
      if (el.outputVariables && el.outputVariables.length > 0) {
        op.outputVariables = el.outputVariables.map((v) => new aas.types.OperationVariable(convertSubmodelElement(v.value)));
      }
      if (el.inoutputVariables && el.inoutputVariables.length > 0) {
        op.inoutputVariables = el.inoutputVariables.map((v) => new aas.types.OperationVariable(convertSubmodelElement(v.value)));
      }
      return op;
    }

    case 'Capability': {
      const cap = new aas.types.Capability();
      applyCommonFields(cap, el);
      return cap;
    }

    default: {
      const fallback = new aas.types.Property(aas.types.DataTypeDefXsd.String);
      fallback.idShort = el.idShort;
      return fallback;
    }
  }
}

function convertSubmodel(sm: Submodel): aas.types.Submodel {
  const result = new aas.types.Submodel(sm.id);
  if (sm.idShort) result.idShort = sm.idShort;
  if (sm.semanticId) result.semanticId = convertReference(sm.semanticId);
  if (sm.submodelElements && sm.submodelElements.length > 0) {
    result.submodelElements = sm.submodelElements.map(convertSubmodelElement);
  }
  if (sm.description) result.description = convertLangStrings(sm.description);
  if (sm.displayName) result.displayName = convertLangStringNames(sm.displayName);
  if (sm.administration) result.administration = convertAdministration(sm.administration);
  if (sm.qualifiers) result.qualifiers = convertQualifiers(sm.qualifiers);
  if (sm.extensions) result.extensions = convertExtensions(sm.extensions);
  if (sm.embeddedDataSpecifications) result.embeddedDataSpecifications = convertEmbeddedDataSpecs(sm.embeddedDataSpecifications);
  if (sm.kind !== undefined) {
    result.kind = sm.kind === 'Template' ? aas.types.ModellingKind.Template : aas.types.ModellingKind.Instance;
  }
  return result;
}

function convertShell(shell: AssetAdministrationShell): aas.types.AssetAdministrationShell {
  const ai = convertAssetInformation(shell.assetInformation);
  const result = new aas.types.AssetAdministrationShell(shell.id, ai);
  if (shell.idShort) result.idShort = shell.idShort;
  if (shell.submodels && shell.submodels.length > 0) {
    result.submodels = shell.submodels.map(convertReference);
  }
  if (shell.description) result.description = convertLangStrings(shell.description);
  if (shell.displayName) result.displayName = convertLangStringNames(shell.displayName);
  if (shell.administration) result.administration = convertAdministration(shell.administration);
  if (shell.derivedFrom) result.derivedFrom = convertReference(shell.derivedFrom);
  if (shell.extensions) result.extensions = convertExtensions(shell.extensions);
  if (shell.embeddedDataSpecifications) result.embeddedDataSpecifications = convertEmbeddedDataSpecs(shell.embeddedDataSpecifications);
  return result;
}

function convertConceptDescription(cd: ConceptDescription): aas.types.ConceptDescription {
  const result = new aas.types.ConceptDescription(cd.id);
  if (cd.idShort) result.idShort = cd.idShort;
  if (cd.isCaseOf) result.isCaseOf = cd.isCaseOf.map(convertReference);
  if (cd.description) result.description = convertLangStrings(cd.description);
  if (cd.displayName) result.displayName = convertLangStringNames(cd.displayName);
  if (cd.administration) result.administration = convertAdministration(cd.administration);
  if (cd.extensions) result.extensions = convertExtensions(cd.extensions);
  if (cd.embeddedDataSpecifications) result.embeddedDataSpecifications = convertEmbeddedDataSpecs(cd.embeddedDataSpecifications);
  return result;
}

// --- Export & Download ---

export function exportToJson(): { json: string; errors: string[] } {
  const state = useAasStore.getState();

  const shells = state.shells.map(convertShell);
  const submodels = state.submodels.map(convertSubmodel);
  const concepts = state.conceptDescriptions.map(convertConceptDescription);
  const env = new aas.types.Environment(shells, submodels, concepts);

  const errors: string[] = [];
  try {
    for (const err of aas.verification.verify(env)) {
      errors.push(`${err.path}: ${err.message}`);
    }
  } catch (e) {
    errors.push(`Validierung fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
  }

  const jsonable = aas.jsonization.toJsonable(env);
  const json = JSON.stringify(jsonable, null, 2);

  return { json, errors };
}

export function exportShellToJson(shellId: string): { json: string; errors: string[]; filename: string } {
  const state = useAasStore.getState();
  const shell = state.shells.find((s) => s.id === shellId);
  if (!shell) return { json: '{}', errors: ['Shell nicht gefunden'], filename: 'export.json' };

  const smIds = (shell.submodels ?? []).map((ref) => ref.keys[0]?.value).filter(Boolean);
  const relatedSubmodels = smIds
    .map((id) => state.submodels.find((s) => s.id === id))
    .filter(Boolean) as typeof state.submodels;

  const convertedShells = [convertShell(shell)];
  const convertedSubmodels = relatedSubmodels.map(convertSubmodel);
  const concepts = state.conceptDescriptions.map(convertConceptDescription);
  const env = new aas.types.Environment(convertedShells, convertedSubmodels, concepts);

  const errors: string[] = [];
  try {
    for (const err of aas.verification.verify(env)) {
      errors.push(`${err.path}: ${err.message}`);
    }
  } catch (e) {
    errors.push(`Validierung fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
  }

  const jsonable = aas.jsonization.toJsonable(env);
  const json = JSON.stringify(jsonable, null, 2);
  const filename = `${shell.idShort || 'aas'}.json`;

  return { json, errors, filename };
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
