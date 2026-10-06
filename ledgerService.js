// Server-authoritative usage ledger. Nothing in this file trusts anything
// the client says about how many questions it has "left" — every read and
// write goes through SQLite here, and the client only ever sees the
// result. Usage is only ever committed *after* a model call succeeds, so
// a failed API call never burns a student's free question.

import db, { todayUTC } from '../db.js';
import { getNumberSetting, getBoolSetting } from './settingsService.js';

const ensureUser = db.prepare(`
  INSERT INTO users (id) VALUES (?)
  ON CONFLICT(id) DO UPDATE SET last_seen_at = datetime('now')
`);
const ensureDay = db.prepare(`
  INSERT OR IGNORE INTO usage_daily (user_id, day) VALUES (?, ?)
`);
const getUser = db.prepare('SELECT * FROM users WHERE id = ?');
const getDay = db.prepare('SELECT * FROM usage_daily WHERE user_id = ? AND day = ?');
const incrementUsed = db.prepare(`
  UPDATE usage_daily SET questions_used = questions_used + 1
  WHERE user_id = ? AND day = ?
`);
const creditBonus = db.prepare(`
  UPDATE usage_daily
  SET bonus_questions = bonus_questions + ?, ad_unlocks_used = ad_unlocks_used + 1
  WHERE user_id = ? AND day = ?
`);

function touch(userId) {
  ensureUser.run(userId);
  ensureDay.run(userId, todayUTC());
}

export function getUsageSnapshot(userId) {
  touch(userId);
  const day = todayUTC();
  const user = getUser.get(userId);
  const usage = getDay.get(userId, day);
  const dailyLimit = getNumberSetting('daily_free_limit');
  const maxUnlocks = getNumberSetting('max_ad_unlocks_per_day');
  const monetizationEnabled = getBoolSetting('monetization_enabled');

  const isSubscriber =
    user.tier === 'subscriber' &&
    (!user.subscription_expires_at || new Date(user.subscription_expires_at) > new Date());

  const allowance = isSubscriber ? Infinity : dailyLimit + usage.bonus_questions;
  const remaining = isSubscriber ? null : Math.max(0, allowance - usage.questions_used);

  return {
    userId,
    tier: isSubscriber ? 'subscriber' : 'free',
    day,
    questionsUsed: usage.questions_used,
    dailyLimit,
    bonusQuestions: usage.bonus_questions,
    remaining,
    adUnlocksUsedToday: usage.ad_unlocks_used,
    maxAdUnlocksPerDay: maxUnlocks,
    canWatchAdForMore: monetizationEnabled && !isSubscriber && usage.ad_unlocks_used < maxUnlocks,
    monetizationEnabled,
  };
}

/**
 * Read-only eligibility check, done BEFORE calling the model. Returns
 * { ok: true, tierForRouting, snapshot } or { ok: false, snapshot }.
 * Does not mutate anything, so a failed downstream API call costs the
 * student nothing.
 */
export function checkEligibility(userId) {
  const snapshot = getUsageSnapshot(userId);
  if (snapshot.tier === 'subscriber') {
    return { ok: true, tierForRouting: 'subscriber', snapshot };
  }
  if (snapshot.remaining <= 0) {
    return { ok: false, snapshot };
  }
  const spendingBonus = snapshot.questionsUsed >= snapshot.dailyLimit;
  return { ok: true, tierForRouting: spendingBonus ? 'ad_unlock' : 'free', snapshot };
}

/** Call once a model reply has actually been produced, to record the spend. */
export function commitQuestion(userId) {
  touch(userId);
  incrementUsed.run(userId, todayUTC());
  return getUsageSnapshot(userId);
}

export function creditAdUnlock(userId, amount) {
  touch(userId);
  creditBonus.run(amount, userId, todayUTC());
  return getUsageSnapshot(userId);
}

export function setTier(userId, tier, expiresAt = null) {
  touch(userId);
  db.prepare('UPDATE users SET tier = ?, subscription_expires_at = ? WHERE id = ?').run(
    tier,
    expiresAt,
    userId
  );
  return getUsageSnapshot(userId);
}
