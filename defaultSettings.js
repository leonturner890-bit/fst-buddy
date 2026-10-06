// Seed values for the `settings` table. Every one of these is editable at
// runtime from the admin panel (Settings tab) — this file only supplies the
// values a fresh install starts with. `group` controls which section of
// the Settings tab a field renders under.

export const DEFAULT_SETTINGS = {
  // ---- Usage limits -------------------------------------------------
  daily_free_limit: '10',
  ad_unlock_amount: '5',
  max_ad_unlocks_per_day: '3',

  // ---- Model routing (Anthropic model ids — check docs.claude.com for
  // the current list, these change over time) ------------------------
  model_free: 'claude-haiku-4-5-20251001',
  model_ad_unlock: 'claude-haiku-4-5-20251001',
  model_subscriber: 'claude-sonnet-5',
  model_offline: 'llama3.1',

  // ---- Response shaping ----------------------------------------------
  max_tokens_free: '900',
  max_tokens_ad_unlock: '500',
  max_tokens_subscriber: '2000',

  // ---- Persona / system prompt ---------------------------------------
  system_prompt:
    "You are FST Buddy, a friendly, sharp study partner for software " +
    "engineering, computer science, and AI students. You are talking with " +
    "a student working through coursework, not writing documentation. " +
    "Be conversational and encouraging, but never let an incorrect " +
    "statement pass uncorrected: if the student says something factually " +
    "wrong, say clearly that it's incorrect, explain why, and give the " +
    "accurate version before moving on. Ground your answers in the " +
    "reference notes you're given when they're relevant, and say so " +
    "naturally (\"per the SDLC notes...\") rather than citing like a " +
    "search engine. Keep answers scoped to what was asked — short for a " +
    "quick question, longer for \"walk me through\" questions. Use code " +
    "blocks for code, and plain language everywhere else.",

  // ---- Feature flags ---------------------------------------------------
  offline_mode_enabled: 'true',
  uploads_enabled: 'true',
  monetization_enabled: 'true',  // false = MVP mode: hide ad-unlock/upgrade UI, hard stop at daily limit

  // ---- Abuse & rate limits (ad-unlock endpoint) ------------------------
  ad_unlock_max_attempts_per_hour: '20',  // per fingerprint/IP
  ad_unlock_cooldown_seconds: '15',       // min gap between attempts
};

export const SETTINGS_META = {
  daily_free_limit: { label: 'Daily free question limit', type: 'number', group: 'Usage limits' },
  ad_unlock_amount: { label: 'Questions granted per ad', type: 'number', group: 'Usage limits' },
  max_ad_unlocks_per_day: { label: 'Max ad-unlocks per user per day', type: 'number', group: 'Usage limits' },

  model_free: { label: 'Model — free tier', type: 'text', group: 'Models' },
  model_ad_unlock: { label: 'Model — ad-unlocked questions', type: 'text', group: 'Models' },
  model_subscriber: { label: 'Model — subscribers', type: 'text', group: 'Models' },
  model_offline: { label: 'Ollama model tag — offline mode', type: 'text', group: 'Models' },

  max_tokens_free: { label: 'Max response tokens — free', type: 'number', group: 'Response length' },
  max_tokens_ad_unlock: { label: 'Max response tokens — ad-unlocked', type: 'number', group: 'Response length' },
  max_tokens_subscriber: { label: 'Max response tokens — subscriber', type: 'number', group: 'Response length' },

  system_prompt: { label: 'System prompt / persona', type: 'textarea', group: 'Persona' },

  offline_mode_enabled: { label: 'Offline mode enabled', type: 'boolean', group: 'Feature flags' },
  uploads_enabled: { label: 'Uploads enabled', type: 'boolean', group: 'Feature flags' },
  monetization_enabled: {
    label: 'Ads & subscriptions enabled (off = MVP mode)',
    type: 'boolean',
    group: 'Feature flags',
  },

  ad_unlock_max_attempts_per_hour: {
    label: 'Max ad-unlock attempts per hour (per device/IP)',
    type: 'number',
    group: 'Abuse & rate limits',
  },
  ad_unlock_cooldown_seconds: {
    label: 'Min seconds between ad-unlock attempts',
    type: 'number',
    group: 'Abuse & rate limits',
  },
};
