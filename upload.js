import { Router } from 'express';
import multer from 'multer';
import { getBoolSetting } from '../services/settingsService.js';

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// POST /api/upload — accepts a single document or image. Documents are
// parsed to plain text server-side; images are returned as base64 so the
// client can attach them to the next /api/chat call (the vision model
// reads them directly, no separate captioning step needed).
uploadRouter.post('/upload', upload.single('file'), async (req, res) => {
  if (!getBoolSetting('uploads_enabled')) {
    return res.status(400).json({ error: 'uploads_disabled' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'bad_request', message: 'No file received.' });
  }

  const { mimetype, buffer, originalname } = req.file;

  try {
    if (mimetype === 'application/pdf') {
      const { default: pdfParse } = await import('pdf-parse');
      const parsed = await pdfParse(buffer);
      return res.json({ kind: 'text', filename: originalname, text: parsed.text.slice(0, 20000) });
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const mammoth = await import('mammoth');
      const { value } = await mammoth.extractRawText({ buffer });
      return res.json({ kind: 'text', filename: originalname, text: value.slice(0, 20000) });
    }

    if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
      return res.json({ kind: 'text', filename: originalname, text: buffer.toString('utf8').slice(0, 20000) });
    }

    if (mimetype.startsWith('image/')) {
      return res.json({
        kind: 'image',
        filename: originalname,
        mediaType: mimetype,
        base64: buffer.toString('base64'),
      });
    }

    return res.status(415).json({ error: 'unsupported_type', message: `Unsupported file type: ${mimetype}` });
  } catch (err) {
    return res.status(500).json({ error: 'parse_failed', message: err.message });
  }
});
