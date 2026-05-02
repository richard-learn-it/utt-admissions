// Server configuration - reads environment variables lazily.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const moduleUrl = (import.meta as ImportMeta & { url?: string }).url;
const moduleDir = moduleUrl ? path.dirname(fileURLToPath(moduleUrl)) : '.';

dotenv.config({ path: path.resolve(moduleDir, '../../.env') });

type AIProviderName = 'openrouter' | 'openai' | 'gemini' | 'anthropic';
type RuntimeEnv = Record<string, unknown>;
const DEFAULT_CORS_ORIGINS = 'http://localhost:8080,http://localhost:5173,https://ngocdat.io.vn,https://www.ngocdat.io.vn';

export function applyRuntimeEnv(env: RuntimeEnv = {}): void {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      process.env[key] = value;
    }
  }
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  get port() {
    return parseInt(optionalEnv('PORT', '3001'), 10);
  },
  get nodeEnv() {
    return optionalEnv('NODE_ENV', 'development');
  },
  get corsOrigins() {
    return optionalEnv('CORS_ORIGINS', DEFAULT_CORS_ORIGINS)
      .split(',')
      .map(s => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
  },

  ai: {
    get provider() {
      return requireEnv('AI_PROVIDER') as AIProviderName;
    },
    get apiKey() {
      return requireEnv('AI_API_KEY');
    },
    get model() {
      return requireEnv('AI_MODEL');
    },
  },

  search: {
    get serperApiKey() {
      return process.env.SERPER_API_KEY || '';
    },
    get enabled() {
      return !!process.env.SERPER_API_KEY;
    },
  },

  upload: {
    get maxFileSizeMB() {
      return parseInt(optionalEnv('MAX_FILE_SIZE_MB', '5'), 10);
    },
    get uploadDir() {
      return optionalEnv('UPLOAD_DIR', path.resolve(moduleDir, '../../uploads'));
    },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
} as const;

export type Config = typeof config;
