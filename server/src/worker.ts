import { applyRuntimeEnv, config, getMissingRequiredEnv } from './config/index.js';
import { processChatStream } from './modules/chat/chatService.js';
import type { ChatMessageInput } from './types/index.js';
import { logger } from './utils/index.js';

type RateLimitState = {
  count: number;
  resetAt: number;
};

const encoder = new TextEncoder();
const rateLimitStore = new Map<string, RateLimitState>();
const alwaysAllowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://ngocdat.io.vn',
  'https://www.ngocdat.io.vn',
];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')?.replace(/\/$/, '');
  const configuredOrigins = Array.from(new Set([...config.corsOrigins, ...alwaysAllowedOrigins]));
  const allowAny = configuredOrigins.includes('*');
  const allowOrigin =
    origin && (allowAny || configuredOrigins.includes(origin))
      ? origin
      : configuredOrigins[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

function jsonResponse(request: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function isRateLimited(request: Request, maxRequests: number, windowMs: number): boolean {
  const key =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'global';
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > maxRequests;
}

function validateMessages(messages: unknown): messages is ChatMessageInput[] {
  if (!Array.isArray(messages) || messages.length === 0) return false;

  return messages.every((msg) => {
    if (!msg || typeof msg !== 'object') return false;
    const candidate = msg as Partial<ChatMessageInput>;
    return (
      (candidate.role === 'user' || candidate.role === 'assistant') &&
      typeof candidate.content === 'string' &&
      candidate.content.length <= 10000
    );
  });
}

async function handleChat(request: Request): Promise<Response> {
  const missingEnv = getMissingRequiredEnv();
  if (missingEnv.length > 0) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          error: `Backend is missing required environment variables: ${missingEnv.join(', ')}`,
        })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders(request),
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  if (isRateLimited(request, 30, 60 * 1000)) {
    return jsonResponse(request, { error: 'Too many requests. Please retry in 1 minute.' }, 429);
  }

  let body: { messages?: unknown; memoryContext?: unknown };
  try {
    body = await request.json() as { messages?: unknown; memoryContext?: unknown };
  } catch {
    return jsonResponse(request, { error: 'Invalid JSON.' }, 400);
  }

  if (!validateMessages(body.messages)) {
    return jsonResponse(request, { error: 'Invalid messages.' }, 400);
  }

  const messages = body.messages.slice(-20);
  const memoryContext = typeof body.memoryContext === 'string' ? body.memoryContext : undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const writer = {
        write: (chunk: string) => {
          if (!closed) controller.enqueue(encoder.encode(chunk));
        },
        end: () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        },
      };

      try {
        await processChatStream({
          messages,
          memoryContext,
          res: writer,
          signal: request.signal,
        });
      } catch (err) {
        logger.error('Worker chat error:', err);
        writer.write(`data: ${JSON.stringify({ error: 'System error. Please retry.' })}\n\n`);
        writer.write('data: [DONE]\n\n');
        writer.end();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    applyRuntimeEnv(env);

    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return jsonResponse(request, {
        status: 'ok',
        service: 'UTT Admissions Backend',
        endpoints: {
          health: '/api/health',
          chat: '/api/chat',
        },
      });
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      const missingEnv = getMissingRequiredEnv();
      if (missingEnv.length > 0) {
        return jsonResponse(request, {
          status: 'error',
          missingEnv,
          searchEnabled: config.search.enabled,
          timestamp: new Date().toISOString(),
        }, 500);
      }

      return jsonResponse(request, {
        status: 'ok',
        provider: config.ai.provider,
        model: config.ai.model,
        searchEnabled: config.search.enabled,
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request);
    }

    if (url.pathname === '/api/upload' && request.method === 'POST') {
      return jsonResponse(request, {
        error: 'Upload endpoint is not available on Cloudflare Workers. Send image data URIs in /api/chat instead.',
      }, 501);
    }

    return jsonResponse(request, { error: 'Endpoint not found.' }, 404);
  },
};
