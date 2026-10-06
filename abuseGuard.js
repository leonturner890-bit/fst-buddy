// Lightweight abuse deterrence for the ad-unlock endpoint: per-fingerprint
// and per-IP velocity limits, logged to fingerprint_log. Thresholds are
// read from settings on every request (not cached), so an admin change
// takes effect immediately without a restart. This is not a substitute
// for real device attestation (Play Integrity / DeviceCheck) in a shipped
// mobile app, but for a desktop app it catches the obvious bot-farm
// pattern of hammering the endpoint from one machine/IP.

import db from '../db.js';
import { getNumberSetting } from '../services/settingsService.js';

const insertLog = db.prepare(
  'INSERT INTO fingerprint_log (fingerprint, ip, route) VALUES (?, ?, ?)'
);
const countRecent = db.prepare(`
  SELECT COUNT(*) AS n FROM fingerprint_log
  WHERE (fingerprint = ? OR ip = ?)
    AND route = ?
    AND created_at > datetime('now', '-1 hour')
`);
const mostRecent = db.prepare(`
  SELECT created_at FROM fingerprint_log
  WHERE fingerprint = ? AND route = ?
  ORDER BY created_at DESC LIMIT 1
`);

export function abuseGuard(routeName) {
  return (req, res, next) => {
    const fingerprint = req.header('x-fst-fingerprint') || req.userId || 'unknown';
    const ip = req.ip;

    const maxPerHour = getNumberSetting('ad_unlock_max_attempts_per_hour');
    const cooldownSeconds = getNumberSetting('ad_unlock_cooldown_seconds');

    const { n } = countRecent.get(fingerprint, ip, routeName);
    if (n >= maxPerHour) {
      return res.status(429).json({
        error: 'too_many_attempts',
        message: 'Too many attempts from this device — try again later.',
      });
    }

    const last = mostRecent.get(fingerprint, routeName);
    if (last) {
      const elapsedMs = Date.now() - new Date(last.created_at + 'Z').getTime();
      if (elapsedMs < cooldownSeconds * 1000) {
        return res.status(429).json({
          error: 'too_fast',
          message: 'Slow down a little before the next request.',
        });
      }
    }

    insertLog.run(fingerprint, ip, routeName);
    next();
  };
}
