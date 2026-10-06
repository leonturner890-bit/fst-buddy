import React from 'react';

// Minimal fenced-code-block rendering — no markdown dependency needed for
// what a study-buddy chat actually needs: prose plus the occasional code
// or UML-ish snippet.
function renderContent(content) {
  const parts = content.split(/```(\w*)\n([\s\S]*?)```/g);
  const nodes = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) nodes.push(<span key={`t${i}`}>{parts[i]}</span>);
    const lang = parts[i + 1];
    const code = parts[i + 2];
    if (code !== undefined) {
      nodes.push(
        <pre key={`c${i}`}>
          <code>{code.replace(/\n$/, '')}</code>
        </pre>
      );
    }
  }
  return nodes;
}

export default function MessageBubble({ role, content, groundedOn }) {
  const isUser = role === 'user';
  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`bubble ${isUser ? 'user' : 'assistant'}`}>
        {renderContent(content)}
        {!isUser && groundedOn && groundedOn.length > 0 && (
          <div className="grounded-tag">Grounded on: {groundedOn.join(', ')}</div>
        )}
      </div>
    </div>
  );
}
