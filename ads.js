import { Router } from 'express';
import { verifyAdReward } from '../services/adVerification.js';
import { creditAdUnlock, getUsageSnapshot } from '../services/ledgerService.js';
import { getNumberSetting, getBoolSetting } from '../services/settingsService.js';
import { abuseGuard } from '../middleware/abuseGuard.js';

export const adsRouter = Router();

// POST /api/ads/reward
// Body: { provider, transactionId, payload } — called once the ad SDK
// reports a completed rewarded view. The desktop client CANNOT unlock
// bonus questions by calling this with a made-up transactionId: every
// request still has to pass verifyAdReward's server-side check.
adsRouter.post('/ads/reward', abuseGuard('ad_reward'), async (req, res) => {
  if (!getBoolSetting('monetization_enabled')) {
    return res.status(403).json({ error: 'monetization_disabled', message: 'Ad-unlocks are turned off.' });
  }

  const { provider, transactionId, payload } = req.body || {};
  if (!provider || !transactionId) {
    return res.status(400).json({ error: 'bad_request', message: 'provider and transactionId are required.' });
  }

  const snapshotBefore = getUsageSnapshot(req.userId);
  if (!snapshotBefore.canWatchAdForMore) {
    return res.status(403).json({
      error: 'unlock_cap_reached',
      message: `You've used all ${snapshotBefore.maxAdUnlocksPerDay} ad-unlocks for today.`,
      usage: snapshotBefore,
    });
  }

  const verification = await verifyAdReward(req.userId, provider, transactionId, payload);
  if (!verification.ok) {
    return res.status(402).json({
      error: 'ad_not_verified',
      message: "We couldn't verify that ad completed — no questions were credited.",
      reason: verification.reason,
    });
  }

  const amount = getNumberSetting('ad_unlock_amount');
  const usage = creditAdUnlock(req.userId, amount);
  res.json({ credited: amount, usage });
});
