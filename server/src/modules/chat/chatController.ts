// Chat controller - Express route handlers for chat endpoints

import { Router, type Request, type Response } from 'express';
import { processChatStream } from './chatService.js';
import type { ChatMessageInput } from '../../types/index.js';
import { logger } from '../../utils/index.js';

export const chatRouter = Router();

/**
 * POST /api/chat
 * Streaming chat endpoint using SSE
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, memoryContext } = req.body as { messages?: ChatMessageInput[]; memoryContext?: string };

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Tin nhắn không hợp lệ.' });
      return;
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        res.status(400).json({ error: 'Vai trò tin nhắn không hợp lệ.' });
        return;
      }
      if (typeof msg.content !== 'string') {
        res.status(400).json({ error: 'Nội dung tin nhắn phải là chuỗi.' });
        return;
      }
      // Limit message length
      if (msg.content.length > 10000) {
        res.status(400).json({ error: 'Tin nhắn quá dài (tối đa 10.000 ký tự).' });
        return;
      }
    }

    // Limit conversation history sent to API
    const limitedMessages = messages.slice(-20);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // For nginx
    });

    // Handle client disconnect
    const abortController = new AbortController();
    req.on('close', () => {
      logger.debug('Client disconnected from chat stream');
      abortController.abort();
    });

    await processChatStream({
      messages: limitedMessages,
      memoryContext: typeof memoryContext === 'string' ? memoryContext : undefined,
      res,
      signal: abortController.signal,
    });
  } catch (err) {
    logger.error('Chat endpoint error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Lỗi hệ thống. Vui lòng thử lại.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Lỗi hệ thống' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});
