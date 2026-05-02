// Upload controller - Handle image uploads

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/index.js';
import { logger } from '../../utils/index.js';

export const uploadRouter = Router();

// Ensure upload directory exists
const uploadDir = config.upload.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if ((config.upload.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận: ${config.upload.allowedMimeTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
    files: 5, // Max 5 files per upload
  },
});

/**
 * POST /api/upload
 * Upload images for chat
 */
uploadRouter.post('/', upload.array('images', 5), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Không có file nào được upload.' });
      return;
    }

    const uploadedFiles = files.map(file => ({
      id: path.basename(file.filename, path.extname(file.filename)),
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }));

    logger.info(`📁 Uploaded ${files.length} file(s)`);

    res.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (err) {
    logger.error('Upload error:', err);
    res.status(500).json({ error: 'Lỗi khi upload file.' });
  }
});

// Multer error handler
uploadRouter.use((err: Error, _req: Request, res: Response, _next: Function) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: `File vượt quá dung lượng tối đa ${config.upload.maxFileSizeMB}MB.` });
      return;
    }
    res.status(400).json({ error: `Lỗi upload: ${err.message}` });
    return;
  }
  res.status(400).json({ error: err.message });
});
