import type { AiProvider } from '../store/aiStore';

const SYSTEM_PROMPT = `Du bist ein AAS-Experte (Asset Administration Shell, Spec V3.1).
Analysiere das folgende technische Dokument und erstelle eine VOLLSTÄNDIGE AAS im JSON-Format.
Extrahiere JEDEN einzelnen Datenpunkt — überspringe NICHTS.

Ausgabeformat (exakt):
{
  "assetAdministrationShells": [...],
  "submodels": [...],
  "conceptDescriptions": []
}

Regeln:
- IDs im URN-Format: "urn:example:aas:{name}", "urn:example:submodel:{name}"
- SubmodelElements: Property, MultiLanguageProperty, SubmodelElementCollection, Range
- Property.valueType: gültiger xs:-Typ (xs:string, xs:double, xs:integer, xs:boolean)
- idShort: sprechende englische CamelCase-Bezeichnungen
- value-Felder mit extrahierten Werten aus dem Dokument füllen
- AssetInformation: assetKind="Instance", globalAssetId="urn:example:asset:{name}"
- Jede Shell braucht submodels[] Array mit ModelReference-Objekten die auf die Submodel-IDs verweisen:
  { "type": "ModelReference", "keys": [{ "type": "Submodel", "value": "urn:example:submodel:{name}" }] }
- Jedes SubmodelElement braucht ein "modelType" Feld (z.B. "Property", "MultiLanguageProperty", "SubmodelElementCollection", "Range")

Submodel-Struktur:
- Wenige sinnvolle Submodels: Nameplate, TechnicalData, Documentation, ggf. Conformity
- Technische Daten-Gruppen (z.B. Elektrische Daten, Ausgang, Mechanische Daten, Umgebungsbedingungen, Funktionale Sicherheit, Anzeigen) als SubmodelElementCollection INNERHALB des TechnicalData Submodels gruppieren
- NICHT für jede Gruppe ein eigenes Submodel erstellen

Vollständigkeit:
- JEDE Tabellenzeile muss als Property innerhalb der passenden Collection erfasst werden
- Auch Fließtext-Beschreibungen (Funktion, Anwendung, etc.) als MultiLanguageProperty erfassen
- Abmessungen, Gewichte, Temperaturbereiche, Spannungen — ALLES extrahieren
- Lieber ZU VIELE Properties als zu wenige

Datenintegrität:
- WICHTIG: Verwende AUSSCHLIESSLICH Informationen aus dem bereitgestellten Dokument
- Erfinde KEINE Werte, ergänze KEINE Daten aus deinem Trainingswissen
- Wenn ein Wert im Dokument nicht vorhanden ist, setze value auf "" (leerer String)
- Keine Annahmen, keine Schätzungen — nur extrahierte Fakten

Antworte NUR mit validem JSON, keine Erklärungen.`;

interface GenerateOptions {
  provider: AiProvider;
  model: string;
  apiKey: string;
  images?: string[];
}

export interface GenerateResult {
  json: string;
  tokensUsed: number;
}

export async function generateAas(text: string, options: GenerateOptions): Promise<GenerateResult> {
  if (options.provider === 'openai') {
    return callOpenAI(text, options);
  }
  return callGemini(text, options);
}

// --- Helper: strip data URL prefix to get raw base64 ---
function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/png';
}

// --- OpenAI ---

async function callOpenAI(text: string, { model, apiKey, images }: GenerateOptions): Promise<GenerateResult> {
  // Build user message content
  type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
  const userContent: ContentPart[] = [];

  if (text) {
    userContent.push({ type: 'text', text });
  }
  if (images?.length) {
    for (const img of images) {
      userContent.push({ type: 'image_url', image_url: { url: img } });
    }
    if (!text) {
      userContent.unshift({ type: 'text', text: 'Analysiere dieses Dokument.' });
    }
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    images?.length
      ? { role: 'user', content: userContent }
      : { role: 'user', content: text },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Ungültiger API-Key');
    if (res.status === 429) throw new Error('Rate Limit erreicht, bitte kurz warten');
    throw new Error(err.error?.message || `OpenAI Fehler (${res.status})`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Leere AI-Antwort');

  // Validate JSON
  JSON.parse(content);
  const tokensUsed = data.usage?.total_tokens ?? 0;
  return { json: content, tokensUsed };
}

// --- Gemini ---

async function callGemini(text: string, { model, apiKey, images }: GenerateOptions): Promise<GenerateResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Build content parts
  type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
  const parts: GeminiPart[] = [];

  if (text) {
    parts.push({ text });
  }
  if (images?.length) {
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(img),
          data: dataUrlToBase64(img),
        },
      });
    }
    if (!text) {
      parts.unshift({ text: 'Analysiere dieses Dokument.' });
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 400 && err.error?.message?.includes('API key')) {
      throw new Error('Ungültiger API-Key');
    }
    if (res.status === 429) throw new Error('Rate Limit erreicht, bitte kurz warten');
    throw new Error(err.error?.message || `Gemini Fehler (${res.status})`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Leere AI-Antwort');

  // Validate JSON
  JSON.parse(content);
  const tokensUsed = data.usageMetadata?.totalTokenCount ?? 0;
  return { json: content, tokensUsed };
}
