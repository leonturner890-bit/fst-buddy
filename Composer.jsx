import React from 'react';
import { api } from '../lib/api.js';

const ACCEPT = '.pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp';

export default function Composer({ disabled, onSend, placeholder }) {
  const [value, setValue] = React.useState('');
  const [pending, setPending] = React.useState([]); // {id, kind, filename, text?, mediaType?, base64?}
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  async function handleFilePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadFile(file);
      setPending((prev) => [...prev, { id: crypto.randomUUID(), filename: file.name, ...result }]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function removePending(id) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed && pending.length === 0) return;

    const textAttachments = pending.filter((p) => p.kind === 'text');
    const imageAttachments = pending.filter((p) => p.kind === 'image');

    let fullMessage = trimmed;
    for (const t of textAttachments) {
      fullMessage += `\n\n[Attached document: ${t.filename}]\n${t.text}`;
    }

    onSend({
      message: fullMessage || `Take a look at ${imageAttachments[0]?.filename}`,
      attachments: imageAttachments.map((a) => ({ mediaType: a.mediaType, base64: a.base64 })),
    });

    setValue('');
    setPending([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div>
      {(pending.length > 0 || uploading || uploadError) && (
        <div className="attachment-chip-row">
          {pending.map((p) => (
            <span className="attachment-chip" key={p.id}>
              📎 {p.filename}
              <button onClick={() => removePending(p.id)} aria-label="Remove attachment">✕</button>
            </span>
          ))}
          {uploading && <span className="attachment-chip">Reading file…</span>}
          {uploadError && <span className="attachment-chip" style={{ color: 'var(--warn)' }}>{uploadError}</span>}
        </div>
      )}

      <div className="composer">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={handleFilePicked}
        />
        <button
          className="icon-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach a document or image"
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={placeholder || 'Ask FST Buddy anything…'}
          disabled={disabled}
          onChange={(e) => { setValue(e.target.value); autoGrow(e.target); }}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={handleSend} disabled={disabled || (!value.trim() && pending.length === 0)}>
          ↑
        </button>
      </div>
      <div className="hint-line">Enter to send · Shift+Enter for a new line</div>
    </div>
  );
}
