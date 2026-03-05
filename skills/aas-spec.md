# AAS Specification — Skill Reference

Vollständige technische Referenz der Asset Administration Shell Spezifikation (IDTA).
Lies die relevante Referenz-Datei BEVOR du Code in dem Bereich schreibst.

---

## Spec-Übersicht

| Part | IDTA-Nr. | Titel | Version | Referenz-Datei |
|------|----------|-------|---------|----------------|
| **Part 1** | IDTA-01001 | Metamodel | 3.1 | `aas-spec/part1-metamodel.md` |
| **Part 2** | IDTA-01002 | Application Programming Interfaces | 3.1 | `aas-spec/part2-api.md` |
| **Part 3a** | IDTA-01003-a | Data Specification — IEC 61360 | 3.1 | `aas-spec/part3a-iec61360.md` |
| **Part 4** | IDTA-01004 | Security | 3.0 | `aas-spec/part4-security.md` |
| **Part 5** | IDTA-01005 | Package File Format (AASX) | 3.1 | `aas-spec/part5-aasx.md` |

---

## Wann welche Datei lesen?

| Aufgabe | Lies diese Datei |
|---------|------------------|
| Node-Typen definieren, SubmodelElements anlegen, Validierung | `part1-metamodel.md` |
| REST-API Endpunkte implementieren, Repository-Queries | `part2-api.md` |
| ConceptDescription erstellen, eCl@ss-Mapping, semanticId | `part3a-iec61360.md` |
| Zugriffsrechte, Multi-Tenancy, ABAC-Regeln | `part4-security.md` |
| AASX Import/Export, ZIP-Paket erstellen/lesen | `part5-aasx.md` |

---

## Quick Reference — Die 5 Kern-Typen

### Environment (Top-Level Container)
```
Environment
  assetAdministrationShells: AssetAdministrationShell[]
  submodels: Submodel[]
  conceptDescriptions: ConceptDescription[]
```

### AssetAdministrationShell
```
AssetAdministrationShell (Identifiable, HasDataSpecification)
  id: Identifier                          ← Pflicht
  idShort: IdShortType                    ← Optional
  assetInformation: AssetInformation      ← Pflicht
  submodels: Reference[]                  ← ModelReference auf Submodels
  derivedFrom: Reference                  ← Optional
```

### Submodel
```
Submodel (Identifiable, HasKind, HasSemantics, Qualifiable, HasDataSpecification)
  id: Identifier                          ← Pflicht
  idShort: IdShortType                    ← Optional
  semanticId: Reference                   ← Optional (z.B. IDTA Template IRDI)
  kind: ModellingKind                     ← Instance (default) oder Template
  submodelElements: SubmodelElement[]     ← Die eigentlichen Daten
```

### SubmodelElement-Hierarchie
```
SubmodelElement (abstract)
├── DataElement (abstract)
│   ├── Property           ← valueType + value
│   ├── MultiLanguageProperty ← mehrsprachiger Text
│   ├── Range              ← min + max
│   ├── Blob               ← Binärdaten
│   ├── File               ← Dateipfad + MIME
│   └── ReferenceElement   ← Referenz auf anderes Element
├── SubmodelElementCollection ← Struct/Objekt (idShort-basiert)
├── SubmodelElementList       ← Array (index-basiert)
├── Entity                    ← Asset-Repräsentation
├── RelationshipElement       ← first → second
│   └── AnnotatedRelationshipElement
├── Operation                 ← in/out/inout Variables
├── Capability                ← Fähigkeitsbeschreibung
└── BasicEventElement         ← Event-Quelle
```

### ConceptDescription
```
ConceptDescription (Identifiable, HasDataSpecification)
  id: Identifier                          ← Pflicht (z.B. eCl@ss IRDI)
  isCaseOf: Reference[]                   ← Verweise auf externe Definitionen
  embeddedDataSpecifications:             ← DataSpecificationIec61360 (Part 3a)
```

---

## Wichtigste Constraints (Kurzform)

| ID | Regel |
|----|-------|
| AASd-002 | idShort Regex: `^[a-zA-Z][a-zA-Z0-9_-]*$` (min 1 Zeichen, beginnt mit Buchstabe) |
| AASd-005 | revision erfordert version |
| AASd-022 | idShort muss innerhalb eines Namensraums eindeutig sein |
| AASd-118 | supplementalSemanticId erfordert semanticId |
| AASd-131 | globalAssetId ODER mindestens ein specificAssetId muss existieren |

Vollständige Constraint-Tabelle → `part1-metamodel.md` Abschnitt 10.
