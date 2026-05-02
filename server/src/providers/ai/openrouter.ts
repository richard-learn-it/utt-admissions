// OpenRouter AI Provider
// Compatible with OpenAI-style API format
// Docs: https://openrouter.ai/docs

import type { AIProvider, ProviderConfig } from './base.js';
import type { AIProviderMessage, StreamCallbacks } from '../../types/index.js';
import { logger } from '../../utils/index.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Models known to support vision on OpenRouter
const VISION_MODELS = [
  'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-4-turbo',
  'google/gemini-pro-vision', 'google/gemini-1.5-pro', 'google/gemini-1.5-flash',
  'google/gemini-2.0-flash-exp', 'google/gemini-2.5-flash-preview',
  'google/gemini-2.5-flash',
  'anthropic/claude-3-opus', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-haiku',
  'anthropic/claude-3.5-sonnet', 'anthropic/claude-4-sonnet',
  'meta-llama/llama-3.2-90b-vision-instruct',
];

export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || OPENROUTER_BASE_URL,
      timeout: config.timeout || 60000,
    };
  }

  supportsVision(): boolean {
    return VISION_MODELS.some(m =>
      this.config.model.includes(m) || m.includes(this.config.model)
    );
  }

  async streamChat(
    messages: AIProviderMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.config.baseUrl}/chat/completions`;

    // Transform messages for the API
    const apiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      // Merge signals
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://utt.edu.vn',
          'X-Title': 'UTT Admissions Chatbot',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(`OpenRouter API error ${response.status}: ${errorText}`);

        if (response.status === 429) {
          callbacks.onError('Hệ thống đang quá tải, vui lòng thử lại sau.');
          return;
        }
        if (response.status === 402) {
          callbacks.onError('Đã hết hạn mức sử dụng AI. Vui lòng liên hệ quản trị viên.');
          return;
        }

        if (response.status === 403) {
          callbacks.onError('OpenRouter tu choi yeu cau (403). Kiem tra API key, credits va quyen truy cap model.');
          return;
        }

        callbacks.onError(`Lỗi từ AI provider: ${response.status}`);
        return;
      }

      if (!response.body) {
        callbacks.onError('Không nhận được phản hồi từ AI.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ') || line.trim() === '') continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              callbacks.onDelta(content);
            }
          } catch {
            // Partial JSON, keep in buffer
          }
        }
      }

      callbacks.onDone();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        callbacks.onDone();
        return;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        callbacks.onDone();
        return;
      }
      logger.error('OpenRouter stream error:', err);
      callbacks.onError(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    }
  }
}
