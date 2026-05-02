// AI Provider Factory
// Creates the correct provider based on AI_PROVIDER env var

import type { AIProvider } from './base.js';
import { OpenRouterProvider } from './openrouter.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/index.js';

export type { AIProvider } from './base.js';

/** Create AI provider from config */
export function createAIProvider(): AIProvider {
  const { provider, apiKey, model } = config.ai;

  logger.info(`🤖 Initializing AI provider: ${provider} (model: ${model})`);

  switch (provider) {
    case 'openrouter':
      return new OpenRouterProvider({ apiKey, model });

    case 'openai':
      return new OpenAIProvider({ apiKey, model });

    case 'anthropic':
      return new AnthropicProvider({ apiKey, model });

    case 'gemini':
      return new GeminiProvider({ apiKey, model });

    default:
      throw new Error(
        `❌ Unsupported AI provider: "${provider}". ` +
        `Supported: openrouter, openai, anthropic, gemini`
      );
  }
}

// Singleton provider instance
let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_provider) {
    _provider = createAIProvider();
  }
  return _provider;
}
