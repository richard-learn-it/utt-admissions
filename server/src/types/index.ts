// Shared types for the server

export interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 data URIs
}

export interface SearchSource {
  title: string;
  link: string;
  snippet: string;
}

export interface SerperSearchResult {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  knowledgeGraph?: {
    title: string;
    description: string;
  };
  answerBox?: {
    snippet: string;
    title: string;
    link: string;
  };
}

export interface AIProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}

export type AIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}
