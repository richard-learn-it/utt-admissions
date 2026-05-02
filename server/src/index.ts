// Main Express server entrypoint

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { chatRouter } from './modules/chat/chatController.js';
import { uploadRouter } from './modules/upload/uploadController.js';
import { logger } from './utils/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

function jsonBodyParser(limitBytes: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    const hasJsonBody = typeof contentType === 'string' && contentType.includes('application/json');

    if (!hasJsonBody || req.method === 'GET' || req.method === 'HEAD') {
      next();
      return;
    }

    let size = 0;
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limitBytes) {
        res.status(413).json({ error: 'Payload too large.' });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        req.body = raw.length > 0 ? JSON.parse(raw) : {};
        next();
      } catch {
        res.status(400).json({ error: 'Invalid JSON.' });
      }
    });

    req.on('error', next);
  };
}

// ─── Security ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ─── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body parsing ──────────────────────────────────────────────
app.use(jsonBodyParser(10 * 1024 * 1024));

// ─── Request logging ──────────────────────────────────────────
app.use(morgan('short'));

// ─── Rate limiting ─────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn gửi quá nhiều yêu cầu. Vui lòng chờ 1 phút.' },
});

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn upload quá nhiều file. Vui lòng chờ 1 phút.' },
});

// ─── Static files (uploaded images) ────────────────────────────
app.use('/uploads', express.static(config.upload.uploadDir));

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/chat', chatLimiter, chatRouter);
app.use('/api/upload', uploadLimiter, uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: config.ai.provider,
    model: config.ai.model,
    searchEnabled: config.search.enabled,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint không tồn tại.' });
});

// ─── Global error handler ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Lỗi hệ thống. Vui lòng thử lại.' });
});

// ─── Start server ──────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`🚀 UTT Admissions Server running on port ${config.port}`);
  logger.info(`📡 AI Provider: ${config.ai.provider} (${config.ai.model})`);
  logger.info(`🔍 Search: ${config.search.enabled ? 'enabled' : 'disabled'}`);
  logger.info(`🌐 CORS: ${config.corsOrigins.join(', ')}`);
  logger.info(`📁 Uploads: ${config.upload.uploadDir}`);
});

export default app;
