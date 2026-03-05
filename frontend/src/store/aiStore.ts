import { create } from 'zustand';

export type AiProvider = 'openai' | 'gemini';

export const PROVIDER_MODELS: Record<AiProvider, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? false,
        imageAnalysis: parsed.imageAnalysis ?? true,
        provider: parsed.provider ?? 'openai',
        model: parsed.model ?? 'gpt-4o-mini',
        apiKey: parsed.apiKey ?? '',
      };
    }
  } catch { /* ignore */ }
  return { enabled: false, imageAnalysis: true, provider: 'openai', model: 'gpt-4o-mini', apiKey: '' };
}

function persist(state: AiState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
