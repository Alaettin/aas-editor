# AAS Canvas Editor

## Vision
Visueller, node-basierter Editor auf unendlichem Canvas. AAS-Templates per Drag & Drop zusammenbauen, bestehende AAS-Dateien (JSON, XML, AASX) importieren und visualisieren. KI-gestützte Extraktion aus Datenblättern, automatisches eCl@ss-Matching. Desktop-first, Dark Theme, Sci-Fi-Feeling.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Canvas:** React Flow v12
- **Styling:** TailwindCSS + CSS Variables (Dark Theme)
- **State:** Zustand
- **Animationen:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** JetBrains Mono (Code/Werte) + Satoshi (UI)
- **Backend:** Node.js + Express (oder Hono)
- **AI:** OpenAI GPT-4o (Vision), GPT-4o-mini
- **DB:** PostgreSQL + Prisma
- **Auth:** Clerk (später)
- **AAS Validierung:** aas-core3.0-typescript
- **Import/Export:** JSZip (AASX), fast-xml-parser (XML)

## Skills
Lies die relevanten Skill-Dateien BEVOR du Änderungen in ihrem Bereich machst:
- `skills/design.md` — Design-System, Farben, Typografie, Komponenten, Animationen
- `skills/aas-spec.md` — AAS-Spezifikation (Metamodell, API, Serialisierung, Security, AASX)
  - Referenz-Dateien in `skills/aas-spec/` für Details pro Part
- `skills/workflow.md` — Workflow-Orchestrierung, Plan Mode, Subagent-Strategie, Verifikation

## Projekt-Struktur
```
aas-editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Button, Input, Card, Modal, Toast
│   │   │   ├── canvas/       # Custom React Flow Nodes & Edges
│   │   │   ├── toolbar/      # Canvas Toolbar
│   │   │   └── panels/       # JSON Preview, Validation, Template Browser
│   │   ├── store/            # Zustand Stores
│   │   ├── hooks/            # Custom Hooks
│   │   ├── types/            # AAS TypeScript Types
│   │   ├── utils/            # Serializer, Parser, Helpers
│   │   └── assets/           # Fonts, Static Files
│   └── public/
├── backend/
│   ├── src/
│   │   ├── routes/           # API Routes
│   │   ├── services/         # AI, eCl@ss, Repository
│   │   ├── middleware/       # Auth, Validation
│   │   └── lib/              # Prisma, Config
│   └── prisma/
├── skills/                   # Claude Skills
├── CLAUDE.md                 # ← Diese Datei
└── aas-canvas-editor-plan.md # Implementierungsplan
```

## Coding Rules
- UI-Labels auf Deutsch, Code auf Englisch
- TypeScript strict mode
- Dark Theme ist der einzige Theme — kein Light Mode
- AAS-Datenmodell nach Part 1 (Metamodel), Serialisierung nach Part 5
- NIEMALS pushen ohne explizite User-Anweisung
