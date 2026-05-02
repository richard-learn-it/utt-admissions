// OpenAI Provider - Direct OpenAI API integration
import type { AIProvider, ProviderConfig } from './base.js';
import type { AIProviderMessage, StreamCallbacks } from '../../types/index.js';
import { logger } from '../../utils/index.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

const VISION_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-vision-preview'];

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || OPENAI_BASE_URL,
      timeout: config.timeout || 60000,
    };
  }

  supportsVision(): boolean {
    return VISION_MODELS.some(m => this.config.model.includes(m));
  }

  async streamChat(
    messages: AIProviderMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
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
        logger.error(`OpenAI API error ${response.status}: ${errorText}`);
        callbacks.onError(`Lỗi từ OpenAI: ${response.status}`);
        return;
      }

      if (!response.body) {
        callbacks.onError('Không nhận được phản hồi từ OpenAI.');
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
      logger.error('OpenAI stream error:', err);
      callbacks.onError(err instanceof Error ? err.message : 'Lỗi kết nối OpenAI');
    }
  }
}
