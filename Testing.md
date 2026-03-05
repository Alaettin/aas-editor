# Testing — AAS Canvas Editor

## Framework

**Vitest** — Vite-nativer Test-Runner, schnell, ESM-kompatibel.

| Bereich | Environment | Config |
|---------|-------------|--------|
| Frontend | `node` | `frontend/vitest.config.ts` |
| Backend | `node` | `backend/vitest.config.js` |

## Tests ausführen

```bash
# Frontend (89 Tests)
cd frontend && npm test          # einmal ausführen
cd frontend && npm run test:watch # Watch-Modus
cd frontend && npm run test:ui   # Browser-UI

# Backend (15 Tests)
cd backend && npm test           # einmal ausführen
cd backend && npm run test:watch # Watch-Modus
```

## Test-Übersicht

### Frontend — 89 Tests in 5 Dateien

| Datei | Tests | Was wird getestet |
|-------|-------|-------------------|
| `utils/__tests__/exportAas.test.ts` | 33 | AAS-zu-JSON Konvertierung: Shell, Submodel, alle 14 Element-Typen (Property, Range, File, Blob, Collection, List, Entity, Operation, Capability, ReferenceElement, RelationshipElement, AnnotatedRelationshipElement, BasicEventElement, MultiLanguageProperty), Qualifiers, SemanticId, Administration, ConceptDescription-Filterung, Store-Export |
| `store/__tests__/aasStore.test.ts` | 28 | Zustand-Store Actions: addShell, addSubmodel, addConceptDescription, updateShellId, updateSubmodelId (mit Referenz-Update), updateShell, updateSubmodel, addSubmodelToShell (Edge-Erstellung), addSubmodelElement (inkl. verschachtelte Container), updateSubmodelElement, removeSubmodelElement, deleteNode (Kaskade), duplicateNode, clearCanvas, loadCanvas, importEnvironment, toggleConceptDescriptions |
| `utils/__tests__/importAas.test.ts` | 14 | JSON-Import und Auto-Layout: Parsing, Node-Erstellung (AAS, Submodel, Element), Edge-Erstellung (Parent-Child), Positionierung (Y-Hierarchie, X-horizontal), Standalone-Submodels, verschachtelte Collections, _nodeId-Zuweisung, Origin-Offset, Fehlerbehandlung |
| `utils/__tests__/constants.test.ts` | 9 | XSD-Datentypen (30 Einträge, xs:-Prefix), Key-Types (Submodel, AAS, CD etc.), Element-Types (15 Typen), Duplikat-Prüfung |
| `utils/__tests__/ids.test.ts` | 5 | UUID v4 Format, URN-Format (urn:aas-editor:prefix:uuid), Eindeutigkeit über 100 Aufrufe |

### Backend — 15 Tests in 1 Datei

| Datei | Tests | Was wird getestet |
|-------|-------|-------------------|
| `__tests__/server.test.js` | 15 | makeError (AAS V3 Fehlerformat, Code-zu-String, ISO-Timestamp), Cursor-Encoding/Decoding (Base64 JSON, Pagination), Base64 ID-Decoding (URNs, Sonderzeichen, Umlaute), Limit-Berechnung (Cap bei 1000, Default 100) |

## Test-Tiers

### Tier 1 — Pure Functions (implementiert)
- `exportAas.ts`: Alle Typ-Konverter, Element-Typen, Validierung
- `importAas.ts`: Layout-Algorithmus, Tree-Traversal
- `ids.ts`, `constants.ts`: Hilfsfunktionen

### Tier 2 — Store-Logik (implementiert)
- `aasStore.ts`: CRUD-Actions, Referenz-Integrität, Kaskaden-Löschung

### Tier 3 — Backend API (implementiert)
- `server.js`: Fehlerformat, Pagination, ID-Decoding

### Tier 4 — Komponenten (noch nicht implementiert)
Für die Zukunft mit `@testing-library/react` (bereits installiert):
- `ApiDocsPage`: Base64-Encoder Input → Output
- `ApiConfigPage`: Publish-Flow (Dialog bleibt offen)
- `ExportDialog`: Export-Button erzeugt korrektes JSON

## Dateistruktur

```
frontend/
├── vitest.config.ts
├── src/
│   ├── utils/__tests__/
│   │   ├── exportAas.test.ts     # 33 Tests
│   │   ├── importAas.test.ts     # 14 Tests
│   │   ├── ids.test.ts           #  5 Tests
│   │   └── constants.test.ts     #  9 Tests
│   └── store/__tests__/
│       └── aasStore.test.ts      # 28 Tests

backend/
├── vitest.config.js
└── __tests__/
    └── server.test.js            # 15 Tests
```

## Namenskonventionen

- Testdateien: `*.test.ts` (Frontend) / `*.test.js` (Backend)
- Verzeichnis: `__tests__/` neben dem getesteten Code
- Describe-Blöcke: nach Funktion/Modul benannt
- Test-Namen: beschreiben das erwartete Verhalten auf Deutsch oder Englisch

## Dependencies

### Frontend (devDependencies)
- `vitest` — Test-Runner
- `@vitest/ui` — Browser-UI für Tests
- `jsdom` — DOM-Simulation (für zukünftige Komponenten-Tests)
- `@testing-library/react` — React-Komponenten testen (für Tier 4)
- `@testing-library/jest-dom` — DOM-Matcher (für Tier 4)

### Backend (devDependencies)
- `vitest` — Test-Runner

## Hinweise

- **Environment `node`**: Die Tests laufen im Node-Environment, nicht jsdom. Das reicht für Pure Functions und Zustand-Stores. Für Komponenten-Tests muss auf `jsdom` oder `happy-dom` gewechselt werden (per `// @vitest-environment jsdom` Kommentar in der Testdatei).
- **Store-Reset**: Jeder Test setzt den Zustand via `useAasStore.setState()` zurück, um Isolation zu gewährleisten.
- **Concept Descriptions**: CD-Nodes werden nur erstellt wenn `showConceptDescriptions: true`. Tests die CDs löschen müssen dies berücksichtigen.
