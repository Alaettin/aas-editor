import { create } from 'zustand';

export type AiProvider = 'openai' | 'gemini';

export const PROVIDER_MODELS: Record<AiProvider, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
};

interface AiState {
  enabled: boolean;
  imageAnalysis: boolean;
  provider: AiProvider;
  model: string;
  apiKey: string;
}

interface AiActions {
  setEnabled: (enabled: boolean) => void;
  setImageAnalysis: (imageAnalysis: boolean) => void;
  setProvider: (provider: AiProvider) => void;
  setModel: (model: string) => void;
  setApiKey: (apiKey: string) => void;
}

const STORAGE_KEY = 'aas-editor-ai-settings';

function loadSettings(): AiState {
  try {
    // Migrate from localStorage to sessionStorage (one-time)
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy) {
      sessionStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(STORAGE_KEY);
    }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const provider: AiProvider = parsed.provider ?? 'openai';
      const validModels = PROVIDER_MODELS[provider].map((m) => m.value);
      const model = validModels.includes(parsed.model) ? parsed.model : validModels[0];
      return {
        enabled: parsed.enabled ?? false,
        imageAnalysis: parsed.imageAnalysis ?? true,
        provider,
        model,
        apiKey: parsed.apiKey ?? '',
      };
    }
  } catch { /* ignore */ }
  return { enabled: false, imageAnalysis: true, provider: 'openai', model: 'gpt-4o-mini', apiKey: '' };
}

function persist(state: AiState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useAiStore = create<AiState & AiActions>((set, get) => ({
  ...loadSettings(),

  setEnabled: (enabled) => {
    set({ enabled });
    persist({ ...get(), enabled });
  },

  setImageAnalysis: (imageAnalysis) => {
    set({ imageAnalysis });
    persist({ ...get(), imageAnalysis });
  },

  setProvider: (provider) => {
    const model = PROVIDER_MODELS[provider][0].value;
    set({ provider, model });
    persist({ ...get(), provider, model });
  },

  setModel: (model) => {
    set({ model });
    persist({ ...get(), model });
  },

  setApiKey: (apiKey) => {
    set({ apiKey });
    persist({ ...get(), apiKey });
  },
}));
