import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set pdf.js worker from local bundle (Vite resolves ?url imports)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv']);
const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md', '.csv', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.webp']);

export function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export function isSupportedDocument(name: string): boolean {
  return SUPPORTED_EXTENSIONS.has(getFileExtension(name));
}

export function isImageFile(name: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(name));
}

export async function extractText(file: File): Promise<string> {
  const ext = getFileExtension(file.name);

  if (ext === '.pdf') {
    return extractPdf(file);
  }
  if (ext === '.docx') {
    return extractDocx(file);
  }
  if (EXCEL_EXTENSIONS.has(ext)) {
    return extractExcel(file);
  }
  if (TEXT_EXTENSIONS.has(ext)) {
    return extractPlainText(file);
  }

  throw new Error(`Dateityp "${ext}" wird nicht unterstützt`);
}

async function extractPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items by Y position to reconstruct lines/rows (preserves table structure)
    interface TextItem { str: string; x: number; y: number; }
    const items: TextItem[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const tx = item.transform;
      items.push({ str: item.str, x: tx[4], y: Math.round(tx[5]) });
    }

    // Sort by Y descending (top to bottom), then X ascending (left to right)
    items.sort((a, b) => b.y - a.y || a.x - b.x);

    // Group items into lines (items within 3px Y are same line)
    const lines: string[] = [];
    let currentY = items[0]?.y ?? 0;
    let currentLine: TextItem[] = [];

    for (const item of items) {
      if (Math.abs(item.y - currentY) > 3) {
        if (currentLine.length > 0) {
          lines.push(currentLine.map((it) => it.str).join('\t'));
        }
        currentLine = [];
        currentY = item.y;
      }
      currentLine.push(item);
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.map((it) => it.str).join('\t'));
    }

    pages.push(lines.join('\n'));
  }

  return pages.join('\n\n--- Seite ---\n\n');
}

async function extractExcel(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets: string[] = [];

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
    if (csv.trim()) {
      sheets.push(`--- ${name} ---\n${csv}`);
    }
  }

  return sheets.join('\n\n');
}

async function extractDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

function extractPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file);
  });
}

// --- Image extraction for Vision API ---

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'));
    reader.readAsDataURL(blob);
  });
}

/** Convert a single image file to a base64 data URL */
export async function fileToBase64(file: File): Promise<string> {
  return blobToBase64(file);
}

/** Render each PDF page to an image and return base64 data URLs */
export async function pdfToImages(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas: null, canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const base64 = await blobToBase64(blob);
    images.push(base64);
  }

  return images;
}

/** Extract images from any supported file (images or PDF pages) */
export async function extractImages(file: File): Promise<string[]> {
  const ext = getFileExtension(file.name);

  if (IMAGE_EXTENSIONS.has(ext)) {
    const base64 = await fileToBase64(file);
    return [base64];
  }

  if (ext === '.pdf') {
    return pdfToImages(file);
  }

  throw new Error(`Bildextraktion für "${ext}" nicht unterstützt`);
}
