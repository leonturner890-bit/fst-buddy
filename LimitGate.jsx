import React from 'react';
import RewardedAdPlayer from './RewardedAdPlayer.jsx';

export default function LimitGate({ usage, onUsageUpdate }) {
  const [showAd, setShowAd] = React.useState(false);
  const [showUpgradeNote, setShowUpgradeNote] = React.useState(false);

  // MVP mode: monetization_enabled=false in the admin panel. No ad or
  // upgrade path — just a hard stop until the daily limit resets.
  if (!usage.monetizationEnabled) {
    return (
      <div className="limit-gate">
        <h3>You're out of free questions for today</h3>
        <p>
          You've used all {usage.dailyLimit} today — more opens up tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="limit-gate">
      <h3>You're out of free questions for today</h3>
      <p>
        You've used {usage.questionsUsed} of {usage.dailyLimit + usage.bonusQuestions} today.
        {usage.canWatchAdForMore
          ? ' Watch a short ad to keep going, or go unlimited with a subscription.'
          : ` You've used all ${usage.maxAdUnlocksPerDay} ad-unlocks for today — come back tomorrow, or upgrade.`}
      </p>
      <div className="limit-gate-actions">
        {usage.canWatchAdForMore && (
          <button className="btn-primary" onClick={() => setShowAd(true)}>
            Watch a short ad for more
          </button>
        )}
        <button className="btn-secondary" onClick={() => setShowUpgradeNote(true)}>
          Upgrade
        </button>
      </div>

      {showUpgradeNote && (
        <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-faint)' }}>
          Subscriptions aren't connected to a real payment processor in this build —
          see the README for how to wire up Stripe checkout.
        </p>
      )}

      {showAd && (
        <RewardedAdPlayer
          onClose={() => setShowAd(false)}
          onCredited={(result) => {
            setShowAd(false);
            onUsageUpdate(result.usage);
          }}
        />
      )}
    </div>
  );
}
