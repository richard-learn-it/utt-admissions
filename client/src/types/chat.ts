export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: string[]; // base64 data URIs
  sources?: SearchSource[];
  isStreaming?: boolean;
}

export interface SearchSource {
  title: string;
  link: string;
  snippet: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
}
