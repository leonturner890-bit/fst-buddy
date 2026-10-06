import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import './db.js'; // creates tables + seeds settings on import
import { ingestNotes } from './services/rag.js';
import { deviceId } from './middleware/deviceId.js';
import { sessionRouter } from './routes/session.js';
import { chatRouter } from './routes/chat.js';
import { adsRouter } from './routes/ads.js';
import { uploadRouter } from './routes/upload.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', deviceId, sessionRouter);
app.use('/api', deviceId, chatRouter);
app.use('/api', deviceId, adsRouter);
app.use('/api', deviceId, uploadRouter);
app.use('/api', adminRouter); // admin routes authenticate via ADMIN_TOKEN, not device id

// ---------------------------------------------------------------------
// Serve the built frontend (desktop/dist) when it exists, so the whole
// app is one deployable service: one process, one port, one URL. Build
// it first with `npm run build` at the repo root. In local development
// this is typically absent — run `npm run dev` in desktop/ separately
// instead, which proxies /api to this server (see vite.config.js).
// ---------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'desktop', 'dist');

if (fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Central error handler — never leak stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong on the server.' });
});

const ingestResult = ingestNotes();
console.log(
  ingestResult.skipped
    ? `Notes index already populated (${ingestResult.rows} sections).`
    : `Indexed ${ingestResult.rows} note sections from ${ingestResult.files} files.`
);

console.log(
  fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))
    ? `Serving built frontend from ${FRONTEND_DIST}`
    : 'No built frontend found — run `npm run build` at the repo root for a single-service deploy, ' +
      'or run the Vite dev server in desktop/ separately for local development.'
);

const port = process.env.PORT || 4317;
app.listen(port, () => {
  console.log(`FST Buddy server listening on http://127.0.0.1:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set — online mode will fail until you add it to server/.env');
  }
});
