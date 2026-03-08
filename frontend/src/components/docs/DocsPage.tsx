import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Cpu, Layers, Shield, Eye, GitCommit, Zap } from 'lucide-react';

// ─── Reusable Accordion Section ───

function Section({
  icon: Icon,
  color,
  title,
  badge,
  children,
  defaultOpen,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: `1px solid ${open || hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRight: `1px solid ${open || hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderBottom: `1px solid ${open || hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <Icon size={18} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {title}
        </span>
        {badge && (
          <span
            style={{
              padding: '2px 10px',
              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
              color,
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {badge}
          </span>
        )}
        {open ? (
          <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ───

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '12px 0' }}>
      {children}
    </p>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code
      style={{
        padding: '1px 6px',
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--accent)',
      }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div style={{ margin: '12px 0' }}>
      {title && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          {title}
        </div>
      )}
      <pre
        style={{
          padding: 14,
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          fontFamily: "'JetBrains Mono', monospace",
          overflow: 'auto',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </pre>
    </div>
  );
}

function Label({ color, children }: { color: string; children: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '20px 0 8px' }}>
      {children}
    </h3>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ margin: '12px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textAlign: 'left',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '8px 12px',
                    color: 'var(--text-secondary)',
                    borderBottom: ri < rows.length - 1 ? '1px solid var(--border)' : 'none',
                    backgroundColor: ri % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    fontFamily: ci === 0 ? "'JetBrains Mono', monospace" : 'inherit',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pipeline Diagram ───

function PipelineDiagram() {
  const steps = [
    { label: 'Dokument', sub: 'PDF / DOCX / XLSX / Bild', color: 'var(--text-muted)' },
    { label: 'Klassifikation', sub: 'Phase 1 — Vision / Text', color: '#3b82f6' },
    { label: 'Extraktion', sub: 'Phase 2 — LLM Streaming', color: '#8b5cf6' },
    { label: 'Postprocessing', sub: 'Phase 3 — 6 Validierungen', color: '#22c55e' },
    { label: 'AAS Graph', sub: 'Ghost Nodes → Commit', color: 'var(--accent)' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        margin: '20px 0',
        overflowX: 'auto',
        padding: '4px 0',
      }}
    >
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: `color-mix(in srgb, ${step.color} 10%, var(--bg-surface))`,
              border: `1px solid ${step.color}`,
              borderRadius: 10,
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: step.color }}>{step.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{step.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 32,
                height: 2,
                backgroundColor: 'var(--border)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: -2,
                  top: -3,
                  width: 0,
                  height: 0,
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderLeft: '6px solid var(--border)',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───

export function DocsPage() {
  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          Dokumentation
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
          KI-gestützte AAS-Extraktion — Architektur, Algorithmen und Qualitätssicherung.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* ─── 1. Pipeline Overview ─── */}
        <Section
          icon={Layers}
          color="var(--accent)"
          title="Pipeline-Architektur"
          badge="3 Phasen"
          defaultOpen
        >
          <P>
            Die Extraktion industrieller Dokumentdaten in eine Asset Administration Shell (AAS) nach
            IDTA-01001 (V3.1) erfolgt in einer dreistufigen Pipeline. Jede Phase operiert unabhängig
            und kommuniziert über typisierte Zustandsobjekte (Zustand-Store mit Phasenübergängen).
          </P>

          <PipelineDiagram />

          <H3>Unterstützte Eingabeformate</H3>
          <Table
            headers={['Format', 'Extraktionsmethode', 'Klassifikation']}
            rows={[
              ['PDF', 'pdf.js — räumliche Textrekonstruktion', 'Vision (erste Seite als Bild)'],
              ['DOCX', 'mammoth.js — Raw-Text', 'Text (erste 3000 Zeichen)'],
              ['XLSX / XLS', 'SheetJS — CSV-Konvertierung', 'Text (erste 3000 Zeichen)'],
              ['TXT / MD / CSV', 'FileReader API', 'Text (erste 3000 Zeichen)'],
              ['PNG / JPG / WEBP', 'Base64 Data URL', 'Vision (Bilddatei)'],
            ]}
          />

          <H3>KI-Provider</H3>
          <Table
            headers={['Provider', 'Modelle', 'Besonderheiten']}
            rows={[
              ['OpenAI', 'GPT-4o, GPT-4o-mini', 'Structured Output (JSON Schema), nativer Stream'],
              ['Google Gemini', '2.5 Flash, 2.5 Pro', 'responseMimeType: application/json, SSE-Stream'],
            ]}
          />

          <P>
            Beide Provider werden über identische Abstraktionsschichten angesprochen.
            Die Wahl des Providers hat keinen Einfluss auf die nachgelagerte Verarbeitung —
            die Pipeline ist providerneutral konzipiert.
          </P>
        </Section>

        {/* ─── 2. Classification ─── */}
        <Section icon={FileText} color="#3b82f6" title="Phase 1 — Dokumentklassifikation" badge="T=0.1">
          <P>
            Die Klassifikation läuft <strong>parallel</strong> zur Textextraktion. Ihr Ziel ist eine
            strukturierte Metadaten-Erfassung des Dokuments, bevor die eigentliche Datenextraktion beginnt.
            Die niedrige Temperature von <Code>0.1</Code> erzwingt hochdeterministische Ergebnisse.
          </P>

          <H3>Zwei Klassifikationspfade</H3>
          <P>
            <Label color="#3b82f6">Vision</Label>{' '}
            Für PDFs und Bilddateien. Die erste Seite wird mit <Code>pdf.js</Code> bei Scale-Faktor 2
            in ein PNG gerendert (<Code>OffscreenCanvas</Code>) und als Base64 Data URL an das
            multimodale Sprachmodell gesendet. Bei Bilddateien wird die Datei direkt konvertiert.
          </P>
          <P>
            <Label color="#8b5cf6">Text</Label>{' '}
            Für DOCX, Excel und Plaintext-Dateien. Die ersten 3000 Zeichen des extrahierten Texts
            dienen als Klassifikations-Input. Dies genügt, da Produktbezeichnung, Hersteller und
            Dokumenttyp typischerweise im Dokumentkopf stehen.
          </P>

          <H3>Ausgabe-Schema</H3>
          <CodeBlock title="ClassificationResult">
{`{
  "documentType": "technical_datasheet" | "nameplate" | "certificate" | "manual" | "unknown",
  "productName":  "string — Produktbezeichnung",
  "productId":    "string — Artikelnummer / Bestellnummer",
  "manufacturer": "string — Herstellername",
  "productCategory": "string — z.B. Induktiver Sensor, Frequenzumrichter",
  "language":     "de" | "en" | "other",
  "pageCount":    number,
  "confidence":   0.0 – 1.0
}`}
          </CodeBlock>

          <P>
            Der <Code>confidence</Code>-Wert gibt die Selbsteinschätzung des Modells wieder. Werte unter
            0.6 führen zu einer Warnung in der UI und werden im Metadata-Objekt protokolliert.
          </P>
        </Section>

        {/* ─── 3. Text Extraction ─── */}
        <Section icon={Eye} color="#f59e0b" title="Textextraktion — Algorithmen" badge="5 Formate">
          <P>
            Die Textextraktion läuft parallel zur Klassifikation und bereitet den vollständigen
            Dokumentinhalt für die AAS-Extraktion (Phase 2) auf. Für jedes Format kommt ein
            spezialisierter Algorithmus zum Einsatz.
          </P>

          <H3>PDF — Räumliche Textrekonstruktion</H3>
          <P>
            Der PDF-Algorithmus basiert auf <Code>pdf.js</Code> und rekonstruiert die Lesereihenfolge
            aus den absoluten Koordinaten jedes Text-Elements. Dies ist notwendig, weil PDFs kein
            semantisches Zeilenkonzept besitzen — Text wird als positionierte Glyphen gespeichert.
          </P>
          <CodeBlock title="Algorithmus">
{`1. PDF laden (pdf.js, ArrayBuffer)
2. Für jede Seite:
   a. TextContent extrahieren (items mit str, transform)
   b. Position ableiten: x = transform[4], y = round(transform[5])
   c. Sortieren: Y absteigend (oben → unten), X aufsteigend (links → rechts)
   d. Zeilengruppierung: Items mit |Δy| ≤ 3px gehören zur selben Zeile
   e. Spalten-Rekonstruktion: Items pro Zeile mit Tab (\\t) verbinden
   f. Zeilen mit Newline (\\n) verbinden
3. Seiten mit "--- Seite ---" Separator verbinden`}
          </CodeBlock>
          <P>
            Die 3-Pixel-Toleranz bei der Y-Gruppierung kompensiert minimale Versätze durch
            Hoch-/Tiefstellungen und Kerning. Die Tab-Trennung bewahrt die Tabellenstruktur,
            die für technische Datenblätter essentiell ist.
          </P>

          <H3>Excel — Sheet-zu-CSV</H3>
          <P>
            Excel-Dateien werden mit <Code>SheetJS</Code> geladen. Jedes Sheet wird einzeln
            über <Code>sheet_to_csv</Code> mit Tab als Feldtrenner konvertiert. Leere Sheets
            werden übersprungen. Das Ergebnis bewahrt die tabellarische Struktur.
          </P>

          <H3>DOCX / Plaintext</H3>
          <P>
            DOCX-Dateien werden mit <Code>mammoth.js</Code> als Raw-Text extrahiert (ohne
            Formatierung). Plaintext-Dateien (TXT, MD, CSV) werden direkt über die FileReader-API
            gelesen.
          </P>

          <H3>Bildextraktion für Vision-API</H3>
          <P>
            Für die multimodale KI-Analyse werden PDF-Seiten als Bilder gerendert.
            Der Prozess nutzt <Code>OffscreenCanvas</Code> mit Scale-Faktor 2
            (für höhere Auflösung), rendert via <Code>page.render()</Code> und konvertiert das
            Ergebnis in ein PNG-Blob, das anschließend als Base64 Data URL kodiert wird.
          </P>
        </Section>

        {/* ─── 4. AAS Extraction ─── */}
        <Section icon={Cpu} color="#8b5cf6" title="Phase 2 — AAS-Extraktion" badge="T=0.2">
          <P>
            Die Kernphase der Pipeline. Ein multimodales Sprachmodell analysiert den extrahierten
            Dokumentinhalt und generiert eine vollständige AAS-Struktur im JSON-Format.
            Zwei Betriebsmodi stehen zur Verfügung.
          </P>

          <H3>Modus A — Freie Extraktion</H3>
          <P>
            Das Modell erhält einen System-Prompt mit der vollständigen AAS-V3.1-Spezifikation
            aller 14 SubmodelElement-Typen und generiert die AAS-Struktur frei. Der Prompt
            erzwingt strenge Regeln:
          </P>
          <Table
            headers={['Regel', 'Beschreibung']}
            rows={[
              ['idShort-Format', 'CamelCase, englisch, Regex: ^[a-zA-Z][a-zA-Z0-9_]*$'],
              ['IDs', 'URN-Format: urn:example:aas:{name}, urn:example:submodel:{name}'],
              ['Werte', 'NIEMALS übersetzen — exakt wie im Dokument'],
              ['Einheiten', 'Als Teil des Wert-Strings: "27,7 g", "700 Hz", "-40...85 °C"'],
              ['Boolesche Werte', '"ja"/"nein" → xs:boolean mit true/false'],
              ['semanticId', 'Wird NICHT gesetzt (separater Schritt)'],
              ['Submodel-Struktur', '3-4 Submodels: Nameplate, TechnicalData, Documentation, Conformity'],
              ['Datenintegrität', 'NUR Dokumentinhalte — keine Trainingsdaten, keine Annahmen'],
            ]}
          />

          <H3>14 SubmodelElement-Typen (AAS Metamodel V3.1)</H3>
          <Table
            headers={['Typ', 'Verwendung', 'Kernfelder']}
            rows={[
              ['Property', 'Einzelwert', 'valueType (xs:*), value'],
              ['MultiLanguageProperty', 'Mehrsprachiger Text', 'value: [{language, text}]'],
              ['Range', 'Min/Max Wertebereich', 'valueType, min, max'],
              ['Blob', 'Eingebettete Binärdaten', 'value (base64), contentType'],
              ['File', 'Dateireferenz', 'value (Pfad), contentType'],
              ['ReferenceElement', 'Verweis auf AAS-Element', 'value: {type, keys}'],
              ['SMC (Collection)', 'Ungeordnete Gruppierung', 'value: [SubmodelElement, ...]'],
              ['SML (List)', 'Geordnete Liste', 'typeValueListElement, valueTypeListElement'],
              ['Entity', 'Asset-Entität', 'statements, entityType, globalAssetId'],
              ['RelationshipElement', 'Beziehung', 'first, second (References)'],
              ['AnnotatedRelationshipElement', 'Beziehung + Daten', 'first, second, annotations'],
              ['Operation', 'Ausführbare Operation', 'input-/output-/inoutputVariables'],
              ['Capability', 'Fähigkeit', '(nur idShort + modelType)'],
              ['BasicEventElement', 'Event-Definition', 'observed, direction, state'],
            ]}
          />

          <H3>Modus B — Mapping auf bestehende Submodels</H3>
          <P>
            Im Mapping-Modus erhält das Modell vordefinierte Submodel-Strukturen als Schema.
            Die Werte werden zuvor mit <Code>stripValues()</Code> entfernt — nur Struktur,
            idShorts, modelTypes und semanticIds bleiben erhalten. Das Modell befüllt
            ausschließlich die Werte.
          </P>
          <P>
            Zusätzlich werden <strong>ConceptDescriptions</strong> (CDs) mitgeliefert, sofern sie
            über semanticId-Referenzen verknüpft sind. Die CDs enthalten:
          </P>
          <Table
            headers={['Feld', 'Bedeutung', 'Beispiel']}
            rows={[
              ['preferredName', 'Menschenlesbare Bezeichnung', '"Masse", "Operating Temperature"'],
              ['unit', 'Physikalische Einheit', '"g", "°C", "V DC"'],
              ['definition', 'Semantische Definition', '"Masse des Betriebsmittels ohne Verpackung"'],
            ]}
          />
          <P>
            Diese semantischen Informationen ermöglichen dem Modell eine präzisere Zuordnung
            von Dokumentdaten zu Properties — insbesondere bei mehrdeutigen Feldern wie
            "Gewicht" vs. "Versandgewicht".
          </P>
          <P>
            Daten, die in keines der bereitgestellten Properties passen, werden automatisch
            in eine <Code>AdditionalProperties</Code>-SubmodelElementCollection am Ende jedes
            Submodels eingefügt.
          </P>

          <H3>Structured Output</H3>
          <P>
            Für OpenAI wird ein vollständiges JSON Schema (<Code>response_format: json_object</Code>)
            übergeben, das alle 14 Element-Typen mit ihren Feldern und Referenzen definiert.
            Gemini nutzt <Code>responseMimeType: 'application/json'</Code>. Beide Ansätze stellen
            sicher, dass die Antwort stets valides JSON ist.
          </P>

          <H3>Streaming</H3>
          <P>
            Die Extraktion nutzt Streaming für Echtzeit-Feedback. OpenAI sendet
            Delta-Chunks über <Code>stream: true</Code>, Gemini nutzt Server-Sent
            Events (<Code>alt=sse</Code>). Die Chunks werden akkumuliert und bei
            jedem neuen Fragment wird der partielle JSON-String an die UI weitergereicht.
          </P>
        </Section>

        {/* ─── 5. Post-Processing ─── */}
        <Section
          icon={Shield}
          color="#22c55e"
          title="Phase 3 — Postprocessing"
          badge="6 Stufen"
        >
          <P>
            Nach der LLM-Generierung durchläuft das JSON eine sechsstufige
            deterministische Validierungspipeline. Jede Stufe protokolliert ihre Korrekturen
            als <Code>Correction</Code>-Objekte, die dem Benutzer transparent angezeigt werden.
          </P>

          <H3>Stufe 1 — JSON-Repair</H3>
          <P>
            Erster Versuch: <Code>JSON.parse()</Code>. Bei Fehlschlag wird die
            Bibliothek <Code>jsonrepair</Code> eingesetzt, die fehlende Klammern, überhängende
            Kommas und andere häufige LLM-Fehler korrigiert. Schlägt auch dies fehl,
            wird ein Fehler ausgelöst.
          </P>

          <H3>Stufe 2 — idShort-Validierung</H3>
          <P>
            Jeder <Code>idShort</Code> wird gegen die Regex <Code>{'^[a-zA-Z][a-zA-Z0-9_]*$'}</Code> geprüft.
            Ungültige Zeichen werden durch Unterstriche ersetzt, führende Ziffern durch "X" präfixt.
            Die Länge wird auf 64 Zeichen begrenzt. Reservierte Wörter (<Code>value</Code>, <Code>modelType</Code>,
            <Code>idShort</Code>, <Code>id</Code>, <Code>semanticId</Code>) erhalten ein <Code>_1</Code>-Suffix.
            Die Validierung erfolgt rekursiv für verschachtelte Collections und Entity-Statements.
          </P>

          <H3>Stufe 3 — Duplikat-Erkennung</H3>
          <P>
            Auf jeder Hierarchieebene dürfen keine doppelten idShorts existieren. Duplikate
            erhalten automatisch nummerierte Suffixe: <Code>PropertyName</Code> → <Code>PropertyName_2</Code>.
            Die Zählung ist pro Ebene — verschachtelte Collections haben ihren eigenen Namensraum.
          </P>

          <H3>Stufe 4 — ValueType/Value-Konsistenz</H3>
          <P>
            Für Properties wird geprüft, ob der <Code>valueType</Code> ein gültiger XSD-Typ
            ist (28+ unterstützte Typen). Bei fehlendem oder unbekanntem Typ wird automatisch
            inferiert:
          </P>
          <CodeBlock title="Typ-Inferenz">
{`"true" / "false"       → xs:boolean
"42", "-7"             → xs:integer
"3.14", "-0,5"         → xs:double
alles andere           → xs:string`}
          </CodeBlock>
          <P>
            Boolesche Werte werden normalisiert: <Code>ja</Code>, <Code>yes</Code>, <Code>wahr</Code>,
            <Code>1</Code> → <Code>true</Code>. Gleiches für die negativen Varianten.
            Ranges erhalten bei fehlendem Typ automatisch <Code>xs:double</Code>.
          </P>

          <H3>Stufe 5 — Halluzinations-Erkennung</H3>
          <P>
            Jeder extrahierte Property-Wert wird gegen den Quelltext des Dokuments geprüft.
            Der Algorithmus:
          </P>
          <CodeBlock title="Halluzinations-Check">
{`1. Quelltext + Wert: Normalisieren (lowercase, whitespace-collapse)
2. Fuzzy-Suche: Ist normalizedValue in normalizedPdf enthalten?
3. Falls nein + Wert beginnt mit Zahl:
   a. Numerischen Präfix extrahieren (z.B. "27.7" aus "27,7 g")
   b. Komma → Punkt normalisieren
   c. Erneut im Quelltext suchen
4. Falls immer noch nicht gefunden:
   → Warnung: "Verdächtiger Wert — nicht im Dokument gefunden"

Übersprungen werden:
- Werte < 3 Zeichen
- Boolesche Werte (true/false)
- Leere Strings`}
          </CodeBlock>
          <P>
            Der Halluzinations-Zähler (<Code>hallucinationSuspects</Code>) wird im Metadata-Objekt
            gespeichert. Jeder verdächtige Wert erzeugt eine benannte Warnung mit idShort und Wert.
          </P>

          <H3>Stufe 6 — Struktur-Bereinigung</H3>
          <P>
            Leere SubmodelElementCollections (<Code>value: []</Code>) werden entfernt.
            Collections mit einem einzigen Element werden beibehalten, da sie semantisch
            bedeutsam sein können (z.B. eine logische Gruppierung mit nur einem aktuellen Eintrag).
            Die Bereinigung erfolgt rekursiv.
          </P>
        </Section>

        {/* ─── 6. Ghost Nodes ─── */}
        <Section icon={GitCommit} color="#f97316" title="Ghost-Node-Vorschau & Commit-Flow">
          <P>
            Nach dem Postprocessing werden die extrahierten Daten als "Ghost Nodes" auf dem
            Canvas visualisiert — eine interaktive Vorschau mit gestrichelten Rändern,
            bevor der Benutzer die Daten endgültig übernimmt.
          </P>

          <H3>Ghost-Node-Erstellung</H3>
          <P>
            Drei Node-Typen werden als Ghost-Varianten erstellt:
          </P>
          <Table
            headers={['Node-Typ', 'Position', 'Daten']}
            rows={[
              ['AAS Node', 'Drop-Position des Dokuments', 'idShort, id, assetInformation, description'],
              ['Submodel Nodes', '160px unterhalb der AAS', 'idShort, id, submodelElements (Zusammenfassung)'],
              ['Element Nodes', '300px rechts vom Submodel', 'Erste Ebene der submodelElements'],
            ]}
          />
          <P>
            Ghost Nodes tragen das Flag <Code>isGhost: true</Code> in ihren Datendefinitionen.
            Die Nodes werden visuell durch gestrichelte Ränder (<Code>borderStyle: 'dashed'</Code>)
            und Edges durch animierte Linien (smoothstep, animated) gekennzeichnet.
            IDs werden mit <Code>ghost_</Code>-Präfix und Auto-Inkrement generiert,
            um Kollisionen mit bestehenden Nodes zu vermeiden.
          </P>

          <H3>Commit-Prozess</H3>
          <CodeBlock title="Ablauf">
{`1. JSON normalisieren:
   - Singular-Format {aas, submodel} → Plural {assetAdministrationShells, submodels}
   - ModelReference-Verknüpfungen zwischen Shell und Submodels herstellen

2. AAS Environment Format erzeugen:
   {
     assetAdministrationShells: [{ ...aas, submodels: [ModelReference] }],
     submodels: [...],
     conceptDescriptions: []
   }

3. importEnvironment() aufrufen:
   - Echte Graph-Nodes mit reaktivem State erstellen
   - Edges zwischen AAS → Submodels → Elements generieren
   - Layout-Positionen berechnen

4. Ghost Nodes aus dem State entfernen
5. Canvas auf die neuen Nodes zentrieren`}
          </CodeBlock>
        </Section>

        {/* ─── 7. Data Integrity ─── */}
        <Section icon={Zap} color="#ef4444" title="Datenintegrität & Qualitätssicherung">
          <P>
            Die Pipeline verfolgt das Grundprinzip der <strong>dokumenttreuen Extraktion</strong>:
            Jeder Wert muss nachweislich aus dem Quelldokument stammen. Mehrere Mechanismen
            stellen dies sicher.
          </P>

          <H3>Prompt-Level-Sicherung</H3>
          <P>
            Der System-Prompt enthält explizite Anweisungen zur Datenintegrität:
          </P>
          <CodeBlock>
{`"WICHTIG: Verwende AUSSCHLIESSLICH Informationen aus dem bereitgestellten Dokument.
Erfinde KEINE Werte, ergänze KEINE Daten aus deinem Trainingswissen.
Wenn ein Wert nicht vorhanden ist, setze value auf "" (leerer String).
Keine Annahmen, keine Schätzungen — nur extrahierte Fakten."`}
          </CodeBlock>

          <H3>Algorithmische Verifikation</H3>
          <Table
            headers={['Mechanismus', 'Phase', 'Beschreibung']}
            rows={[
              ['Halluzinations-Check', 'Postprocessing (Stufe 5)', 'Fuzzy-Textabgleich jedes Werts gegen Quelldokument'],
              ['Confidence-Score', 'LLM-Ausgabe', 'Selbsteinschätzung des Modells (0.0–1.0)'],
              ['Corrections-Log', 'Postprocessing (alle Stufen)', 'Jede automatische Korrektur wird protokolliert'],
              ['Warnings-Array', 'Postprocessing + LLM', 'Warnungen für übersprungene oder verdächtige Daten'],
            ]}
          />

          <H3>Benutzer-Review</H3>
          <P>
            Nach dem Postprocessing erhält der Benutzer eine detaillierte Zusammenfassung:
          </P>
          <Table
            headers={['Metrik', 'Beschreibung']}
            rows={[
              ['extractedProperties', 'Anzahl extrahierter Property/MLP/Range-Elemente'],
              ['skippedItems', 'Vom LLM übersprungene Dokumentbereiche'],
              ['confidence', 'Konfidenzwert des Modells'],
              ['hallucinationSuspects', 'Anzahl nicht im Dokument verifizierter Werte'],
              ['corrections', 'Liste aller automatischen Korrekturen mit Typ und Detail'],
              ['warnings', 'Gesammelte Warnungen aus allen Stufen'],
            ]}
          />
          <P>
            Ghost Nodes ermöglichen eine visuelle Inspektion vor dem endgültigen Commit.
            Der Benutzer kann einzelne Elemente im Review-State akzeptieren oder ablehnen,
            bevor die Daten in den AAS-Graphen übernommen werden.
          </P>
        </Section>
      </div>
    </div>
  );
}
