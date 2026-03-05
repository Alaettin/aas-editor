# AAS Canvas Editor – Tech Stack & Implementierungsplan

## Vision

Ein visueller, node-basierter Editor auf einem unendlichen Canvas, mit dem AAS-Templates intuitiv per Drag & Drop zusammengebaut werden. Bestehende AAS-Dateien (JSON, XML, AASX) direkt auf den Canvas droppen und visualisieren. KI-gestützte Extraktion aus technischen Datenblättern und automatische Semantik-Zuordnung über eCl@ss. Lebendige Animationen, Desktop-first, Sci-Fi-Feeling.

---

## Tech Stack

### Frontend

| Bereich | Technologie | Warum |
|---|---|---|
| Framework | **React 18 + TypeScript** | Ökosystem, Kompatibilität mit allen Libraries |
| Canvas/Nodes | **React Flow v12** | Industriestandard für Node-basierte Editoren. Nodes, Edges, Zoom, Pan, Minimap, Grouping out of the box |
| Animationen | **Framer Motion** | Smooth Transitions, Layout-Animationen, Breathing-Effekte auf Nodes |
| Styling | **TailwindCSS + CSS Variables** | Schnelles Prototyping, Dark Theme via CSS Custom Properties |
| State Management | **Zustand** | Leichtgewichtig, perfekt für einen zentralen AAS-State den React Flow und UI teilen |
| Formulare/Inline-Edit | **Headless UI + eigene Komponenten** | Inline-Editing direkt in den Nodes (idShort, valueType, value) |
| Icons | **Lucide React** | Clean, konsistent |
| Fonts | **JetBrains Mono (Code/Werte) + Satoshi (UI)** | Technisch + modern |
| Build Tool | **Vite** | Schneller Dev-Server, optimierter Build |

### Backend / API

| Bereich | Technologie | Warum |
|---|---|---|
| Runtime | **Node.js + Express** (oder Hono für Lightweight) | Minimal – dient nur als Proxy für AI-Calls und File-Handling |
| AI – PDF Extraktion | **OpenAI GPT-4o** (Vision) oder **Claude Sonnet** | PDF/Bild als Input → strukturierte AAS-Properties als Output |
| AI – Template Suggestions | **GPT-4o-mini** oder **Claude Haiku** | Schnelle, günstige Vorschläge für IDTA-Templates |
| PDF Parsing | **pdf-parse** (npm) als Fallback | Text-Extraktion wenn Vision nicht reicht |
| Auth (später) | **Clerk** | Wie bei Blitzangebot, konsistent |
| Hosting | **Vercel** (Frontend) + **Railway** (Backend) | Bewährt aus deinem bestehenden Stack |

### AAS-Konformität, Import & Export

| Bereich | Technologie | Warum |
|---|---|---|
| AAS Meta-Model | **Eigenes TypeScript-Datenmodell** nach AAS Part 1 | Volle Kontrolle, typsicher |
| JSON Serialisierung | **AAS JSON nach Part 5** | Standardkonformer Export |
| XML Serialisierung | **AAS XML nach Part 5** (via fast-xml-parser) | Import bestehender XML-basierter AAS |
| AASX Import/Export | **JSZip** (clientseitig) | AASX = OPC-Paket = ZIP mit JSON/XML + `_rels/.rels` + `[Content_Types].xml` |
| AAS File Parsing | **Eigener Parser** (JSON nativ, XML via fast-xml-parser, AASX via JSZip + entpacken) | Drag & Drop Import aller drei Formate |
| Validierung | **aas-core3.0-typescript** | Live-Validierung im Editor – Constraints werden bei jeder Änderung geprüft |

### eCl@ss / Semantik

| Bereich | Technologie | Warum |
|---|---|---|
| eCl@ss Datenbank | **eCl@ss WebService API** oder lokaler JSON-Export | Suche nach IRDI, Property-Definitionen, Klassifikationen |
| Semantik-Matching | **GPT-4o-mini / Claude Haiku** | Property idShort → passende eCl@ss IRDI vorschlagen |
| ConceptDescription | Automatisch generiert aus eCl@ss Treffer | semanticId + ConceptDescription im AAS Environment |
| Fallback | **ECLASS CDN / Open Data** | Falls kein API-Zugang: statischer Katalog der häufigsten Properties |

### Tenant Repository API

| Bereich | Technologie | Warum |
|---|---|---|
| Datenbank | **PostgreSQL** (via Supabase oder Railway) | Relationales Modell für Shells, Submodels, ConceptDescriptions pro Tenant |
| ORM | **Prisma** | Typsicheres DB-Schema, Migrations, bewährt aus Blitzangebot-Stack |
| API Framework | **Node.js + Express** (oder Hono) | AAS API Spec implementieren |
| API Spec | **AAS Part 2 – HTTP/REST API** (DotAAS) | Standardkonforme Endpunkte: `/shells`, `/submodels`, `/concept-descriptions` |
| Multi-Tenancy | **Tenant-ID im JWT + Row-Level Isolation** | Jeder User/Org hat eigenen isolierten Datenraum |
| Auth | **Clerk** (JWT) | Tenant-ID aus Clerk Organisation, API Keys für externen Zugriff |
| API Docs | **Swagger / OpenAPI** auto-generiert | Jeder Tenant sieht seine eigene API-Dokumentation |
| Hosting | **Railway** (Backend + DB) | Skalierbar, einfach |

### Optional / Später

| Bereich | Technologie |
|---|---|
| Voice Commands | Whisper API + Deepgram (Real-Time) |
| Collaboration | Yjs + WebSocket (CRDT-basiert, wie Figma) |
| Desktop App | Tauri (leichtgewichtige Electron-Alternative) |

---

## Implementierungsplan

### Phase 1 – Canvas Grundgerüst (1 Woche)

**Ziel:** Leerer Canvas auf dem man AAS- und Submodel-Nodes erstellen, positionieren und verbinden kann.

- [ ] Vite + React + TypeScript + Tailwind Projekt aufsetzen
- [ ] React Flow integrieren, Dark Theme, Custom Background (Dot Grid)
- [ ] Zustand Store: `aasEnvironment` als zentrale Single Source of Truth
- [ ] Custom Node Types definieren:
  - `AASNode` – repräsentiert eine AssetAdministrationShell
  - `SubmodelNode` – repräsentiert ein Submodel
  - `ElementNode` – repräsentiert SubmodelElements (Property, Collection, etc.)
- [ ] Toolbar mit Buttons: "Neue AAS", "Neues Submodel"
- [ ] Klick auf Button → Node erscheint auf Canvas (zentriert im Viewport)
- [ ] Edges: Verbindungslinie von AAS → Submodel ziehen = Referenz erstellen
- [ ] Minimap aktivieren

### Phase 2 – Node Interaktion & Inline Editing (1 Woche)

**Ziel:** Nodes sind editierbar, Properties können erstellt und bearbeitet werden.

- [ ] Doppelklick auf Node → Inline Edit von `idShort`, `id`
- [ ] Submodel-Node: "+" Button am unteren Rand → neues SubmodelElement
- [ ] Element-Typ Auswahl: Property, Collection, MultiLanguageProperty, Range, Blob, File, ReferenceElement
- [ ] Property-Node zeigt: idShort, valueType (Dropdown), value (Input)
- [ ] Collection-Node: Verschachtelte Elemente, auf-/zuklappbar
- [ ] Drag aus Submodel: Element-Handle am Node-Rand → rausziehen erzeugt neues Kind-Element
- [ ] Delete: Entf-Taste oder Rechtsklick-Kontextmenü
- [ ] Undo/Redo Stack im Zustand Store

### Phase 2b – Live-Validierung mit aas-core-works (3-5 Tage)

**Ziel:** Jede Änderung auf dem Canvas wird in Echtzeit gegen das AAS Meta-Model validiert. Fehler werden sofort visuell angezeigt.

- [ ] `aas-core3.0-typescript` Library einbinden (npm: `aas-core3.0-typescript`)
- [ ] Validierungs-Hook: Bei jeder State-Änderung im Zustand Store → Validator laufen lassen
  - Debounced (300ms) damit es bei schnellem Tippen nicht laggt
  - Läuft im Web Worker um den Main Thread nicht zu blockieren
- [ ] Mapping: Canvas-State → aas-core Objekte → `verify()` / `transform()` aufrufen
- [ ] Fehler-Typen die geprüft werden:
  - Pflichtfelder fehlen (z.B. Shell ohne assetInformation)
  - Ungültige idShort-Formate (Regex-Constraint)
  - Falsche valueType/value Kombinationen
  - Fehlende oder ungültige Referenzen (Shell → Submodel)
  - Kardinalitäts-Constraints (z.B. min/max bei Collections)
- [ ] Visuelle Darstellung:
  - Invalide Nodes: Roter Rand (pulsierend, subtil)
  - Hover über roten Rand → Tooltip mit Fehlermeldung
  - Globaler Validation-Status in der Toolbar: ✅ "Valide" oder ❌ "3 Fehler"
  - Klick auf Fehler-Counter → Panel mit Fehlerliste, Klick auf Fehler → Canvas scrollt zum betroffenen Node
- [ ] Severity-Levels: Error (rot) vs. Warning (gelb, z.B. fehlende semanticId)
- [ ] Validation On/Off Toggle (für Performance bei sehr großen Templates)

### Phase 3 – Animationen & Visuelles Feedback (3-5 Tage)

**Ziel:** Das "lebendige" Gefühl – alles animiert, nichts springt.

- [ ] Node-Erscheinung: Scale-in + Fade mit Framer Motion `layoutId`
- [ ] "Breathing" Effekt: Subtiler Box-Shadow Pulse auf selektierten Nodes (CSS Animation)
- [ ] Edge-Animation: Linie zeichnet sich von Quelle zu Ziel (SVG stroke-dashoffset)
- [ ] Hover-States: Nodes heben sich leicht an (translateY + Shadow)
- [ ] Verbindung ziehen: Elastische Linie die zum Cursor folgt, Snap-Effekt beim Andocken
- [ ] Delete: Node "zerfällt" kurz (Scale-out + Opacity)
- [ ] Sound Design (optional): Subtle UI-Sounds via Tone.js – Click, Connect, Delete
- [ ] Partikel-Effekt beim Erstellen neuer Nodes (Canvas-basiert, performant)

### Phase 4 – AAS Export (3-5 Tage)

**Ziel:** Vom Canvas zum validen AAS JSON und AASX Paket.

- [ ] Zustand Store → AAS JSON Serializer (Part 5 konform)
- [ ] Interne `_uid`, Positionen etc. beim Export strippen
- [ ] JSON Preview Panel (rechts ein-/ausklappbar, Syntax Highlighted)
- [ ] "Export JSON" Button → Download als `.json`
- [ ] AASX Export:
  - AAS JSON → `/aasx/aas.json`
  - `_rels/.rels` generieren
  - `[Content_Types].xml` generieren
  - Alles in JSZip → Download als `.aasx`
- [ ] XML Export via `fast-xml-parser` (AAS Part 5 XML Schema)

### Phase 4b – AAS File Import / Drop-to-Visualize (1 Woche)

**Ziel:** Bestehende AAS-Dateien auf den Canvas droppen → komplette Visualisierung.

- [ ] Globale Drop-Zone auf dem Canvas (HTML5 Drag & Drop API)
- [ ] File-Typ Erkennung:
  - `.json` → direkt parsen als AAS JSON (Part 5)
  - `.xml` → `fast-xml-parser` → AAS Objekt-Struktur
  - `.aasx` → JSZip entpacken → JSON oder XML darin finden → parsen
- [ ] AAS-zu-Nodes Mapper:
  - Jede Shell → `AASNode` auf dem Canvas
  - Jedes Submodel → `SubmodelNode`, verbunden mit referenzierender Shell
  - SubmodelElements → Kinder-Nodes oder inline in der Submodel-Card
  - ConceptDescriptions → eigener Node-Typ oder Badge an Properties
- [ ] Auto-Layout: Importierte Strukturen automatisch sauber anordnen (Dagre/ELK Layout-Algorithmus), damit es nicht als Haufen in der Mitte landet
- [ ] Animation: Nodes "fliegen" nacheinander ein (Stagger-Animation, 50ms Versatz pro Node)
- [ ] Drop-Feedback: Datei-Schatten auf Canvas beim Hovern, Fortschrittsanzeige bei großen AASX-Paketen
- [ ] Fehlerbehandlung: Ungültige Dateien → Toast-Notification mit Hinweis was schief ging
- [ ] Merge-Logik: Wenn bereits Nodes auf dem Canvas sind → importierte Nodes daneben platzieren, nicht ersetzen
- [ ] Round-Trip Test: Import → nichts ändern → Export → Datei sollte semantisch identisch sein

### Phase 5 – KI: Datenblatt-Extraktion (1 Woche)

**Ziel:** PDF/Bild hochladen → KI extrahiert Properties → Nodes erscheinen auf Canvas.

- [ ] Drag & Drop Zone auf Canvas für PDF/Bild Upload
- [ ] Backend Endpoint: `/api/extract` – nimmt PDF/Bild, sendet an GPT-4o Vision
- [ ] Prompt Engineering:
  ```
  Du bist ein AAS-Experte. Extrahiere alle technischen Daten aus
  diesem Datenblatt und strukturiere sie als AAS SubmodelElements.
  Gruppiere logisch in SubmodelElementCollections.
  Output: JSON Array von SubmodelElements mit idShort, modelType,
  valueType, value, und semanticId wo möglich.
  ```
- [ ] Response → Nodes auf Canvas generieren mit Stagger-Animation (eins nach dem anderen)
- [ ] "Vorschau" Modus: Extrahierte Nodes erscheinen halbtransparent, User bestätigt mit "Übernehmen" oder verwirft
- [ ] IDTA Mapping: Wenn extrahierte Daten zu bekannten Submodel-Templates passen (Nameplate, Technical Data), automatisch `semanticId` setzen

### Phase 5b – KI: eCl@ss Semantik-Matching (1 Woche)

**Ziel:** Per Rechtsklick oder Button auf einer Property → KI findet passende eCl@ss IRDI → ConceptDescription wird automatisch erstellt.

- [ ] eCl@ss Datenquelle anbinden:
  - **Option A:** eCl@ss WebService API (kostenpflichtig, aber vollständig)
  - **Option B:** eCl@ss Basic (kostenloser Download als CSV/XML) → in lokale SQLite oder JSON-Index laden
  - **Option C:** Statischer Katalog der ~500 häufigsten Properties im AAS-Kontext (MVP-tauglich)
- [ ] Kontextmenü auf Property-Node: "Semantik finden" / "eCl@ss zuordnen"
- [ ] AI-Flow:
  ```
  Input an LLM:
  - Property idShort: "MaxOperatingTemperature"
  - valueType: "xs:double"  
  - Kontext: Parent Submodel "TechnicalData", Shell "Siemens_Pump_XY"
  
  Aufgabe: Finde die 3 passendsten eCl@ss Properties (IRDI + preferred name).
  ```
- [ ] Ergebnis als Auswahl-Popup: 3 Vorschläge mit IRDI, Name, Definition – User klickt den passenden
- [ ] Bei Auswahl:
  - `semanticId` auf der Property setzen (z.B. `0173-1#02-AAB381#012`)
  - `ConceptDescription` im AAS Environment anlegen mit:
    - `id` = IRDI
    - `embeddedDataSpecifications` mit preferredName, definition, unit, valueFormat
  - ConceptDescription-Node erscheint auf Canvas (optional, eigener Node-Typ mit Verbindungslinie zur Property)
- [ ] Batch-Modus: Alle Properties eines Submodels auf einmal matchen ("Alle Semantiken finden")
- [ ] Visueller Indikator: Properties ohne semanticId = dezenter Warn-Badge, mit semanticId = grüner Haken

### Phase 6 – IDTA Template Library (3-5 Tage)

**Ziel:** Vorgefertigte Submodel-Templates per Klick auf den Canvas setzen.

- [ ] Template Katalog: JSON-Dateien der gängigsten IDTA Submodels
  - Digital Nameplate (IDTA 02006-2-0)
  - Technical Data (IDTA 02003-1-2)
  - Handover Documentation (IDTA 02004-1-2)
  - Contact Information (IDTA 02002-1-0)
- [ ] Template Browser: Sidebar oder Modal mit Vorschau
- [ ] Klick/Drag → Submodel-Node mit allen Standard-Properties erscheint auf Canvas
- [ ] Properties sind vorausgefüllt mit Platzhaltern, User füllt Werte aus

### Phase 7 – Tenant AAS Repository API (1.5 Wochen)

**Ziel:** Beim Speichern wird die AAS in eine Datenbank persistiert und über eine standardkonforme AAS API (Part 2) pro Tenant abrufbar.

- [ ] **Datenbank-Schema (Prisma):**
  ```
  Tenant (id, name, clerkOrgId, apiKey, createdAt)
  Shell (id, tenantId, idShort, aasData JSON, createdAt, updatedAt)
  Submodel (id, tenantId, idShort, smData JSON, shellId?, createdAt, updatedAt)
  ConceptDescription (id, tenantId, cdData JSON, createdAt)
  Project (id, tenantId, name, canvasState JSON, createdAt, updatedAt)
  ```
- [ ] **AAS API Endpunkte (Part 2 konform):**
  - `GET /api/v1/shells` – Alle Shells des Tenants
  - `GET /api/v1/shells/:shellId` – Einzelne Shell
  - `POST /api/v1/shells` – Shell anlegen
  - `PUT /api/v1/shells/:shellId` – Shell aktualisieren
  - `DELETE /api/v1/shells/:shellId` – Shell löschen
  - `GET /api/v1/submodels` – Alle Submodels des Tenants
  - `GET /api/v1/submodels/:smId` – Einzelnes Submodel
  - `GET /api/v1/submodels/:smId/submodel-elements` – Alle Elemente
  - `GET /api/v1/submodels/:smId/submodel-elements/:idShortPath` – Verschachtelter Zugriff
  - `GET /api/v1/concept-descriptions` – Alle ConceptDescriptions
  - `GET /api/v1/concept-descriptions/:cdId` – Einzelne CD
  - `GET /api/v1/serialization` – Komplettes AAS Environment als JSON
- [ ] **Multi-Tenancy:**
  - Clerk JWT → `tenantId` extrahieren (aus Clerk Organisation)
  - Jede DB-Query gefiltert nach `tenantId` (Row-Level Isolation)
  - API Key pro Tenant für externen Zugriff (z.B. aus Postman, eigene Systeme)
  - Rate Limiting pro Tenant (z.B. 1000 req/min)
- [ ] **Save-Flow im Editor:**
  - "Speichern" Button → Canvas-State wird serialisiert
  - Shells, Submodels, ConceptDescriptions werden einzeln an die API gesendet (Upsert)
  - Canvas-Positionen werden separat im `Project` gespeichert (nicht Teil der AAS-Daten)
  - Optimistic UI: Save-Indikator, Fehler-Toast bei Netzwerkproblemen
  - Auto-Save Option (alle 30s, debounced)
- [ ] **Tenant Dashboard:**
  - Übersicht: "Deine API" mit Base-URL (`https://api.aascanvas.dev/t/{tenantSlug}/v1/`)
  - API Key Management: Generieren, Rotieren, Löschen
  - Usage Stats: Anzahl Shells, Submodels, API Calls
  - Swagger UI: Live-Dokumentation der eigenen API mit Try-it-out
- [ ] **Externe Nutzung:**
  - Andere Systeme (z.B. BaSyx, DTI, eigene Apps) können direkt gegen die Tenant-API arbeiten
  - CORS konfigurierbar pro Tenant
  - Webhook-Support (später): Bei Änderungen → Notification an externe URL

### Phase 8 – Polish & Nice-to-Haves (laufend)

- [ ] Keyboard Shortcuts: Space+Drag=Pan, Ctrl+Z=Undo, Del=Delete, Ctrl+D=Duplicate
- [ ] Gruppierung: Mehrere Nodes selektieren → visuell gruppieren
- [ ] Auto-Layout: Button der alle Nodes sauber anordnet (Dagre/Elkjs Layout-Algorithmus)
- [ ] Search/Filter: Cmd+K zum Suchen von Nodes auf dem Canvas
- [ ] Multi-Tab: Mehrere AAS-Projekte als Tabs
- [ ] Offline-Support: Service Worker für Canvas-Arbeit ohne Netz, Sync bei Reconnect

---

## Architektur-Überblick

```
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend (Vite + React)                      │
│                                                                  │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Toolbar  │  │   Canvas     │  │   JSON      │  │ Validation│ │
│  │         │  │  (React Flow) │  │   Preview   │  │   Panel   │ │
│  └────┬────┘  └──────┬───────┘  └──────┬──────┘  └─────┬─────┘ │
│       └───────────────┼────────────────┼────────────────┘       │
│                       │                │                         │
│           ┌───────────┴────────────────┴──────────┐              │
│           │         Zustand Store (AAS State)     │              │
│           └───────────┬───────────────────────────┘              │
│                       │  onChange                                 │
│           ┌───────────┴──────────┐                               │
│           │  aas-core3.0-ts      │ ← Web Worker                 │
│           │  Live Validator       │                               │
│           └──────────────────────┘                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ JSON     │  │ AASX     │  │ XML      │  │ Import Parser  │  │
│  │ Export   │  │ Export   │  │ Export   │  │ (JSON/XML/AASX)│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express/Hono)               │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  AI Services      │  │  Tenant AAS Repository API           │ │
│  │                    │  │  (AAS Part 2 konform)                │ │
│  │  POST /api/extract│  │                                      │ │
│  │  POST /api/eclass │  │  GET  /t/:tenant/v1/shells           │ │
│  │                    │  │  GET  /t/:tenant/v1/submodels        │ │
│  │  ┌──────────────┐ │  │  GET  /t/:tenant/v1/concept-desc     │ │
│  │  │ GPT-4o/Claude│ │  │  GET  /t/:tenant/v1/serialization    │ │
│  │  └──────────────┘ │  │  POST/PUT/DELETE ...                  │ │
│  └──────────────────┘  └──────────┬───────────────────────────┘ │
│                                    │                             │
│                          ┌─────────┴─────────┐                  │
│                          │   PostgreSQL       │                  │
│                          │   (Multi-Tenant)   │                  │
│                          │   Prisma ORM       │                  │
│                          └───────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
                             ▲
                             │ Externe Systeme
                   ┌─────────┴──────────┐
                   │ BaSyx / DTI /      │
                   │ Postman / eigene   │
                   │ Apps               │
                   └────────────────────┘
```

---

## Geschätzte Timeline

| Phase | Dauer | Kumuliert |
|---|---|---|
| Phase 1 – Canvas Grundgerüst | 1 Woche | 1 Woche |
| Phase 2 – Node Interaktion | 1 Woche | 2 Wochen |
| Phase 2b – Live-Validierung (aas-core) | 3-5 Tage | ~2.5 Wochen |
| Phase 3 – Animationen | 3-5 Tage | ~3 Wochen |
| Phase 4 – AAS Export | 3-5 Tage | ~3.5 Wochen |
| Phase 4b – AAS File Import | 1 Woche | ~4.5 Wochen |
| Phase 5 – KI Datenblatt-Extraktion | 1 Woche | ~5.5 Wochen |
| Phase 5b – KI eCl@ss Semantik | 1 Woche | ~6.5 Wochen |
| Phase 6 – IDTA Templates | 3-5 Tage | ~7 Wochen |
| Phase 7 – Tenant AAS Repository API | 1.5 Wochen | ~8.5 Wochen |
| Phase 8 – Polish | laufend | — |

**MVP (Phase 1-4b): ~4.5 Wochen** – Canvas-Editor mit Live-Validierung, Import und Export.

**KI-Features (Phase 5-6): +2.5 Wochen** – Datenblatt-Extraktion, eCl@ss Matching, IDTA Templates.

**Plattform (Phase 7): +1.5 Wochen** – Eigene AAS Repository API pro Tenant mit standardkonformen Endpunkten.
