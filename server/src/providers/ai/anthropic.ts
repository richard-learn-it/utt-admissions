// Anthropic Provider - Claude API integration
import type { AIProvider, ProviderConfig } from './base.js';
import type { AIProviderMessage, StreamCallbacks } from '../../types/index.js';
import { logger } from '../../utils/index.js';

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';

const VISION_MODELS = ['claude-3', 'claude-4'];

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || ANTHROPIC_BASE_URL,
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
    const url = `${this.config.baseUrl}/messages`;

    // Extract system message
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content as string }));

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
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 2048,
          ...(systemMsg ? { system: systemMsg.content as string } : {}),
          messages: chatMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        logger.error(`Anthropic API error ${response.status}: ${errorText}`);
        callbacks.onError(`Lỗi từ Anthropic: ${response.status}`);
        return;
      }

      if (!response.body) {
        callbacks.onError('Không nhận được phản hồi từ Anthropic.');
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
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text;
              if (text) callbacks.onDelta(text);
            }
          } catch { /* partial */ }
        }
      }

      callbacks.onDone();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        callbacks.onDone();
        return;
      }
      logger.error('Anthropic stream error:', err);
      callbacks.onError(err instanceof Error ? err.message : 'Lỗi kết nối Anthropic');
    }
  }
}
