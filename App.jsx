import React from 'react';
import { api } from './lib/api.js';
import ChatView from './components/ChatView.jsx';
import UsageRing from './components/UsageRing.jsx';

export default function App() {
  const [usage, setUsage] = React.useState(null);
  const [conversations, setConversations] = React.useState([]);
  const [activeId, setActiveId] = React.useState(null);
  const [mode, setMode] = React.useState(() => localStorage.getItem('fst-mode') || 'online');

  React.useEffect(() => {
    localStorage.setItem('fst-mode', mode);
  }, [mode]);

  React.useEffect(() => {
    api.getSession().then(setUsage).catch(() => {});
    api.listConversations().then(async (rows) => {
      if (rows.length === 0) {
        const { id } = await api.createConversation('New chat');
        setConversations([{ id, title: 'New chat' }]);
        setActiveId(id);
      } else {
        setConversations(rows);
        setActiveId(rows[0].id);
      }
    });
  }, []);

  async function handleNewChat() {
    const { id } = await api.createConversation('New chat');
    setConversations((prev) => [{ id, title: 'New chat', created_at: new Date().toISOString() }, ...prev]);
    setActiveId(id);
  }

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark">fst</div>
          <span className="brand-name">FST Buddy</span>
        </div>

        <UsageRing usage={usage} />

        <div className="rail-section">
          <span className="rail-label">Mode</span>
          <div className="mode-toggle">
            <button className={mode === 'online' ? 'active' : ''} onClick={() => setMode('online')}>
              Online
            </button>
            <button className={mode === 'offline' ? 'active' : ''} onClick={() => setMode('offline')}>
              Offline
            </button>
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>+ New chat</button>

        <div className="rail-section" style={{ flex: 1, minHeight: 0 }}>
          <span className="rail-label">Chats</span>
          <div className="convo-list">
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`convo-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="rail-footer">
          <a className="admin-link" href="#admin">Admin panel →</a>
        </div>
      </aside>

      <ChatView
        key={activeId}
        conversationId={activeId}
        mode={mode}
        usage={usage}
        onUsageUpdate={setUsage}
      />
    </div>
  );
}
