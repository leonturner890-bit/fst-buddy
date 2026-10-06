import { Router } from 'express';
import db from '../db.js';
import { getAllSettings, updateSettings } from '../services/settingsService.js';
import { SETTINGS_META } from '../config/defaultSettings.js';
import { estimateCostUsd } from '../services/costEstimator.js';
import { setTier } from '../services/ledgerService.js';
import { listNoteFiles, readNoteFile, writeNoteFile, deleteNoteFile } from '../services/rag.js';

export const adminRouter = Router();

function requireAdmin(req, res, next) {
  const token = (req.header('authorization') || '').replace(/^Bearer\s+/i, '');
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

adminRouter.use(requireAdmin);

// ---- Settings ---------------------------------------------------------
adminRouter.get('/admin/settings', (req, res) => {
  res.json({ values: getAllSettings(), meta: SETTINGS_META });
});

adminRouter.put('/admin/settings', (req, res) => {
  const applied = updateSettings(req.body || {});
  res.json({ applied, values: getAllSettings() });
});

// ---- Metrics (Phase 3 — kept intentionally simple to start) -----------
adminRouter.get('/admin/metrics', (req, res) => {
  const dau = db
    .prepare(`
      SELECT day, COUNT(DISTINCT user_id) AS active_users
      FROM usage_daily
      WHERE day >= date('now', '-13 days')
      GROUP BY day ORDER BY day ASC
    `)
    .all();

  const totals = db.prepare('SELECT COUNT(*) AS total_users FROM users').get();
  const subscribers = db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE tier = 'subscriber'")
    .get();

  const dailyLimitRow = db.prepare("SELECT value FROM settings WHERE key = 'daily_free_limit'").get();
  const dailyLimit = Number(dailyLimitRow?.value || 10);

  const hitLimit = db
    .prepare('SELECT COUNT(DISTINCT user_id) AS n FROM usage_daily WHERE questions_used >= ?')
    .get(dailyLimit);
  const unlocked = db
    .prepare('SELECT COUNT(DISTINCT user_id) AS n FROM usage_daily WHERE ad_unlocks_used > 0')
    .get();

  const adUnlockRate = hitLimit.n > 0 ? unlocked.n / hitLimit.n : null;
  const conversionRate = totals.total_users > 0 ? subscribers.n / totals.total_users : null;

  const costRows = db
    .prepare(`
      SELECT date(created_at) AS day, model_used, input_tokens, output_tokens
      FROM messages
      WHERE role = 'assistant' AND created_at >= datetime('now', '-13 days')
    `)
    .all();
  const costByDay = {};
  for (const row of costRows) {
    const cost = estimateCostUsd(row.model_used, row.input_tokens, row.output_tokens);
    costByDay[row.day] = (costByDay[row.day] || 0) + cost;
  }

  res.json({
    dailyActiveUsers: dau,
    totalUsers: totals.total_users,
    subscribers: subscribers.n,
    subscriptionConversionRate: conversionRate,
    usersWhoHitDailyLimit: hitLimit.n,
    usersWhoUsedAdUnlock: unlocked.n,
    adUnlockRate,
    estimatedCostByDayUsd: costByDay,
  });
});

// ---- Users (lightweight list, no analytics dashboard yet) -------------
adminRouter.get('/admin/users', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, tier, created_at, last_seen_at FROM users ORDER BY last_seen_at DESC LIMIT 200'
    )
    .all();
  res.json(rows);
});

// Manual tier override — useful for demoing/testing the subscriber path
// without a payment processor wired up yet. A real deployment should set
// tier from a Stripe (or similar) webhook instead — see
// server/src/services/subscriptions.stripe-example.js.
adminRouter.put('/admin/users/:id/tier', (req, res) => {
  const { tier, expiresAt } = req.body || {};
  if (!['free', 'subscriber'].includes(tier)) {
    return res.status(400).json({ error: 'bad_request', message: "tier must be 'free' or 'subscriber'." });
  }
  const usage = setTier(req.params.id, tier, expiresAt || null);
  res.json(usage);
});

// ---- Notes corpus (RAG grounding source) -------------------------------
// Every write/delete re-indexes the FTS table immediately (see rag.js),
// so an edit is live for the very next chat message.

adminRouter.get('/admin/notes', (req, res) => {
  res.json(listNoteFiles());
});

adminRouter.get('/admin/notes/:slug', (req, res) => {
  try {
    const content = readNoteFile(req.params.slug);
    if (content === null) return res.status(404).json({ error: 'not_found' });
    res.json({ slug: req.params.slug, content });
  } catch (err) {
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

adminRouter.put('/admin/notes/:slug', (req, res) => {
  const { content } = req.body || {};
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'bad_request', message: 'content is required.' });
  }
  try {
    const result = writeNoteFile(req.params.slug, content);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

adminRouter.delete('/admin/notes/:slug', (req, res) => {
  try {
    const result = deleteNoteFile(req.params.slug);
    if (!result.deleted) return res.status(404).json({ error: 'not_found' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});
