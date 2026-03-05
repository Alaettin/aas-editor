import { describe, it, expect } from 'vitest';

// Since server.js requires env vars and Supabase, we test the isolated logic.
// We extract and test: makeError, cursor encoding/decoding, Base64 ID decoding.

describe('makeError', () => {
  // Replicate the makeError function from server.js
  function makeError(code, text) {
    return {
      messages: [{
        messageType: 'Error',
        text,
        code: String(code),
        timestamp: new Date().toISOString(),
      }],
    };
  }

  it('returns AAS V3 error format', () => {
    const err = makeError(404, 'Not found');

    expect(err.messages).toHaveLength(1);
    expect(err.messages[0].messageType).toBe('Error');
    expect(err.messages[0].text).toBe('Not found');
    expect(err.messages[0].code).toBe('404');
  });

  it('converts code to string', () => {
    const err = makeError(500, 'Internal error');
    expect(err.messages[0].code).toBe('500');
  });

  it('includes ISO timestamp', () => {
    const err = makeError(400, 'Bad request');
    expect(err.messages[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('cursor encoding/decoding', () => {
  it('encodes cursor as Base64 JSON', () => {
    const cursor = Buffer.from(JSON.stringify({ offset: 100, total: 500 })).toString('base64');
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));

    expect(decoded.offset).toBe(100);
    expect(decoded.total).toBe(500);
  });

  it('handles offset 0', () => {
    const cursor = Buffer.from(JSON.stringify({ offset: 0, total: 10 })).toString('base64');
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    expect(decoded.offset).toBe(0);
  });

  it('returns empty string cursor when no more pages', () => {
    const offset = 90;
    const limit = 100;
    const total = 50;
    const hasMore = offset + limit < total;

    expect(hasMore).toBe(false);
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ offset: offset + limit, total })).toString('base64')
      : '';
    expect(nextCursor).toBe('');
  });

  it('returns cursor when more pages exist', () => {
    const offset = 0;
    const limit = 10;
    const total = 50;
    const hasMore = offset + limit < total;

    expect(hasMore).toBe(true);
    const nextCursor = Buffer.from(JSON.stringify({ offset: offset + limit, total })).toString('base64');
    expect(nextCursor).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(nextCursor, 'base64').toString('utf-8'));
    expect(decoded.offset).toBe(10);
  });
});

describe('Base64 ID decoding', () => {
  it('decodes Base64-encoded AAS ID', () => {
    const original = 'urn:example:aas:motor:1';
    const encoded = Buffer.from(original).toString('base64');
    const decoded = Buffer.from(decodeURIComponent(encoded), 'base64').toString('utf-8');

    expect(decoded).toBe(original);
  });

  it('handles special characters in IDs', () => {
    const original = 'https://example.com/aas/1234?type=motor&version=2';
    const encoded = Buffer.from(original).toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

    expect(decoded).toBe(original);
  });

  it('handles German umlauts in IDs', () => {
    const original = 'urn:aas:Prüfgerät:ö:ü';
    const encoded = Buffer.from(original).toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

    expect(decoded).toBe(original);
  });

  it('handles empty string', () => {
    const encoded = Buffer.from('').toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    expect(decoded).toBe('');
  });
});

describe('UUID validation', () => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it('accepts valid UUID', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(UUID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects non-UUID string', () => {
    expect(UUID_RE.test('not-a-uuid')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(UUID_RE.test('')).toBe(false);
  });
});

describe('decodeBase64Id', () => {
  function decodeBase64Id(encoded) {
    const decoded = Buffer.from(decodeURIComponent(encoded), 'base64').toString('utf-8');
    if (decoded.length > 500) throw new Error('ID zu lang');
    return decoded;
  }

  it('decodes normal ID', () => {
    const original = 'urn:example:aas:1';
    const encoded = Buffer.from(original).toString('base64');
    expect(decodeBase64Id(encoded)).toBe(original);
  });

  it('throws for oversized ID', () => {
    const long = 'x'.repeat(501);
    const encoded = Buffer.from(long).toString('base64');
    expect(() => decodeBase64Id(encoded)).toThrow('ID zu lang');
  });
});

describe('limit calculation', () => {
  it('caps limit at 1000', () => {
    const limit = Math.min(parseInt('9999') || 100, 1000);
    expect(limit).toBe(1000);
  });

  it('defaults to 100 when not provided', () => {
    const limit = Math.min(parseInt(undefined) || 100, 1000);
    expect(limit).toBe(100);
  });

  it('uses provided limit when within range', () => {
    const limit = Math.min(parseInt('50') || 100, 1000);
    expect(limit).toBe(50);
  });

  it('defaults to 100 for invalid input', () => {
    const limit = Math.min(parseInt('abc') || 100, 1000);
    expect(limit).toBe(100);
  });
});
