import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { checkEligibility, commitQuestion } from '../services/ledgerService.js';
import { generateReply, AiProviderError } from '../services/aiProvider.js';
import { retrieveContext, formatContextForPrompt } from '../services/rag.js';
import { getSetting, getBoolSetting } from '../services/settingsService.js';

export const chatRouter = Router();

const HISTORY_TURNS = 12; // how many recent messages to feed back as context

chatRouter.post('/chat', async (req, res) => {
  const { conversationId, message, mode = 'online', attachments = [] } = req.body || {};

  if (!conversationId || !message || typeof message !== 'string') {
    return res.status(400).json({ error: 'bad_request', message: 'conversationId and message are required.' });
  }
  if (mode === 'offline' && !getBoolSetting('offline_mode_enabled')) {
    return res.status(400).json({ error: 'offline_disabled', message: 'Offline mode is disabled by the admin.' });
  }

  const convo = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, req.userId);
  if (!convo) {
    return res.status(404).json({ error: 'conversation_not_found' });
  }

  // 1. Eligibility check — read-only, no side effects yet.
  const eligibility = checkEligibility(req.userId);
  if (!eligibility.ok) {
    return res.status(402).json({
      error: 'limit_reached',
      message: "You're out of free questions for today.",
      usage: eligibility.snapshot,
    });
  }

  // 2. Pull recent history for context.
  const historyRows = db
    .prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .all(conversationId, HISTORY_TURNS)
    .reverse();
  const history = [...historyRows, { role: 'user', content: message }];

  // 3. Ground the answer in the notes corpus.
  const passages = retrieveContext(message, 3);
  const contextBlock = formatContextForPrompt(passages);
  const systemPrompt = contextBlock
    ? `${getSetting('system_prompt')}\n\n${contextBlock}`
    : getSetting('system_prompt');

  // 4. Generate. Usage is NOT committed until this succeeds.
  let result;
  try {
    result = await generateReply({
      mode,
      tierForRouting: eligibility.tierForRouting,
      history,
      systemPrompt,
      attachments,
    });
  } catch (err) {
    if (err instanceof AiProviderError) {
      return res.status(502).json({ error: 'model_error', message: err.message });
    }
    throw err;
  }

  // 5. Commit usage + persist both turns.
  const usage = commitQuestion(req.userId);
  const now = () => new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, user_id, role, content, tier_at_send, created_at)
     VALUES (?, ?, ?, 'user', ?, ?, ?)`
  ).run(nanoid(), conversationId, req.userId, message, eligibility.tierForRouting, now());
  db.prepare(
    `INSERT INTO messages
       (id, conversation_id, user_id, role, content, model_used, tier_at_send, input_tokens, output_tokens, created_at)
     VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`
  ).run(
    nanoid(),
    conversationId,
    req.userId,
    result.text,
    result.model,
    eligibility.tierForRouting,
    result.inputTokens,
    result.outputTokens,
    now()
  );

  res.json({
    reply: result.text,
    model: result.model,
    tierForRouting: eligibility.tierForRouting,
    groundedOn: passages.map((p) => `${p.topic} — ${p.section}`),
    usage,
  });
});
