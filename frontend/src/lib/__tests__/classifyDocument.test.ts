import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock browser APIs and dependencies
vi.mock('../extractText', () => ({
  pdfToImages: vi.fn().mockResolvedValue(['data:image/png;base64,abc']),
  fileToBase64: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
  getFileExtension: vi.fn((name: string) => {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx).toLowerCase() : '';
  }),
  isImageFile: vi.fn((name: string) => ['.png', '.jpg', '.jpeg', '.webp'].some((e) => name.toLowerCase().endsWith(e))),
  extractText: vi.fn().mockResolvedValue('sample text'),
}));

vi.mock('../../utils/dataUrl', () => ({
  dataUrlToBase64: vi.fn((url: string) => url.split(',')[1] || url),
  getMimeType: vi.fn(() => 'image/png'),
}));

import { classifyDocument } from '../classifyDocument';

const mockClassification = {
  documentType: 'technical_datasheet',
  productName: 'Sensor X',
  productId: 'SX-100',
  manufacturer: 'Bosch',
  productCategory: 'Sensor',
  language: 'de',
  pageCount: 2,
  confidence: 0.9,
};

function mockFetchSuccess(data: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  }));
}

function mockFetchError(status: number, error?: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(error ?? {}),
  }));
}

const baseOpts = { provider: 'openai' as const, model: 'gpt-4o', apiKey: 'test-key' };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('classifyDocument', () => {
  describe('OpenAI vision (PDF)', () => {
    it('classifies a PDF successfully', async () => {
      mockFetchSuccess({
        choices: [{ message: { content: JSON.stringify(mockClassification) } }],
      });

      const file = new File(['pdf content'], 'doc.pdf', { type: 'application/pdf' });
      const result = await classifyDocument(file, baseOpts);
      expect(result.productName).toBe('Sensor X');
      expect(result.documentType).toBe('technical_datasheet');
    });

    it('throws on 401 with error message from API', async () => {
      mockFetchError(401, { error: { message: 'Invalid API key' } });

      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      await expect(classifyDocument(file, baseOpts)).rejects.toThrow('Invalid API key');
    });

    it('throws on 429 with fallback message', async () => {
      mockFetchError(429);

      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      await expect(classifyDocument(file, baseOpts)).rejects.toThrow('Classification fehlgeschlagen (429)');
    });
  });

  describe('OpenAI text (DOCX)', () => {
    it('classifies text-based document', async () => {
      mockFetchSuccess({
        choices: [{ message: { content: JSON.stringify(mockClassification) } }],
      });

      const file = new File(['docx content'], 'spec.docx', { type: 'application/docx' });
      const result = await classifyDocument(file, baseOpts);
      expect(result.manufacturer).toBe('Bosch');
    });
  });

  describe('OpenAI vision (image)', () => {
    it('classifies an image file', async () => {
      mockFetchSuccess({
        choices: [{ message: { content: JSON.stringify(mockClassification) } }],
      });

      const file = new File(['img'], 'nameplate.png', { type: 'image/png' });
      const result = await classifyDocument(file, baseOpts);
      expect(result.productId).toBe('SX-100');
    });
  });

  describe('Gemini vision', () => {
    const geminiOpts = { provider: 'gemini' as const, model: 'gemini-2.5-flash', apiKey: 'test-key' };

    it('classifies a PDF successfully', async () => {
      mockFetchSuccess({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockClassification) }] } }],
      });

      const file = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      const result = await classifyDocument(file, geminiOpts);
      expect(result.productName).toBe('Sensor X');
    });

    it('throws on 400 with API error message', async () => {
      mockFetchError(400, { error: { message: 'API key not valid' } });

      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      await expect(classifyDocument(file, geminiOpts)).rejects.toThrow('API key not valid');
    });

    it('throws on 429 with fallback message', async () => {
      mockFetchError(429);

      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      await expect(classifyDocument(file, geminiOpts)).rejects.toThrow('Classification fehlgeschlagen (429)');
    });

    it('throws on empty response', async () => {
      mockFetchSuccess({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      });

      const file = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      await expect(classifyDocument(file, geminiOpts)).rejects.toThrow();
    });
  });

  describe('Gemini text', () => {
    const geminiOpts = { provider: 'gemini' as const, model: 'gemini-2.5-flash', apiKey: 'test-key' };

    it('classifies a text document', async () => {
      mockFetchSuccess({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockClassification) }] } }],
      });

      const file = new File(['text'], 'spec.txt', { type: 'text/plain' });
      const result = await classifyDocument(file, geminiOpts);
      expect(result.language).toBe('de');
    });
  });
});
