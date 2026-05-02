// AI Provider abstraction layer
// Supports: OpenRouter, OpenAI, Gemini, Anthropic
// Uses adapter pattern for easy extension

import type { AIProviderMessage, StreamCallbacks } from '../../types/index.js';

/** Base interface all AI providers must implement */
export interface AIProvider {
  readonly name: string;

  /** Stream a chat completion response */
  streamChat(
    messages: AIProviderMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void>;

  /** Check if this provider supports vision/image input */
  supportsVision(): boolean;
}

/** Provider configuration */
export interface ProviderConfig {
  apiKey: string;
  model: string;
  /** Optional base URL override */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
}
