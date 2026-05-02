import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, Conversation } from '@/types/chat';
import * as storage from '@/lib/chatStorage';
import { streamChat } from '@/services/chatService';
import {
  extractFactsFromMessage,
  addConversationSummary,
  formatMemoryForPrompt,
  extractTopics,
} from '@/lib/memoryService';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(storage.getConversations());
  const [activeId, setActiveId] = useState<string | null>(storage.getActiveConversationId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const activeConversation = conversations.find(c => c.id === activeId);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeId) {
      const conv = storage.getConversation(activeId);
      setMessages(conv?.messages ?? []);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  const refreshConversations = useCallback(() => {
    setConversations(storage.getConversations());
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    storage.setActiveConversationId(id);
    setError(null);
  }, []);

  const newConversation = useCallback(() => {
    const conv = storage.createConversation();
    setActiveId(conv.id);
    setMessages([]);
    refreshConversations();
    setError(null);
  }, [refreshConversations]);

  const deleteConversation = useCallback((id: string) => {
    storage.deleteConversation(id);
    const convs = storage.getConversations();
    setConversations(convs);
    if (activeId === id) {
      const nextId = convs[0]?.id ?? null;
      setActiveId(nextId);
      storage.setActiveConversationId(nextId);
    }
  }, [activeId]);

  const clearAll = useCallback(() => {
    storage.clearAllConversations();
    setConversations([]);
    setActiveId(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    setError(null);

    let convId = activeId;
    if (!convId) {
      const conv = storage.createConversation();
      convId = conv.id;
      setActiveId(conv.id);
      refreshConversations();
    }

    // ====== MEMORY: Extract facts from user message ======
    extractFactsFromMessage(content, convId);

    // Add user message
    const userMsg = storage.addMessage(convId, { role: 'user', content, images });
    setMessages(prev => [...prev, userMsg]);
    refreshConversations();

    // Add placeholder assistant message
    const assistantMsg = storage.addMessage(convId, { role: 'assistant', content: '', isStreaming: true });
    streamingMessageIdRef.current = assistantMsg.id;
    setMessages(prev => [...prev, { ...assistantMsg, isStreaming: true }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    // Build messages for API
    const conv = storage.getConversation(convId);
    const apiMessages = (conv?.messages ?? [])
      .filter(m => m.id !== assistantMsg.id)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        ...(m.images?.length ? { images: m.images } : {}),
      }));

    // ====== MEMORY: Build memory context for the system prompt ======
    const memoryContext = formatMemoryForPrompt();

    await streamChat({
      messages: apiMessages,
      memoryContext: memoryContext || undefined,
      onDelta: (delta) => {
        accumulated += delta;
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id ? { ...m, content: accumulated, isStreaming: true } : m)
        );
      },
      onSources: (sources) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id ? { ...m, sources } : m)
        );
        storage.updateMessage(convId!, assistantMsg.id, { sources });
      },
      onDone: () => {
        storage.updateMessage(convId!, assistantMsg.id, { content: accumulated, isStreaming: false });
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id ? { ...m, content: accumulated, isStreaming: false } : m)
        );
        setIsStreaming(false);
        streamingMessageIdRef.current = null;
        refreshConversations();

        // ====== MEMORY: Save conversation summary to LTM ======
        const finalConv = storage.getConversation(convId!);
        if (finalConv && finalConv.messages.length >= 2) {
          addConversationSummary(
            convId!,
            finalConv.messages.map(m => ({ role: m.role, content: m.content }))
          );
        }
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        storage.updateMessage(convId!, assistantMsg.id, {
          content: accumulated || 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.',
          isStreaming: false,
        });
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id
            ? { ...m, content: accumulated || 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.', isStreaming: false }
            : m
          )
        );
        setIsStreaming(false);
        streamingMessageIdRef.current = null;
      },
      signal: controller.signal,
    });
  }, [activeId, refreshConversations]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    selectConversation,
    newConversation,
    deleteConversation,
    clearAll,
  };
}
