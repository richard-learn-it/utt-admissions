// Server configuration - Validates and exports all environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const moduleUrl = (import.meta as ImportMeta & { url?: string }).url;
const moduleDir = moduleUrl ? path.dirname(fileURLToPath(moduleUrl)) : '.';

dotenv.config({ path: path.resolve(moduleDir, '../../.env') });

/** Safely read an env var, throw if missing and required */
function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

// Validate critical env vars on startup
const AI_API_KEY = requireEnv('AI_API_KEY');
const AI_PROVIDER = requireEnv('AI_PROVIDER');
const AI_MODEL = requireEnv('AI_MODEL');

export const config = {
  port: parseInt(optionalEnv('PORT', '3001'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  corsOrigins: optionalEnv('CORS_ORIGINS', 'http://localhost:8080,http://localhost:5173')
    .split(',')
    .map(s => s.trim()),

  ai: {
    provider: AI_PROVIDER as 'openrouter' | 'openai' | 'gemini' | 'anthropic',
    apiKey: AI_API_KEY,
    model: AI_MODEL,
  },

  search: {
    serperApiKey: process.env.SERPER_API_KEY || '',
    enabled: !!process.env.SERPER_API_KEY,
  },

  upload: {
    maxFileSizeMB: parseInt(optionalEnv('MAX_FILE_SIZE_MB', '5'), 10),
    uploadDir: optionalEnv('UPLOAD_DIR', path.resolve(moduleDir, '../../uploads')),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
} as const;

export type Config = typeof config;
