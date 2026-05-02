// Chat service - Core business logic for chat processing
// Handles: message preparation, search integration, streaming

import type { ChatMessageInput, AIProviderMessage, SearchSource } from '../../types/index.js';
import { getAIProvider } from '../../providers/ai/index.js';
import { shouldSearch, searchWeb, formatSearchContext } from '../search/searchService.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { logger, isValidImageDataURI } from '../../utils/index.js';

interface ChatStreamWriter {
  write: (chunk: string) => void;
  end: () => void;
}

interface ChatStreamOptions {
  messages: ChatMessageInput[];
  memoryContext?: string;  // Long-term memory context from client
  res: ChatStreamWriter;
  signal?: AbortSignal;
}

/**
 * Process a chat request:
 * 1. Analyze the latest user message
 * 2. Search web if needed for verification
 * 3. Build prompt with context
 * 4. Stream AI response via SSE
 */
export async function processChatStream({ messages, memoryContext, res, signal }: ChatStreamOptions): Promise<void> {
  const provider = getAIProvider();
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    res.write(`data: ${JSON.stringify({ error: 'Không tìm thấy tin nhắn người dùng.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  let sources: SearchSource[] = [];

  // Step 1: Check if we need to search for verification
  if (shouldSearch(lastUserMessage.content)) {
    logger.info('🔍 Searching web for context...');
    sources = await searchWeb(lastUserMessage.content);
  }

  // Step 2: Build AI messages with system prompt and search context
  const aiMessages: AIProviderMessage[] = [];

  // System prompt
  let systemContent = buildSystemPrompt();

  // Inject memory context (long-term memory from client)
  if (memoryContext && memoryContext.trim()) {
    systemContent += memoryContext;
    logger.info('🧠 Memory context injected into system prompt');
  }

  if (sources.length > 0) {
    systemContent += formatSearchContext(sources);
  }
  aiMessages.push({ role: 'system', content: systemContent });

  // Chat history
  for (const msg of messages) {
    const hasImages = msg.images && msg.images.length > 0;

    if (hasImages && provider.supportsVision()) {
      // Build multimodal content
      const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: msg.content || 'Hãy xem ảnh này.' },
      ];

      for (const imgUri of msg.images!) {
        if (isValidImageDataURI(imgUri)) {
          contentParts.push({
            type: 'image_url',
            image_url: { url: imgUri },
          });
        }
      }

      aiMessages.push({
        role: msg.role,
        content: contentParts as any,
      });
    } else if (hasImages && !provider.supportsVision()) {
      // Fallback: notify user that vision isn't supported
      aiMessages.push({
        role: msg.role,
        content: msg.content + '\n\n[Người dùng đã gửi ảnh, nhưng model hiện tại chưa hỗ trợ xử lý hình ảnh]',
      });
    } else {
      aiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Step 3: Send sources to client first
  if (sources.length > 0) {
    res.write(`event: sources\ndata: ${JSON.stringify({ sources })}\n\n`);
  }

  // Step 4: Stream AI response
  await provider.streamChat(
    aiMessages,
    {
      onDelta: (text: string) => {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
      },
      onDone: () => {
        res.write('data: [DONE]\n\n');
        res.end();
      },
      onError: (error: string) => {
        logger.error('Chat stream error:', error);
        res.write(`data: ${JSON.stringify({ error })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
    },
    signal
  );
}
