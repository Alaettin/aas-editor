import type { AiProvider } from '../store/aiStore';
import type { ClassificationResult } from '../store/extractionStore';
import { pdfToImages, fileToBase64, getFileExtension, isImageFile, extractText } from './extractText';

const CLASSIFICATION_PROMPT = `Du bist ein Industrie-Dokumenten-Klassifizierer. Analysiere das hochgeladene
Dokument und extrahiere folgende Informationen.

Antworte NUR mit validem JSON, keine Erklaerungen, kein Markdown.

{
  "documentType": "technical_datasheet" | "nameplate" | "certificate" | "manual" | "unknown",
  "productName": "string – Produktbezeichnung",
  "productId": "string – Artikelnummer / Bestellnummer",
  "manufacturer": "string – Herstellername",
  "productCategory": "string – z.B. Induktiver Sensor, Frequenzumrichter, Pumpe",
  "language": "de" | "en" | "other",
  "pageCount": number,
  "confidence": 0.0-1.0
}`;

interface ClassifyOptions {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/png';
}

export async function classifyDocument(
  file: File,
  options: ClassifyOptions,
): Promise<ClassificationResult> {
  const ext = getFileExtension(file.name);

  // Vision-based classification for PDFs and images
  if (ext === '.pdf') {
    const allPages = await pdfToImages(file);
    const images = allPages.slice(0, 1); // Only first page
    return options.provider === 'openai'
      ? classifyOpenAI(images, options)
      : classifyGemini(images, options);
  }
  if (isImageFile(file.name)) {
    const images = [await fileToBase64(file)];
    return options.provider === 'openai'
      ? classifyOpenAI(images, options)
      : classifyGemini(images, options);
  }

  // Text-based classification for docx, xlsx, txt, etc.
  const text = await extractText(file);
  const preview = text.slice(0, 3000); // First ~3000 chars is enough for classification
  return options.provider === 'openai'
    ? classifyOpenAIText(preview, options)
    : classifyGeminiText(preview, options);
}

async function classifyOpenAI(
  images: string[],
  { model, apiKey }: ClassifyOptions,
): Promise<ClassificationResult> {
  type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
  const userContent: ContentPart[] = [
    { type: 'text', text: 'Klassifiziere dieses Dokument.' },
    ...images.map((img) => ({ type: 'image_url' as const, image_url: { url: img } })),
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CLASSIFICATION_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Classification fehlgeschlagen (${res.status})`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Leere Classification-Antwort');
  return JSON.parse(content) as ClassificationResult;
}

async function classifyGemini(
  images: string[],
  { model, apiKey }: ClassifyOptions,
): Promise<ClassificationResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
  const parts: GeminiPart[] = [
    { text: 'Klassifiziere dieses Dokument.' },
    ...images.map((img) => ({
      inlineData: { mimeType: getMimeType(img), data: dataUrlToBase64(img) },
    })),
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CLASSIFICATION_PROMPT }] },
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Classification fehlgeschlagen (${res.status})`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Leere Classification-Antwort');
  return JSON.parse(content) as ClassificationResult;
}

// --- Text-based classification (for docx, xlsx, txt, etc.) ---

async function classifyOpenAIText(
  text: string,
  { model, apiKey }: ClassifyOptions,
): Promise<ClassificationResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CLASSIFICATION_PROMPT },
        { role: 'user', content: `Klassifiziere dieses Dokument anhand des folgenden Textauszugs:\n\n${text}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Classification fehlgeschlagen (${res.status})`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Leere Classification-Antwort');
  return JSON.parse(content) as ClassificationResult;
}

async function classifyGeminiText(
  text: string,
  { model, apiKey }: ClassifyOptions,
): Promise<ClassificationResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CLASSIFICATION_PROMPT }] },
      contents: [{ parts: [{ text: `Klassifiziere dieses Dokument anhand des folgenden Textauszugs:\n\n${text}` }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Classification fehlgeschlagen (${res.status})`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Leere Classification-Antwort');
  return JSON.parse(content) as ClassificationResult;
}
