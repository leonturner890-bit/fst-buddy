// Server-side rewarded-ad verification.
//
// THE RULE THIS FILE EXISTS TO ENFORCE: a client saying "the ad finished"
// is never sufficient on its own to credit bonus questions. Every path
// through here ends in one of two states:
//   - a provider's own server-to-server callback (SSV) told us the ad
//     completed, and we can check that message's authenticity, OR
//   - we reject the request.
//
// What's real vs. stubbed:
//   - The dedupe-by-transaction-id logic, the rate limiting, and the
//     "only credit after verification" control flow are real and wired in.
//   - The actual cryptographic/signature check per ad network is a stub —
//     each network's exact SSV payload and key format is account-specific
//     and documented in that network's own dashboard. Fill in
//     `verifyWithProvider` for whichever network you sign up with.
//
// Supported shapes (fill in credentials in .env):
//   - Google Ad Manager / AdMob rewarded SSV callback
//   - ironSource server-to-server reward callback
//   - AppLovin MAX server-to-server postback

import db from '../db.js';
import { nanoid } from 'nanoid';

const recordVerification = db.prepare(`
  INSERT INTO ad_verifications (id, user_id, provider, transaction_id, status, reason)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const findByTransactionId = db.prepare(
  'SELECT * FROM ad_verifications WHERE transaction_id = ?'
);

async function verifyWithProvider(provider, payload) {
  switch (provider) {
    case 'admob': {
      // Real implementation: fetch Google's rotating public keys from
      // ADMOB_SSV_PUBLIC_KEYS_URL, find the key matching payload.key_id,
      // and verify the ECDSA signature over the query string per
      // https://developers.google.com/admob/android/rewarded-video-ssv
      // TODO: wire real verification. Until then, this network is
      // treated as unverifiable and every reward is rejected — fail
      // closed, not open.
      return { verified: false, reason: 'admob SSV signature check not configured' };
    }
    case 'ironsource': {
      // Real implementation: check the `signature` field against an
      // HMAC computed with IRONSOURCE_SECRET_KEY over the callback params.
      return { verified: false, reason: 'ironSource secret not configured' };
    }
    case 'applovin': {
      // Real implementation: verify the AppLovin MAX postback signature
      // using APPLOVIN_SECRET_KEY.
      return { verified: false, reason: 'AppLovin secret not configured' };
    }
    case 'dev-simulated': {
      // Local development / demo only: lets you exercise the full unlock
      // flow without a real ad account. Disabled unless NODE_ENV !== 'production'.
      if (process.env.NODE_ENV === 'production') {
        return { verified: false, reason: 'dev-simulated provider disabled in production' };
      }
      return { verified: true, reason: 'dev-simulated: accepted for local testing only' };
    }
    default:
      return { verified: false, reason: `unknown provider: ${provider}` };
  }
}

/**
 * @param {string} userId
 * @param {string} provider - 'admob' | 'ironsource' | 'applovin' | 'dev-simulated'
 * @param {string} transactionId - unique id the ad SDK/callback assigns to this view
 * @param {object} rawPayload - the full callback payload, for audit + real sig checks
 */
export async function verifyAdReward(userId, provider, transactionId, rawPayload) {
  if (!transactionId) {
    return { ok: false, reason: 'missing transaction id' };
  }

  // Replay protection: a transaction id can only ever be credited once,
  // full stop, regardless of which user or provider claims it.
  const existing = findByTransactionId.get(transactionId);
  if (existing) {
    return { ok: false, reason: 'transaction already processed' };
  }

  const result = await verifyWithProvider(provider, rawPayload || {});
  const id = nanoid();
  recordVerification.run(
    id,
    userId,
    provider,
    transactionId,
    result.verified ? 'verified' : 'rejected',
    result.reason
  );

  return { ok: result.verified, reason: result.reason };
}
