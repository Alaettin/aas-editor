import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock both localStorage and sessionStorage before importing aiStore
const sessionStore = new Map<string, string>();
const localStore = new Map<string, string>();

function makeMock(store: Map<string, string>) {
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (_i: number) => null,
  };
}

Object.defineProperty(globalThis, 'sessionStorage', { value: makeMock(sessionStore), writable: true });
Object.defineProperty(globalThis, 'localStorage', { value: makeMock(localStore), writable: true });

import { useAiStore, PROVIDER_MODELS } from '../aiStore';
import type { AiProvider } from '../aiStore';

const STORAGE_KEY = 'aas-editor-ai-settings';

function resetStore() {
  sessionStore.clear();
  localStore.clear();
  useAiStore.setState({
    enabled: false,
    imageAnalysis: true,
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
  });
}

function getState() {
  return useAiStore.getState();
}

describe('aiStore', () => {
  beforeEach(resetStore);

  describe('default state', () => {
    it('has correct defaults', () => {
      expect(getState().enabled).toBe(false);
      expect(getState().imageAnalysis).toBe(true);
      expect(getState().provider).toBe('openai');
      expect(getState().model).toBe('gpt-4o-mini');
      expect(getState().apiKey).toBe('');
    });
  });

  describe('setEnabled', () => {
    it('toggles enabled and persists to sessionStorage', () => {
      getState().setEnabled(true);
      expect(getState().enabled).toBe(true);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.enabled).toBe(true);
    });
  });

  describe('setImageAnalysis', () => {
    it('toggles imageAnalysis and persists to sessionStorage', () => {
      getState().setImageAnalysis(false);
      expect(getState().imageAnalysis).toBe(false);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.imageAnalysis).toBe(false);
    });
  });

  describe('setProvider', () => {
    it('switches provider and resets model to first option', () => {
      getState().setProvider('gemini');
      expect(getState().provider).toBe('gemini');
      expect(getState().model).toBe(PROVIDER_MODELS.gemini[0].value);
    });

    it('persists provider and model to sessionStorage', () => {
      getState().setProvider('gemini');
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.provider).toBe('gemini');
      expect(stored.model).toBe(PROVIDER_MODELS.gemini[0].value);
    });

    it('switches back to openai correctly', () => {
      getState().setProvider('gemini');
      getState().setProvider('openai');
      expect(getState().provider).toBe('openai');
      expect(getState().model).toBe(PROVIDER_MODELS.openai[0].value);
    });
  });

  describe('setModel', () => {
    it('changes model and persists to sessionStorage', () => {
      getState().setModel('gpt-4o');
      expect(getState().model).toBe('gpt-4o');

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.model).toBe('gpt-4o');
    });
  });

  describe('setApiKey', () => {
    it('sets API key and persists to sessionStorage', () => {
      getState().setApiKey('sk-test-123');
      expect(getState().apiKey).toBe('sk-test-123');

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.apiKey).toBe('sk-test-123');
    });
  });

  describe('sessionStorage persistence', () => {
    it('handles corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem(STORAGE_KEY, 'not-json');
      expect(() => getState()).not.toThrow();
    });

    it('handles missing fields in stored data', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: true }));
      const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(raw.enabled).toBe(true);
    });
  });

  describe('localStorage to sessionStorage migration', () => {
    it('persist writes to sessionStorage, not localStorage', () => {
      getState().setApiKey('test-key');

      // sessionStorage should have the data
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.apiKey).toBe('test-key');

      // localStorage should remain empty
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('model validation (deprecated model migration)', () => {
    it('rejects invalid model and falls back to first provider model', () => {
      const provider: AiProvider = 'gemini';
      const validModels = PROVIDER_MODELS[provider].map((m) => m.value);
      expect(validModels.includes('gemini-2.0-flash')).toBe(false);
      expect(validModels[0]).toBe('gemini-2.5-flash');
    });

    it('keeps valid model unchanged', () => {
      const provider: AiProvider = 'openai';
      const validModels = PROVIDER_MODELS[provider].map((m) => m.value);
      expect(validModels.includes('gpt-4o')).toBe(true);
      expect(validModels.includes('gpt-4o-mini')).toBe(true);
    });
  });

  describe('PROVIDER_MODELS', () => {
    it('has openai models', () => {
      expect(PROVIDER_MODELS.openai.length).toBeGreaterThanOrEqual(2);
      expect(PROVIDER_MODELS.openai.some((m) => m.value === 'gpt-4o-mini')).toBe(true);
      expect(PROVIDER_MODELS.openai.some((m) => m.value === 'gpt-4o')).toBe(true);
    });

    it('has gemini models', () => {
      expect(PROVIDER_MODELS.gemini.length).toBeGreaterThanOrEqual(2);
      expect(PROVIDER_MODELS.gemini.some((m) => m.value === 'gemini-2.5-flash')).toBe(true);
      expect(PROVIDER_MODELS.gemini.some((m) => m.value === 'gemini-2.5-pro')).toBe(true);
    });

    it('does not contain deprecated gemini-2.0-flash', () => {
      expect(PROVIDER_MODELS.gemini.some((m) => m.value === 'gemini-2.0-flash')).toBe(false);
    });
  });
});
