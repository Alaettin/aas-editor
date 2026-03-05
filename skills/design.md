# Design Skill

Dieses Dokument definiert alle Design-Regeln für das Projekt. Jeder Agent MUSS diese Regeln befolgen wenn UI-Komponenten erstellt oder geändert werden.

---

## 1. Design-Prinzipien

- **Desktop-first:** Design für 1440px zuerst, dann für kleinere Screens anpassen
- **Technisch-professionell:** Zielgruppe sind Ingenieure und technische Fachleute
- **Werkzeug-Charakter:** Der Editor ist ein Arbeitswerkzeug — Klarheit vor Dekoration
- **Visuelles Feedback:** Jede Aktion hat eine sichtbare, animierte Reaktion
- **Konsistenz:** Gleiche Patterns für gleiche Interaktionen — keine Überraschungen
- **Informationsdichte:** Technische User wollen viele Daten auf einen Blick, aber sauber strukturiert

---

## 2. Farben

### Dark Theme Palette (CSS Custom Properties)
```css
:root {
  /* Hintergrund-Stufen (dunkel → hell) */
  --bg-base:        #0a0a0f;     /* Canvas-Hintergrund */
  --bg-surface:     #12121a;     /* Panels, Sidebars */
  --bg-elevated:    #1a1a2e;     /* Cards, Nodes, Dropdowns */
  --bg-hover:       #232340;     /* Hover-States */
  --bg-active:      #2a2a4a;     /* Aktive/Selektierte Elemente */

  /* Text */
  --text-primary:   #e8e8f0;     /* Haupttext */
  --text-secondary: #8888a0;     /* Sekundärer Text, Labels */
  --text-muted:     #555570;     /* Deaktiviert, Placeholder */

  /* Akzentfarben */
  --accent:         #6366f1;     /* Primär-Akzent (Indigo) */
  --accent-hover:   #818cf8;     /* Hover */
  --accent-glow:    rgba(99, 102, 241, 0.3);  /* Glow-Effekte */

  /* Semantische Farben */
  --success:        #10b981;     /* Valide, Verbunden */
  --warning:        #f59e0b;     /* Warnung, fehlende Daten */
  --error:          #ef4444;     /* Fehler, Invalide */
  --info:           #3b82f6;     /* Info, Links */

  /* Borders */
  --border:         #2a2a3e;     /* Standard-Border */
  --border-hover:   #3a3a55;     /* Hover-Border */
  --border-focus:   var(--accent); /* Focus-Ring */

  /* Spezial */
  --node-shadow:    0 4px 24px rgba(0, 0, 0, 0.5);
  --glow-shadow:    0 0 20px var(--accent-glow);
}
```

### Node-Typ-Farben
Jeder AAS-Node-Typ hat eine eigene Akzentfarbe für den oberen Rand:
```css
--node-aas:        #6366f1;     /* Indigo — Asset Administration Shell */
--node-submodel:   #8b5cf6;     /* Violet — Submodel */
--node-property:   #06b6d4;     /* Cyan — Property/Element */
--node-collection: #f59e0b;     /* Amber — Collection */
--node-concept:    #10b981;     /* Emerald — ConceptDescription */
```

### Regel: KEIN Light Mode. Dark Theme only.

---

## 3. Typografie

```css
/* UI-Schrift */
font-family: 'Satoshi', 'Inter', sans-serif;

/* Code/Werte-Schrift */
font-family: 'JetBrains Mono', 'Fira Code', monospace;

/* Größen */
text-2xl (24px) font-semibold    → Panel-Titel, Hauptüberschriften
text-xl  (20px) font-semibold    → Section-Titel
text-lg  (18px) font-medium      → Node-Titel (idShort)
text-base (16px) font-normal     → Standard
text-sm   (14px) font-normal     → Labels, sekundäre Infos
text-xs   (12px) font-normal     → Badges, Metadaten

/* Monospace (JetBrains Mono) verwenden für: */
- AAS IDs, IRDIs, URNs
- valueType, value-Felder
- JSON Preview
- Code-Snippets
```

---

## 4. Spacing

```
Basis-Unit: 4px (Tailwind default)
xs:   4px   (p-1)     → Badges, Tags
sm:   8px   (p-2)     → Inline-Elemente
md:   16px  (p-4)     → Standard-Padding
lg:   24px  (p-6)     → Section-Abstände
xl:   32px  (p-8)     → Panel-Padding
2xl:  48px  (p-12)    → Große Abstände

Panel-Padding: p-4 (Standard), p-6 (große Panels)
Node-Padding: p-3 (kompakt), p-4 (Standard)
Stack-Spacing: space-y-3 (Standard), space-y-2 (kompakt), space-y-4 (locker)
```

---

## 5. Komponenten

### Button
**Varianten:**
- `primary` → bg-accent text-white hover:bg-accent-hover, Glow-Shadow bei Hover
- `secondary` → bg-elevated border border-border text-secondary hover:text-primary hover:border-hover
- `danger` → bg-error/10 text-error border-error/30 hover:bg-error/20
- `ghost` → bg-transparent text-secondary hover:bg-hover hover:text-primary
- `icon` → p-2, nur Icon, rund (rounded-lg)

**Größen:**
- `sm` → px-3 py-1.5 text-sm
- `md` → px-4 py-2 text-sm (Default)
- `lg` → px-5 py-2.5 text-base

**States:**
- hover: Leichtes Aufhellen + optional Glow
- focus-visible: ring-2 ring-accent ring-offset-2 ring-offset-bg-base
- disabled: opacity-40 cursor-not-allowed
- loading: Spinner (animate-spin) + Label

### Input / TextArea
- Base: `w-full rounded-lg bg-elevated border border-border px-3 py-2 text-primary placeholder:text-muted focus:ring-2 focus:ring-accent focus:border-accent`
- Error: `border-error focus:ring-error` + Fehlermeldung `text-xs text-error mt-1`
- Label: `text-sm font-medium text-secondary mb-1`

### Card
- Base: `bg-elevated rounded-xl border border-border`
- Hover: `hover:border-hover transition-colors`
- Selektiert: `border-accent shadow-glow`

### Node (React Flow Custom Node)
```
Grundstruktur:
┌─ Farbiger Top-Border (3px, Node-Typ-Farbe) ─┐
│  ● idShort                           [⋮]    │
│  ─────────────────────────────────────────    │
│  Inhalt (Properties, Kinder, etc.)           │
│                                              │
│  [+ Element]                           [◉]   │
└──────────────────────────────────────────────┘

- Hintergrund: var(--bg-elevated)
- Border: 1px solid var(--border)
- Border-Radius: 12px (rounded-xl)
- Shadow: var(--node-shadow)
- Selektiert: Border wird Akzentfarbe + Glow
- Invalide: Border pulsiert rot (subtil)
- Min-Breite: 240px, Max-Breite: 400px
```

### Modal / Dialog
- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Content: `bg-surface rounded-xl border border-border shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto`
- Schließen: X-Button + Escape + Klick-Außerhalb

### Toast / Notification
- Position: `fixed bottom-4 right-4 z-60`
- Typen: success (Emerald), error (Rot), info (Blau), warning (Amber)
- Auto-Dismiss: 4s (success), 7s (error)
- Erscheint von rechts eingleitend (translateX)

### Tooltip
- `bg-surface border border-border text-sm text-primary px-3 py-1.5 rounded-lg shadow-lg`
- Erscheint nach 500ms Hover-Delay
- Max-Breite: 300px

### Context Menu (Rechtsklick)
- `bg-surface border border-border rounded-lg shadow-xl py-1`
- Items: `px-3 py-2 text-sm hover:bg-hover`
- Separator: `border-t border-border my-1`
- Shortcut-Hint: `text-muted ml-auto`

---

## 6. Canvas-spezifische Elemente

### Grid / Background
- Dot-Grid Pattern, Punkte in `var(--border)` Farbe
- Dot-Größe: 1px, Abstand: 20px
- Subtil — der Canvas lebt durch die Nodes, nicht das Grid

### Edges (Verbindungslinien)
- Standard: `stroke: var(--border-hover)`, 2px
- Selektiert/Hover: `stroke: var(--accent)`, Glow-Effekt
- Animiert: stroke-dashoffset Animation beim Erstellen
- Typ: Bezier (smooth) als Default

### Minimap
- Unten-rechts, halbtransparent
- `bg-surface/80 border border-border rounded-lg`

### Toolbar
- Oben, zentriert oder links
- `bg-surface border border-border rounded-lg shadow-lg`
- Icon-Buttons mit Tooltips

---

## 7. Animationen

### Grundregeln
- **Library:** Framer Motion für Layout-Animationen, CSS für Micro-Interactions
- **Default-Duration:** 200ms (Micro), 300ms (Panels/Modals), 500ms (Nodes erscheinen)
- **Easing:** ease-out für Einblenden, ease-in für Ausblenden, spring für "Snap"-Effekte
- **NUR animieren:** opacity, transform, box-shadow, border-color, background-color, filter
- **NIEMALS animieren:** width, height, margin, padding (Layout-Thrashing)

### Spezifische Animationen
```
Node erscheint:       scale(0.8) + opacity(0) → scale(1) + opacity(1), 400ms spring
Node löschen:         scale(1) → scale(0.9) + opacity(0), 200ms ease-in
Edge zeichnen:        stroke-dashoffset Animation, 600ms
Node selektieren:     Border-Glow einblenden, 200ms
Node hovern:          translateY(-2px) + Shadow verstärken, 150ms
Validation-Fehler:    Border pulsiert rot (1.5s infinite, subtil)
Panel ein/ausblenden: translateX + opacity, 300ms
Stagger (Import):     50ms Versatz pro Node
```

### "Breathing" Effekt (selektierte Nodes)
```css
@keyframes breathing {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-glow); }
  50%      { box-shadow: 0 0 16px 4px var(--accent-glow); }
}
/* Duration: 2.5s, nur bei selected State */
```

---

## 8. Layout

### Editor Layout
```
┌──────────────────────────────────────────────┐
│  Toolbar (fixiert oben)                      │
├──────┬───────────────────────────┬───────────┤
│      │                           │           │
│ Side │      Canvas               │  Panel    │
│ bar  │    (React Flow)           │  (JSON/   │
│      │                           │  Validat.)│
│      │                           │           │
├──────┴───────────────────────────┴───────────┤
│  Statusbar (optional, unten)                 │
└──────────────────────────────────────────────┘

Sidebar: 260px, ein-/ausklappbar (Ctrl+B)
Right Panel: 320-400px, ein-/ausklappbar
Canvas: flex-1 (nimmt restlichen Platz)
```

### Responsive Regeln
- **Desktop (1024px+):** Volles Layout mit Sidebar + Panel
- **Tablet (768px-1024px):** Sidebar als Overlay, Panel als Overlay
- **Mobile (<768px):** Eingeschränkter Modus — Canvas only mit Floating-Toolbar

---

## 9. Z-Index Scale
```
 0   Default Content
10   Sticky Headers, Statusbar
20   Floating Toolbar, Dropdown
30   Sidebar Overlay
40   Panel Overlay
50   Modal Backdrop + Content
60   Toast Notifications
70   Context Menu
80   Tooltip
90   Drag Preview
```

---

## 10. Icons
- **Library:** Lucide React
- **Größen:** 16px inline, 20px in Buttons/Nav, 24px standalone
- **Stroke-Width:** 1.5 (Standard), 2 (betont)
- **NIEMALS** andere Icon-Libraries mischen

---

## 11. Dos & Don'ts

### Do
- CSS Custom Properties für alle Farben verwenden (Theme-fähig)
- Alle interaktiven Elemente brauchen focus-visible Styles
- Transition auf allen hover/active States
- Konsistente rounded-Werte: lg (8px) für kleine Elemente, xl (12px) für Cards/Nodes

### Don't
- Keine harten Farbwerte im Code — immer CSS Variables oder Tailwind Theme
- Kein Light Mode, keine Light-Mode-Farben
- Keine Animationen auf Layout-Properties (width, height, margin, padding)
- Keine Icon-Libraries außer Lucide
- Keine inline-Styles für Farben
