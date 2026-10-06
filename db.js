import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SETTINGS } from './config/defaultSettings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Override with DATA_DIR when deploying somewhere with a mounted
// persistent volume (Railway, Fly.io, etc.) at a path other than this
// default — the SQLite file here is the entire usage ledger, so it must
// live on storage that survives a restart/redeploy.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'fst-buddy.sqlite'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ---------------------------------------------------------------------
// Schema. Everything here is server-side and authoritative: the desktop
// client never writes usage numbers directly, it only ever asks the
// server to check/consume/credit them.
// ---------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    tier TEXT NOT NULL DEFAULT 'free',            -- 'free' | 'subscriber'
    subscription_expires_at TEXT,
    last_seen_at TEXT
  );

  CREATE TABLE IF NOT EXISTS usage_daily (
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,                            -- 'YYYY-MM-DD', UTC
    questions_used INTEGER NOT NULL DEFAULT 0,
    bonus_questions INTEGER NOT NULL DEFAULT 0,   -- credited via ad unlocks
    ad_unlocks_used INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ad_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,          -- dedupe replay attempts
    status TEXT NOT NULL,                         -- 'verified' | 'rejected'
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fingerprint_log (
    fingerprint TEXT NOT NULL,
    ip TEXT NOT NULL,
    route TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_fp_log_lookup
    ON fingerprint_log (fingerprint, route, created_at);

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New chat',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,                           -- 'user' | 'assistant'
    content TEXT NOT NULL,
    model_used TEXT,
    tier_at_send TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, created_at);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Full-text search over the reference-notes corpus (RAG grounding).
  CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    topic, section, body, source
  );
`);

// Seed settings that don't already have a row (never overwrite an admin's
// existing choice on restart).
const insertSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  insertSetting.run(key, String(value));
}

export default db;

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}
