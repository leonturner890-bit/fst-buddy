import React from 'react';
import { api } from '../lib/api.js';
import MessageBubble from './MessageBubble.jsx';
import Composer from './Composer.jsx';
import LimitGate from './LimitGate.jsx';

const STARTERS = [
  "What's the difference between aggregation and composition?",
  'Explain TDD like I\'m new to it',
  'Is a hash map the same as a hash table? I always mix these up',
  'Walk me through the SDLC phases',
];

export default function ChatView({ conversationId, mode, usage, onUsageUpdate }) {
  const [messages, setMessages] = React.useState([]);
  const [pendingReply, setPendingReply] = React.useState(false);
  const [error, setError] = React.useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setError(null);
    if (!conversationId) return;
    api.getMessages(conversationId).then((rows) => {
      if (!cancelled) setMessages(rows);
    });
    return () => { cancelled = true; };
  }, [conversationId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingReply]);

  async function handleSend({ message, attachments }) {
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setPendingReply(true);
    try {
      const result = await api.sendChat({ conversationId, message, mode, attachments });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply, groundedOn: result.groundedOn }]);
      onUsageUpdate(result.usage);
    } catch (err) {
      if (err.status === 402 && err.payload?.usage) {
        onUsageUpdate(err.payload.usage);
        setMessages((prev) => prev.slice(0, -1)); // don't leave an unanswered bubble hanging
      } else {
        setError(err.message);
      }
    } finally {
      setPendingReply(false);
    }
  }

  const atLimit = usage && usage.tier === 'free' && usage.remaining <= 0;

  return (
    <div className="chat-area">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="brand-mark">fst</div>
            <h1>What are we studying today?</h1>
            <p>
              Ask about SDLC, OOP, UML, testing, Agile, design patterns, databases, or AI/ML —
              freeform, like you're texting a sharp classmate. Get something wrong and I'll say so.
            </p>
            <div className="suggestion-row">
              {STARTERS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => handleSend({ message: s, attachments: [] })}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-inner">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} groundedOn={m.groundedOn} />
            ))}
            {pendingReply && (
              <div className="message-row assistant">
                <div className="bubble assistant">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
            {error && <div className="error-banner">{error}</div>}
          </div>
        )}
      </div>

      <div className="composer-wrap">
        {atLimit ? (
          <LimitGate usage={usage} onUsageUpdate={onUsageUpdate} />
        ) : (
          <Composer
            disabled={pendingReply || !conversationId}
            onSend={handleSend}
            placeholder={mode === 'offline' ? 'Ask FST Buddy (offline, via your local model)…' : 'Ask FST Buddy anything…'}
          />
        )}
      </div>
    </div>
  );
}
