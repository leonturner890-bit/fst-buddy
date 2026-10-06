import React from 'react';
import { api } from '../../lib/api.js';

function pct(x) {
  return x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`;
}

export default function MetricsPanel({ token, onAuthError }) {
  const [metrics, setMetrics] = React.useState(null);
  const [users, setUsers] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);

  function load() {
    Promise.all([api.adminGetMetrics(token), api.adminGetUsers(token)])
      .then(([m, u]) => { setMetrics(m); setUsers(u); })
      .catch((err) => (err.status === 401 ? onAuthError() : setLoadError(err.message)));
  }

  React.useEffect(load, [token]);

  async function toggleTier(userId, currentTier) {
    const next = currentTier === 'subscriber' ? 'free' : 'subscriber';
    await api.adminSetTier(token, userId, next);
    load();
  }

  if (loadError) return <div className="error-banner">{loadError}</div>;
  if (!metrics || !users) return <p className="sub">Loading…</p>;

  const totalCost = Object.values(metrics.estimatedCostByDayUsd).reduce((a, b) => a + b, 0);
  const maxDau = Math.max(1, ...metrics.dailyActiveUsers.map((d) => d.active_users));

  return (
    <div>
      <div className="metric-cards">
        <MetricCard label="Total users" value={metrics.totalUsers} />
        <MetricCard label="Subscribers" value={metrics.subscribers} />
        <MetricCard label="Conversion rate" value={pct(metrics.subscriptionConversionRate)} />
        <MetricCard label="Hit daily limit" value={metrics.usersWhoHitDailyLimit} />
        <MetricCard label="Ad-unlock rate" value={pct(metrics.adUnlockRate)} />
        <MetricCard label="Est. cost (14d)" value={`$${totalCost.toFixed(2)}`} />
      </div>

      <p className="rail-label" style={{ marginBottom: 4 }}>Daily active users — last 14 days</p>
      <div className="dau-bars">
        {metrics.dailyActiveUsers.length === 0 && <span className="sub">No activity yet.</span>}
        {metrics.dailyActiveUsers.map((d) => (
          <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
            <div className="dau-bar" style={{ height: `${(d.active_users / maxDau) * 90}px` }} />
            <div className="dau-bar-label">{d.day.slice(5)}</div>
          </div>
        ))}
      </div>

      <p className="rail-label" style={{ margin: '28px 0 4px' }}>Users</p>
      <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {users.slice(0, 30).map((u) => (
          <div key={u.id} className="field-row" style={{ gridTemplateColumns: '1fr auto auto', padding: '10px 14px', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{u.id}</span>
            <span className="sub" style={{ margin: 0 }}>{u.tier}</span>
            <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => toggleTier(u.id, u.tier)}>
              {u.tier === 'subscriber' ? 'Set free' : 'Set subscriber'}
            </button>
          </div>
        ))}
        {users.length === 0 && <p className="sub" style={{ padding: 14 }}>No users yet.</p>}
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
