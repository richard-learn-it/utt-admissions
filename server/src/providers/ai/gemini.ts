// Google Gemini Provider via OpenAI-compatible API
import type { AIProvider, ProviderConfig } from './base.js';
import type { AIProviderMessage, StreamCallbacks } from '../../types/index.js';
import { logger } from '../../utils/index.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || GEMINI_BASE_URL,
      timeout: config.timeout || 60000,
    };
  }

  supportsVision(): boolean {
    // Most Gemini models support vision
    return true;
  }

  async streamChat(
    messages: AIProviderMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    // Using OpenAI-compatible endpoint
    const url = `${this.config.baseUrl}/chat/completions`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        logger.error(`Gemini API error ${response.status}: ${errorText}`);
        callbacks.onError(`Lỗi từ Gemini: ${response.status}`);
        return;
      }

      if (!response.body) {
        callbacks.onError('Không nhận được phản hồi từ Gemini.');
        return;
      }

      // @ts-expect-error Node.js stream compatibility
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
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) callbacks.onDelta(content);
          } catch { /* partial */ }
        }
      }

      callbacks.onDone();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        callbacks.onDone();
        return;
      }
      logger.error('Gemini stream error:', err);
      callbacks.onError(err instanceof Error ? err.message : 'Lỗi kết nối Gemini');
    }
  }
}
