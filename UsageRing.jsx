import React from 'react';

export default function UsageRing({ usage }) {
  if (!usage) return null;

  if (usage.tier === 'subscriber') {
    return (
      <div className="usage-widget">
        <RingSvg fraction={1} />
        <div className="usage-ring-label">
          <span className="usage-ring-count">Unlimited</span>
          <span className="usage-ring-sub">Subscriber plan</span>
        </div>
      </div>
    );
  }

  const total = usage.dailyLimit + usage.bonusQuestions;
  const used = usage.questionsUsed;
  const fraction = total > 0 ? Math.min(1, used / total) : 0;

  return (
    <div className="usage-widget">
      <RingSvg fraction={fraction} />
      <div className="usage-ring-label">
        <span className="usage-ring-count">{used}/{total} today</span>
        {usage.monetizationEnabled && (
          <span className="usage-ring-sub">
            {usage.adUnlocksUsedToday}/{usage.maxAdUnlocksPerDay} ad-unlocks used
          </span>
        )}
      </div>
    </div>
  );
}

function RingSvg({ fraction }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle
        cx="18" cy="18" r={r} fill="none"
        stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - fraction)}
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}
