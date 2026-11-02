export interface User {
  id: string;
  email: string;
  name?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  provider: 'ollama' | 'openai';
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  email?: string;
  user_id?: string;
  success?: boolean;
}

export interface AiModel {
  id: string;
  name: string;
  provider?: string;
  description?: string;
  category?: string;
  is_free?: boolean;
  supports_images?: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  filename: string;
  snippet: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
  user_edited: boolean;
  citations: Citation[];
}
