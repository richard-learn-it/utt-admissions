import { ChatState, Conversation, ChatMessage } from '@/types/chat';

const STORAGE_KEY = 'utt-chatbot-history';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function loadState(): ChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { conversations: [], activeConversationId: null };
}

function saveState(state: ChatState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function getConversations(): Conversation[] {
  return loadState().conversations.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getActiveConversationId(): string | null {
  return loadState().activeConversationId;
}

export function setActiveConversationId(id: string | null): void {
  const state = loadState();
  state.activeConversationId = id;
  saveState(state);
}

export function getConversation(id: string): Conversation | undefined {
  return loadState().conversations.find(c => c.id === id);
}

export function createConversation(): Conversation {
  const state = loadState();
  const conv: Conversation = {
    id: generateId(),
    title: 'Cuộc hội thoại mới',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.conversations.unshift(conv);
  state.activeConversationId = conv.id;
  saveState(state);
  return conv;
}

export function addMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const state = loadState();
  const conv = state.conversations.find(c => c.id === conversationId);
  if (!conv) throw new Error('Conversation not found');

  const msg: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: Date.now(),
  };
  conv.messages.push(msg);
  conv.updatedAt = Date.now();

  // Auto-title from first user message
  if (conv.messages.filter(m => m.role === 'user').length === 1 && message.role === 'user') {
    conv.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
  }

  saveState(state);
  return msg;
}

export function updateMessage(conversationId: string, messageId: string, updates: Partial<ChatMessage>): void {
  const state = loadState();
  const conv = state.conversations.find(c => c.id === conversationId);
  if (!conv) return;
  const msg = conv.messages.find(m => m.id === messageId);
  if (!msg) return;
  Object.assign(msg, updates);
  conv.updatedAt = Date.now();
  saveState(state);
}

export function deleteConversation(id: string): void {
  const state = loadState();
  state.conversations = state.conversations.filter(c => c.id !== id);
  if (state.activeConversationId === id) {
    state.activeConversationId = state.conversations[0]?.id ?? null;
  }
  saveState(state);
}

export function clearAllConversations(): void {
  saveState({ conversations: [], activeConversationId: null });
}
