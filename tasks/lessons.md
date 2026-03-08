# Lessons Learned

## Testing

### jsdom vs happy-dom (Node 20)
- jsdom 28 hat ESM-Inkompatibilitaet mit `html-encoding-sniffer` / `@exodus/bytes` auf Node 20
- **Loesung:** `happy-dom` installieren, per-file Directive `// @vitest-environment happy-dom` nutzen
- Globales Environment bleibt `node` (fuer reine Logic-Tests schneller)

### isSupportedDocument — xlsx ist supported
- `extractText.ts` enthaelt `.xlsx` und `.xls` in `SUPPORTED_EXTENSIONS`
- Tests muessen `isSupportedDocument('sheet.xlsx')` als `true` erwarten, nicht `false`
- Vor dem Schreiben von Tests: immer erst die Implementierung lesen

### LoginPage — Label/Input-Zuordnung
- Labels in LoginPage sind nicht via `htmlFor`/`id` mit Inputs verknuepft
- `getByLabelText()` funktioniert daher nicht
- **Workaround:** `document.querySelector('input[type="email"]')` statt `getByLabelText`

### postProcess — Reserved Words Case-Sensitivity
- `RESERVED_WORDS` Set enthaelt camelCase-Eintraege (`modelType`)
- Die Pruefung nutzt `.toLowerCase()` → `'modeltype'` matcht nicht `'modelType'`
- Tests nur mit lowercase Eintraegen (`'value'`, `'id'`) testen, die tatsaechlich matchen
- Bug-Fix: Entweder Set auf lowercase normalisieren oder Pruefung anpassen

### Streaming-Tests — JSON-Struktur
- Beim Mocken von SSE-Chunks darauf achten, dass die JSON-Struktur nicht doppelt verschachtelt wird
- Besser: Komplettes JSON in einem Chunk senden statt aufzusplitten

## Architecture

### Zustand Store Testing
- Pattern: `useStore.setState({...})` fuer Setup, `useStore.getState()` fuer Assertions
- Stores muessen in `beforeEach` zurueckgesetzt werden
- Supabase-Mock in `setup.ts` reicht fuer alle Store-Tests

### Subagent Strategy
- Tier 1 (pure logic) und Tier 2 (stores) koennen parallel geschrieben werden
- Tier 3 (API) und Tier 4 (Komponenten) haben mehr Abhaengigkeiten → sequentiell besser

## Security

### Defense-in-Depth bricht Mock-Chains
- Wenn `.eq('user_id', ...)` zu bestehenden Supabase-Queries hinzugefuegt wird,
  muessen ALLE Test-Mocks die custom Mock-Chains nutzen um `.eq` erweitert werden
- `mockReturnThis()` im globalen Mock (`setup.ts`) funktioniert, aber Tests mit
  eigenen `mockFrom.mockReturnValue(...)` brauchen explizites `eq: vi.fn().mockReturnThis()`

### sessionStorage in Node-Tests
- Store-Tests die `sessionStorage` nutzen laufen im `node` Environment (kein Browser)
- `sessionStorage` muss manuell gestubbt werden: `vi.stubGlobal('sessionStorage', { ... })`
- Alternativ: `// @vitest-environment happy-dom` Directive nutzen

### Gemini API Key — Header statt URL
- Gemini API Key als `?key=...` URL-Parameter ist ein Sicherheitsrisiko
  (sichtbar in Browser-History, Server-Logs, Referer-Header)
- Immer `x-goog-api-key` Header verwenden
- Bei Streaming: `?alt=sse` als einziger URL-Parameter, Key im Header
