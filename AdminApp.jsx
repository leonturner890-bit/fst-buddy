import React from 'react';
import SettingsPanel from './SettingsPanel.jsx';
import MetricsPanel from './MetricsPanel.jsx';
import NotesPanel from './NotesPanel.jsx';

const TOKEN_KEY = 'fst-admin-token';

export default function AdminApp() {
  const [token, setToken] = React.useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [entered, setEntered] = React.useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const [tab, setTab] = React.useState('settings');

  if (!entered) {
    return (
      <div className="admin-shell">
        <div className="token-gate">
          <div className="brand-mark" style={{ margin: '0 auto', width: 44, height: 44, fontSize: 16, borderRadius: 14 }}>fst</div>
          <h1 style={{ marginTop: 14 }}>Admin panel</h1>
          <p className="sub">Paste the ADMIN_TOKEN from server/.env</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            onKeyDown={(e) => e.key === 'Enter' && token && (sessionStorage.setItem(TOKEN_KEY, token), setEntered(true))}
          />
          <button
            className="btn-primary"
            disabled={!token}
            onClick={() => { sessionStorage.setItem(TOKEN_KEY, token); setEntered(true); }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <h1>FST Buddy — Admin</h1>
      <p className="sub">
        Model routing, limits, and persona — plus a look at usage.{' '}
        <a className="admin-link" href="#">Back to chat</a>
      </p>

      <div className="admin-tabs">
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
        <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>Notes</button>
        <button className={tab === 'metrics' ? 'active' : ''} onClick={() => setTab('metrics')}>Metrics</button>
      </div>

      {tab === 'settings' && (
        <SettingsPanel token={token} onAuthError={() => { sessionStorage.removeItem(TOKEN_KEY); setEntered(false); }} />
      )}
      {tab === 'notes' && (
        <NotesPanel token={token} onAuthError={() => { sessionStorage.removeItem(TOKEN_KEY); setEntered(false); }} />
      )}
      {tab === 'metrics' && (
        <MetricsPanel token={token} onAuthError={() => { sessionStorage.removeItem(TOKEN_KEY); setEntered(false); }} />
      )}
    </div>
  );
}
