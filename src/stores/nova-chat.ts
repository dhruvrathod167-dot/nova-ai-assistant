import { create } from 'zustand';
import { AiModel, Conversation, Message, UserSettings } from '@/types/nova';
import { useAuthStore } from '@/stores/nova-auth';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  models: AiModel[];
  defaultModel: string | null;
  settings: UserSettings | null;
  isGenerating: boolean;
  isUploading: boolean;
  searchQuery: string;
  uploadedFiles: { id: string; filename: string }[];
  abortController: AbortController | null;

  setSearchQuery: (query: string) => void;
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string | null) => Promise<void>;
  createConversation: (title?: string) => Promise<string | null>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  uploadFile: (file: File) => Promise<boolean>;
  removeUploadedFile: (id: string) => void;
  fetchSettings: () => Promise<void>;
  updateSettings: (settingsPatch: Partial<UserSettings>) => Promise<void>;
  fetchModels: () => Promise<void>;
}

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

function authHeaders(token: string, json = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  models: [],
  defaultModel: null,
  settings: null,
  isGenerating: false,
  isUploading: false,
  searchQuery: '',
  uploadedFiles: [],
  abortController: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchConversations: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations`, {
        headers: authHeaders(token),
      });
      if (response.ok) {
        const conversations = await response.json();
        set({ conversations: Array.isArray(conversations) ? conversations : [] });
      } else {
        console.error('Failed to fetch conversations:', response.status);
        set({ conversations: [] });
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      set({ conversations: [] });
    }
  },

  selectConversation: async (id) => {
    set({ currentConversationId: id, messages: [], uploadedFiles: [] });
    if (id === null) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await fetch(
        `${getApiUrl()}/api/conversations/${id}/messages`,
        { headers: authHeaders(token) }
      );
      if (response.ok) {
        const messages = await response.json();
        set({ messages: Array.isArray(messages) ? messages : [] });
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  },

  createConversation: async (title) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Authentication required. Please sign in to use NOVA AI.');
    }
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations`, {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify({ title: title || 'New Chat' }),
      });
      if (response.ok) {
        const newConv = await response.json();
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          currentConversationId: newConv.id,
          messages: [],
          uploadedFiles: [],
        }));
        return newConv.id;
      }
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
    return null;
  },

  renameConversation: async (id, title) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations/${id}`, {
        method: 'PATCH',
        headers: authHeaders(token, true),
        body: JSON.stringify({ title }),
      });
      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? updated : c
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to rename conversation', err);
    }
  },

  deleteConversation: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      if (response.ok) {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          const nextActive =
            state.currentConversationId === id
              ? filtered.length > 0
                ? filtered[0].id
                : null
              : state.currentConversationId;

          return {
            conversations: filtered,
            currentConversationId: nextActive,
          };
        });

        const nextId = get().currentConversationId;
        if (nextId) {
          get().selectConversation(nextId);
        } else {
          set({ messages: [] });
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  },

  sendMessage: async (content) => {
    let convId = get().currentConversationId;
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Authentication required. Please sign in to use NOVA AI.');
    }

    if (get().isGenerating) {
      get().stopGeneration();
    }

    const controller = new AbortController();
    set({ isGenerating: true, abortController: controller });

    const clientUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      conversation_id: convId || 'temp',
      sender: 'user',
      content,
      created_at: new Date().toISOString(),
      user_edited: false,
      citations: [],
    };
    set((state) => ({ messages: [...state.messages, clientUserMessage] }));

    const clientAssistantMessage: Message = {
      id: `temp-assistant-${Date.now() + 1}`,
      conversation_id: convId || 'temp',
      sender: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      user_edited: false,
      citations: [],
    };
    set((state) => ({ messages: [...state.messages, clientAssistantMessage] }));

    try {
      const selectedModel =
        get().settings?.model || get().defaultModel || undefined;

      const requestBody: Record<string, unknown> = {
        message: content,
      };
      if (convId) requestBody.conversation_id = convId;
      if (selectedModel) requestBody.model = selectedModel;

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === clientAssistantMessage.id
            ? { ...m, content: 'Thinking...' }
            : m
        ),
      }));

      const response = await fetch(`${getApiUrl()}/api/chat`, {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errText = `HTTP error ${response.status}`;
        try {
          const errData = await response.json();
          errText = errData.detail || errData.error || errText;
        } catch {
          /* ignore */
        }
        throw new Error(errText);
      }

      const data = await response.json();
      const aiText: string =
        data.response || data.message || data.content || '';

      if (!aiText || aiText.startsWith('Thinking...')) {
        throw new Error(data.error || 'Empty response from AI provider');
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === clientAssistantMessage.id
            ? {
                ...m,
                id: data.id || data.message_id || m.id,
                conversation_id: data.conversation_id ?? m.conversation_id,
                content: aiText,
                citations: [],
              }
            : m
        ),
      }));

      if (data.conversation_id && !convId) {
        set({ currentConversationId: data.conversation_id });
        convId = data.conversation_id;
      }
      get().fetchConversations();
      set({ uploadedFiles: [] });
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'AbortError') {
        console.log('Generation aborted');
      } else {
        console.error('Chat failed:', err);
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === clientAssistantMessage.id
              ? {
                  ...m,
                  content: `⚠️ **Error:** ${error.message || 'Connection lost'}`,
                }
              : m
          ),
        }));
      }
    } finally {
      set({ isGenerating: false, abortController: null });
    }
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isGenerating: false, abortController: null });
    }
  },

  uploadFile: async (file) => {
    const token = useAuthStore.getState().token;
    if (!token) return false;

    set({ isUploading: true });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${getApiUrl()}/api/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const uploaded = await response.json();
        set((state) => ({
          uploadedFiles: [
            ...state.uploadedFiles,
            { id: String(uploaded.id), filename: uploaded.filename },
          ],
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('File upload failed', err);
      return false;
    } finally {
      set({ isUploading: false });
    }
  },

  removeUploadedFile: (id) => {
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
    }));
  },

  fetchSettings: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/settings`, {
        headers: authHeaders(token),
      });
      if (response.ok) {
        const settings = await response.json();
        set({
          settings: {
            theme: settings.theme || 'dark',
            provider: settings.provider || 'openai',
            model: settings.model || get().defaultModel || '',
            temperature: settings.temperature ?? 0.7,
            max_tokens: settings.max_tokens ?? 1000,
            system_prompt: settings.system_prompt ?? null,
            email: settings.email,
            user_id: settings.user_id,
            success: settings.success,
          },
        });
      } else {
        console.error('Failed to fetch settings:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  },

  updateSettings: async (settingsPatch) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/settings`, {
        method: 'PATCH',
        headers: authHeaders(token, true),
        body: JSON.stringify(settingsPatch),
      });
      if (response.ok) {
        const settings = await response.json();
        set({
          settings: {
            theme: settings.theme || 'dark',
            provider: settings.provider || 'openai',
            model: settings.model || get().defaultModel || '',
            temperature: settings.temperature ?? 0.7,
            max_tokens: settings.max_tokens ?? 1000,
            system_prompt: settings.system_prompt ?? null,
            email: settings.email,
            user_id: settings.user_id,
            success: settings.success,
          },
        });
      }
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  },

  fetchModels: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/settings/models`, {
        headers: authHeaders(token),
      });
      if (response.ok) {
        const data = await response.json();
        const models: AiModel[] = Array.isArray(data)
          ? data
          : Array.isArray(data.models)
            ? data.models
            : [];
        const defaultModel =
          (typeof data.defaultModel === 'string' && data.defaultModel) ||
          models[0]?.id ||
          null;

        set({ models, defaultModel });

        const currentSettings = get().settings;
        if (!currentSettings) {
          set({
            settings: {
              theme: 'dark',
              provider: 'openai',
              model: defaultModel || '',
              temperature: 0.7,
              max_tokens: 1000,
              system_prompt: null,
            },
          });
        } else if (!currentSettings.model && defaultModel) {
          set({
            settings: { ...currentSettings, model: defaultModel },
          });
        }
      } else {
        console.error('Failed to fetch models:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  },
}));
