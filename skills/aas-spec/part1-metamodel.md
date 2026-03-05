# AAS Part 1 — Metamodel (IDTA-01001, V3.1)

Vollständige Referenz des AAS-Informationsmodells. Definiert alle Klassen, Attribute, Enumerationen und Constraints.

---

## 1. Enumerationen

### AssetKind
```
Type | Instance | NotApplicable
```

### ModellingKind
```
Template | Instance
```
- `Instance` ist der Default wenn nicht angegeben

### ReferenceTypes
```
ExternalReference | ModelReference
```

### EntityType
```
SelfManagedEntity   ← hat eigene AAS
CoManagedEntity     ← eingebettet, keine eigene AAS
```

### Direction (BasicEventElement)
```
input | output
```

### StateOfEvent (BasicEventElement)
```
on | off
```

### QualifierKind
```
ConceptQualifier    ← qualifiziert die semantische Definition, statisch
ValueQualifier      ← qualifiziert den Wert, kann sich ändern (nur kind=Instance)
TemplateQualifier   ← qualifiziert Template-Elemente (nur kind=Template)
```

### AasSubmodelElements
Alle konkreten SubmodelElement-Typen:
```
AnnotatedRelationshipElement | BasicEventElement | Blob | Capability |
DataElement | Entity | EventElement | File | MultiLanguageProperty |
Operation | Property | Range | ReferenceElement | RelationshipElement |
SubmodelElement | SubmodelElementCollection | SubmodelElementList
```

### KeyTypes
```
# Identifiable (erster Key in ModelReference)
AssetAdministrationShell | Submodel | ConceptDescription

# Global (erster Key in ExternalReference)
GlobalReference | FragmentReference

# SubmodelElement-Typen (folgende Keys in ModelReference)
AnnotatedRelationshipElement | BasicEventElement | Blob | Capability |
DataElement | Entity | EventElement | File | MultiLanguageProperty |
Operation | Property | Range | ReferenceElement | RelationshipElement |
SubmodelElement | SubmodelElementCollection | SubmodelElementList

# Abstrakt (nur für Typ-Deklaration, nicht als Key-Wert)
Identifiable | Referable
```

### DataTypeDefXsd (30 Werte)
```
xs:anyURI          xs:base64Binary     xs:boolean
xs:byte            xs:date             xs:dateTime
xs:decimal         xs:double           xs:duration
xs:float           xs:gDay             xs:gMonth
xs:gMonthDay       xs:gYear            xs:gYearMonth
xs:hexBinary       xs:int              xs:integer
xs:long            xs:negativeInteger  xs:nonNegativeInteger
xs:nonPositiveInteger  xs:positiveInteger  xs:short
xs:string          xs:time             xs:unsignedByte
xs:unsignedInt     xs:unsignedLong     xs:unsignedShort
```

---

## 2. Constrained Primitive Types

| Typ | Basis | Constraint |
|-----|-------|------------|
| **IdShortType** | string | Regex: `^[a-zA-Z][a-zA-Z0-9_-]*$` (min 1, beginnt mit Buchstabe) |
| **Identifier** | string | Global eindeutig (URI oder IRDI) |
| **LabelType** | string | Kurzes Label |
| **NameType** | string | Name |
| **ContentType** | string | MIME-Typ nach RFC 2046 |
| **PathType** | string | Dateipfad (URI-Format) |
| **QualifierType** | string | Qualifier-Typ-Bezeichner |
| **VersionType** | string | Versionsnummer |
| **RevisionType** | string | Revisionsnummer |
| **BlobType** | base64Binary | Binärinhalt |
| **DateTimeUtc** | dateTime | UTC-Zeitstempel |
| **Duration** | duration | XSD Duration |
| **Bcp47LanguageTag** | string | Sprach-Tag (z.B. "de", "en-US") |
| **ValueDataType** | string | Typisierter Wert als String serialisiert |

### LangString-Typen

| Typ | Max. Länge | Verwendung |
|-----|-----------|------------|
| LangStringNameType | 128 | displayName |
| LangStringTextType | 1023 | description |
| LangStringPreferredNameTypeIec61360 | 255 | IEC 61360 preferred name |
| LangStringShortNameTypeIec61360 | 18 | IEC 61360 short name |
| LangStringDefinitionTypeIec61360 | 1023 | IEC 61360 definition |

Alle LangStrings haben: `language: Bcp47LanguageTag` + `text: string`

---

## 3. Abstrakte Klassen (Mixin-Hierarchie)

```
HasExtensions
  extension: Extension[0..*]
  │
  └── Referable
        category: NameType[0..1]           (DEPRECATED)
        idShort: IdShortType[0..1]
        displayName: LangStringNameType[0..*]
        description: LangStringTextType[0..*]
        │
        └── Identifiable
              id: Identifier[1]
              administration: AdministrativeInformation[0..1]

HasSemantics
  semanticId: Reference[0..1]
  supplementalSemanticId: Reference[0..*]

HasKind
  kind: ModellingKind[0..1]                (Default: Instance)

HasDataSpecification
  embeddedDataSpecifications: EmbeddedDataSpecification[0..*]

Qualifiable
  qualifiers: Qualifier[0..*]
```

---

## 4. Core-Klassen

### Environment
Top-Level-Container für Datei-Austausch.

| Attribut | Typ | Kard. |
|----------|-----|-------|
| assetAdministrationShells | AssetAdministrationShell | 0..* |
| submodels | Submodel | 0..* |
| conceptDescriptions | ConceptDescription | 0..* |

### AssetAdministrationShell
Erbt: Identifiable, HasDataSpecification

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| id | Identifier | **1** | Global eindeutige ID |
| idShort | IdShortType | 0..1 | Kurzbezeichner |
| assetInformation | AssetInformation | **1** | Asset-Metadaten |
| submodels | Reference[] | 0..* | ModelReferences auf Submodels |
| derivedFrom | Reference | 0..1 | ModelReference auf abgeleitete AAS |
| administration | AdministrativeInformation | 0..1 | Version, Revision |
| embeddedDataSpecifications | EmbeddedDataSpecification[] | 0..* | |

### AssetInformation

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| assetKind | AssetKind | **1** | Type oder Instance |
| globalAssetId | Identifier | 0..1 | Globale Asset-ID |
| specificAssetIds | SpecificAssetId[] | 0..* | Herstellerspezifische IDs |
| assetType | Identifier | 0..1 | Asset-Typ-Bezeichner |
| defaultThumbnail | Resource | 0..1 | Vorschaubild |

### SpecificAssetId
Erbt: HasSemantics

| Attribut | Typ | Kard. |
|----------|-----|-------|
| name | LabelType | **1** |
| value | Identifier | **1** |
| externalSubjectId | Reference | 0..1 |

### Resource

| Attribut | Typ | Kard. |
|----------|-----|-------|
| path | PathType | **1** |
| contentType | ContentType | 0..1 |

### Submodel
Erbt: Identifiable, HasKind, HasSemantics, Qualifiable, HasDataSpecification

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| id | Identifier | **1** | Global eindeutige ID |
| idShort | IdShortType | 0..1 | Kurzbezeichner |
| kind | ModellingKind | 0..1 | Instance (default) oder Template |
| semanticId | Reference | 0..1 | z.B. IDTA-Template IRDI |
| submodelElements | SubmodelElement[] | 0..* | Die eigentlichen Daten |
| qualifiers | Qualifier[] | 0..* | |
| administration | AdministrativeInformation | 0..1 | |
| embeddedDataSpecifications | EmbeddedDataSpecification[] | 0..* | |

### ConceptDescription
Erbt: Identifiable, HasDataSpecification

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| id | Identifier | **1** | z.B. eCl@ss IRDI |
| idShort | IdShortType | 0..1 | |
| isCaseOf | Reference[] | 0..* | Verweise auf externe Definitionen |
| administration | AdministrativeInformation | 0..1 | |
| embeddedDataSpecifications | EmbeddedDataSpecification[] | 0..* | Typischerweise DataSpecificationIec61360 |

### AdministrativeInformation
Erbt: HasDataSpecification

| Attribut | Typ | Kard. |
|----------|-----|-------|
| version | VersionType | 0..1 |
| revision | RevisionType | 0..1 |
| creator | Reference | 0..1 |
| templateId | Identifier | 0..1 |

---

## 5. SubmodelElement-Typen

### Vererbungshierarchie
```
SubmodelElement (abstract) — Erbt: Referable, HasSemantics, Qualifiable, HasDataSpecification
├── DataElement (abstract)
│   ├── Property
│   ├── MultiLanguageProperty
│   ├── Range
│   ├── Blob
│   ├── File
│   └── ReferenceElement
├── SubmodelElementCollection
├── SubmodelElementList
├── Entity
├── RelationshipElement
│   └── AnnotatedRelationshipElement
├── Operation
├── Capability
└── EventElement (abstract)
    └── BasicEventElement
```

### Property
Erbt: DataElement

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| valueType | DataTypeDefXsd | **1** | z.B. xs:double, xs:string |
| value | ValueDataType | 0..1 | Wert als String serialisiert |
| valueId | Reference | 0..1 | Verweis auf vordefinierten Wert |

### MultiLanguageProperty
Erbt: DataElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| value | LangStringTextType[] | 0..* |
| valueId | Reference | 0..1 |

### Range
Erbt: DataElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| valueType | DataTypeDefXsd | **1** |
| min | ValueDataType | 0..1 |
| max | ValueDataType | 0..1 |

### Blob
Erbt: DataElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| value | BlobType | 0..1 |
| contentType | ContentType | **1** |

### File
Erbt: DataElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| value | PathType | 0..1 |
| contentType | ContentType | **1** |

### ReferenceElement
Erbt: DataElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| value | Reference | 0..1 |

### SubmodelElementCollection
Erbt: SubmodelElement

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| value | SubmodelElement[] | 0..* | Kinder-Elemente (idShort-basiert, wie Struct) |

Elemente in einer Collection haben eindeutige idShorts.

### SubmodelElementList
Erbt: SubmodelElement

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| orderRelevant | boolean | 0..1 | Default: true |
| value | SubmodelElement[] | 0..* | Kinder-Elemente (index-basiert, wie Array) |
| semanticIdListElement | Reference | 0..1 | Semantik der Listenelemente |
| typeValueListElement | AasSubmodelElements | **1** | Typ der Listenelemente |
| valueTypeListElement | DataTypeDefXsd | 0..1 | valueType der Listenelemente (nur bei Property/Range) |

Elemente in einer List haben KEIN idShort — Zugriff per Index.

### Entity
Erbt: SubmodelElement

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| statements | SubmodelElement[] | 0..* | Aussagen über das Entity |
| entityType | EntityType | **1** | SelfManaged oder CoManaged |
| globalAssetId | Identifier | 0..1 | Global Asset ID |
| specificAssetIds | SpecificAssetId[] | 0..* | |

SelfManagedEntity erfordert globalAssetId ODER specificAssetId.

### RelationshipElement
Erbt: SubmodelElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| first | Reference | **1** |
| second | Reference | **1** |

### AnnotatedRelationshipElement
Erbt: RelationshipElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| annotations | DataElement[] | 0..* |

### Operation
Erbt: SubmodelElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| inputVariables | OperationVariable[] | 0..* |
| outputVariables | OperationVariable[] | 0..* |
| inoutputVariables | OperationVariable[] | 0..* |

**OperationVariable:** `value: SubmodelElement[1]`

### Capability
Erbt: SubmodelElement

Keine zusätzlichen Attribute. Beschreibt eine Fähigkeit.

### BasicEventElement
Erbt: EventElement (abstract) → SubmodelElement

| Attribut | Typ | Kard. |
|----------|-----|-------|
| observed | Reference (ModelReference) | **1** |
| direction | Direction | **1** |
| state | StateOfEvent | **1** |
| messageTopic | string | 0..1 |
| messageBroker | Reference (ModelReference) | 0..1 |
| lastUpdate | DateTimeUtc | 0..1 |
| minInterval | Duration | 0..1 |
| maxInterval | Duration | 0..1 |

### EventPayload (nicht-Referable)

| Attribut | Typ | Kard. |
|----------|-----|-------|
| source | Reference (ModelReference) | **1** |
| sourceSemanticId | Reference | 0..1 |
| observableReference | Reference (ModelReference) | **1** |
| observableSemanticId | Reference | 0..1 |
| topic | string | 0..1 |
| subjectId | Reference | 0..1 |
| timeStamp | DateTimeUtc | **1** |
| payload | BlobType | 0..1 |

---

## 6. Referencing-System

### Reference

| Attribut | Typ | Kard. |
|----------|-----|-------|
| type | ReferenceTypes | **1** |
| keys | Key[] | **1..\*** |
| referredSemanticId | Reference | 0..1 |

### Key

| Attribut | Typ | Kard. |
|----------|-----|-------|
| type | KeyTypes | **1** |
| value | Identifier | **1** |

### Referenz-Auflösung

**ExternalReference:** Verweist auf externe Ressourcen (URLs, IRDIs).
- Erster Key: `GlobalReference` oder `FragmentReference`
- Beispiel: `{ type: "ExternalReference", keys: [{ type: "GlobalReference", value: "0173-1#02-AAB381#012" }] }`

**ModelReference:** Verweist auf AAS-interne Elemente.
- Erster Key: `AssetAdministrationShell`, `Submodel`, oder `ConceptDescription`
- Folgende Keys: SubmodelElement-Typen (idShort-Pfad)
- Beispiel: `{ type: "ModelReference", keys: [{ type: "Submodel", value: "urn:example:sm1" }, { type: "Property", value: "MaxTemp" }] }`

---

## 7. Qualifier

| Attribut | Typ | Kard. |
|----------|-----|-------|
| kind | QualifierKind | 0..1 (Default: ConceptQualifier) |
| type | QualifierType | **1** |
| valueType | DataTypeDefXsd | **1** |
| value | ValueDataType | 0..1 |
| valueId | Reference | 0..1 |

---

## 8. Extension

| Attribut | Typ | Kard. |
|----------|-----|-------|
| name | NameType | **1** |
| valueType | DataTypeDefXsd | 0..1 (Default: xs:string) |
| value | ValueDataType | 0..1 |
| refersTo | Reference[] | 0..* |

---

## 9. EmbeddedDataSpecification

| Attribut | Typ | Kard. |
|----------|-----|-------|
| dataSpecification | Reference | **1** |
| dataSpecificationContent | DataSpecificationContent | **1** |

Für IEC 61360 Details → siehe `part3a-iec61360.md`

---

## 10. Constraints (vollständig)

| ID | Regel |
|----|-------|
| AASd-002 | idShort muss Regex `^[a-zA-Z][a-zA-Z0-9_-]*$` erfüllen (min 1 Zeichen, beginnt mit Buchstabe) |
| AASd-005 | revision erfordert, dass version gesetzt ist |
| AASd-006 | Wenn value und valueId beide gesetzt, müssen sie konsistent sein |
| AASd-020 | Qualifier-value muss zum deklarierten valueType passen |
| AASd-022 | idShort muss innerhalb desselben Namensraums eindeutig sein |
| AASd-116 | SpecificAssetId mit name="globalAssetId" muss value=globalAssetId haben |
| AASd-118 | supplementalSemanticId erfordert, dass semanticId gesetzt ist |
| AASd-119 | TemplateQualifier erfordert Submodel mit kind=Template |
| AASd-121 | Erster Key muss ein global identifizierbarer Typ sein |
| AASd-122 | ExternalReference: erster Key muss GlobalReference sein |
| AASd-123 | ModelReference: erster Key muss AAS, Submodel oder ConceptDescription sein |
| AASd-124 | ExternalReference: letzter Key muss GlobalReference oder FragmentReference sein |
| AASd-125 | ModelReference: folgende Keys müssen Fragment-Typen sein (kürzester Pfad) |
| AASd-126 | FragmentReference-Keys müssen auf File oder Blob folgen |
| AASd-127 | Keys nach SubmodelElementList müssen nicht-negative Integer sein (Array-Index) |
| AASd-128 | Generischer Fragment-Typ entweder letzter oder nicht vorhanden |
| AASd-129 | Template-Qualifier auf SubmodelElements erfordern Eltern-Template-Submodel |
| AASd-131 | globalAssetId ODER mindestens ein specificAssetId muss existieren |
| AASd-133 | externalSubjectId muss eine ExternalReference sein |

---

## 11. JSON-Serialisierung (Kurzreferenz)

Modelltyp wird über `"modelType"` Feld angegeben:
```json
{
  "assetAdministrationShells": [{
    "id": "urn:example:aas:1",
    "idShort": "MyAAS",
    "assetInformation": {
      "assetKind": "Instance",
      "globalAssetId": "urn:example:asset:1"
    },
    "submodels": [{
      "type": "ModelReference",
      "keys": [{ "type": "Submodel", "value": "urn:example:sm:1" }]
    }]
  }],
  "submodels": [{
    "id": "urn:example:sm:1",
    "idShort": "TechnicalData",
    "modelType": "Submodel",
    "submodelElements": [{
      "idShort": "MaxTemperature",
      "modelType": "Property",
      "valueType": "xs:double",
      "value": "85.5",
      "semanticId": {
        "type": "ExternalReference",
        "keys": [{ "type": "GlobalReference", "value": "0173-1#02-AAB381#012" }]
      }
    }]
  }],
  "conceptDescriptions": []
}
```

Vollständige Serialisierungsdetails → `part5-aasx.md`
