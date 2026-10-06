import db from '../db.js';
import { SETTINGS_META } from '../config/defaultSettings.js';

const selectAll = db.prepare('SELECT key, value FROM settings');
const selectOne = db.prepare('SELECT value FROM settings WHERE key = ?');
const upsert = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
);

export function getAllSettings() {
  const rows = selectAll.all();
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export function getSetting(key) {
  const row = selectOne.get(key);
  return row ? row.value : undefined;
}

export function getNumberSetting(key) {
  return Number(getSetting(key));
}

export function getBoolSetting(key) {
  return getSetting(key) === 'true';
}

// Only keys we know about (from SETTINGS_META) can be written — the admin
// panel can't be used to smuggle arbitrary rows into the settings table.
export function updateSettings(patch) {
  const applied = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in SETTINGS_META)) continue;
    upsert.run(key, String(value));
    applied[key] = String(value);
  }
  return applied;
}
