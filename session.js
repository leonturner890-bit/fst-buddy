import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { getUsageSnapshot } from '../services/ledgerService.js';

export const sessionRouter = Router();

// GET /api/session — usage snapshot for the caller (creates the user row
// on first call). The desktop client calls this on launch to know where
// it stands before rendering the usage ring.
sessionRouter.get('/session', (req, res) => {
  res.json(getUsageSnapshot(req.userId));
});

// POST /api/conversations — start a new conversation thread.
sessionRouter.post('/conversations', (req, res) => {
  const id = nanoid();
  db.prepare('INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING').run(req.userId);
  db.prepare(
    'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)'
  ).run(id, req.userId, req.body?.title || 'New chat');
  res.json({ id });
});

// GET /api/conversations — list this user's conversations.
sessionRouter.get('/conversations', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, title, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC'
    )
    .all(req.userId);
  res.json(rows);
});

// GET /api/conversations/:id/messages
sessionRouter.get('/conversations/:id/messages', (req, res) => {
  const convo = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!convo) return res.status(404).json({ error: 'not_found' });

  const rows = db
    .prepare(
      'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    )
    .all(req.params.id);
  res.json(rows);
});
