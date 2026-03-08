import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/dataUrl', () => ({
  dataUrlToBase64: vi.fn((url: string) => url.split(',')[1] || url),
  getMimeType: vi.fn(() => 'image/png'),
}));

import { generateAas } from '../generateAas';

const validAasJson = JSON.stringify({
  aas: { idShort: 'AAS_SX100', id: 'urn:example:aas:sx100', modelType: 'AssetAdministrationShell',
    assetInformation: { assetKind: 'Type', globalAssetId: 'urn:example:asset:sx100' },
    description: [{ language: 'de', text: 'Sensor X' }] },
  submodel: { idShort: 'TechnicalData', id: 'urn:example:sm:td',
    submodelElements: [{ idShort: 'Weight', modelType: 'Property', valueType: 'xs:double', value: '27.7' }] },
  metadata: { extractedProperties: 1, skippedItems: [], confidence: 0.9, warnings: [] },
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('generateAas', () => {
  describe('OpenAI provider', () => {
    const opts = { provider: 'openai' as const, model: 'gpt-4o', apiKey: 'key' };

    it('returns JSON from non-streaming response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: validAasJson } }],
          usage: { total_tokens: 500 },
        }),
      }));

      const result = await generateAas('document text', opts);
      expect(JSON.parse(result.json).aas.idShort).toBe('AAS_SX100');
      expect(result.tokensUsed).toBe(500);
    });

    it('throws on 401', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'bad key' } }),
      }));

      await expect(generateAas('text', opts)).rejects.toThrow('Ungueltiger API-Key');
    });

    it('throws on 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      }));

      await expect(generateAas('text', opts)).rejects.toThrow('Rate Limit');
    });

    it('throws on empty response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
      }));

      await expect(generateAas('text', opts)).rejects.toThrow('Leere AI-Antwort');
    });

    it('handles streaming response', async () => {
      const chunks = [
        `data: ${JSON.stringify({ choices: [{ delta: { content: validAasJson } }], usage: { total_tokens: 300 } })}\n\n`,
        'data: [DONE]\n\n',
      ];

      const encoder = new TextEncoder();
      let chunkIdx = 0;
      const mockStream = {
        getReader: () => ({
          read: () => {
            if (chunkIdx < chunks.length) {
              return Promise.resolve({ done: false, value: encoder.encode(chunks[chunkIdx++]) });
            }
            return Promise.resolve({ done: true, value: undefined });
          },
        }),
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      }));

      const onChunk = vi.fn();
      const result = await generateAas('text', opts, { onChunk });
      expect(onChunk).toHaveBeenCalled();
      expect(JSON.parse(result.json)).toBeDefined();
    });

    it('handles images in request', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: validAasJson } }],
          usage: { total_tokens: 600 },
        }),
      }));

      const result = await generateAas('', { ...opts, images: ['data:image/png;base64,abc'] });
      expect(JSON.parse(result.json).aas.idShort).toBe('AAS_SX100');

      // Verify fetch was called with image content
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]!.body as string);
      expect(body.messages[1].content).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'image_url' }),
      ]));
    });
  });

  describe('Gemini provider', () => {
    const opts = { provider: 'gemini' as const, model: 'gemini-2.5-flash', apiKey: 'key' };

    it('returns JSON from non-streaming response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: validAasJson }] } }],
          usageMetadata: { totalTokenCount: 400 },
        }),
      }));

      const result = await generateAas('document text', opts);
      expect(JSON.parse(result.json).aas.idShort).toBe('AAS_SX100');
      expect(result.tokensUsed).toBe(400);
    });

    it('throws on 400 API key error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'API key not valid' } }),
      }));

      await expect(generateAas('text', opts)).rejects.toThrow('Ungueltiger API-Key');
    });

    it('throws on 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      }));

      await expect(generateAas('text', opts)).rejects.toThrow('Rate Limit');
    });

    it('throws on empty response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: '' }] } }] }),
      }));

      await expect(generateAas('text', opts)).rejects.toThrow('Leere AI-Antwort');
    });

    it('handles streaming response', async () => {
      const chunks = [
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: validAasJson }] } }], usageMetadata: { totalTokenCount: 350 } })}\n\n`,
      ];

      const encoder = new TextEncoder();
      let chunkIdx = 0;
      const mockStream = {
        getReader: () => ({
          read: () => {
            if (chunkIdx < chunks.length) {
              return Promise.resolve({ done: false, value: encoder.encode(chunks[chunkIdx++]) });
            }
            return Promise.resolve({ done: true, value: undefined });
          },
        }),
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      }));

      const onChunk = vi.fn();
      const result = await generateAas('text', opts, { onChunk });
      expect(onChunk).toHaveBeenCalled();
      expect(result.tokensUsed).toBe(350);
    });
  });

  describe('mapping mode', () => {
    it('uses mapping system prompt when schemas provided', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: validAasJson } }],
          usage: { total_tokens: 500 },
        }),
      }));

      const opts = {
        provider: 'openai' as const,
        model: 'gpt-4o',
        apiKey: 'key',
        mappingSchemas: [{ idShort: 'TechnicalData', submodelElements: [] }],
      };

      await generateAas('text', opts);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]!.body as string);
      expect(body.messages[0].content).toContain('Ziel-Submodel-Strukturen');
    });
  });
});
