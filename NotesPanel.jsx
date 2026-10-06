import React from 'react';
import { api } from '../../lib/api.js';

const TEMPLATE = `# New Topic

## Overview
Write a short introduction to the topic here.

## Common misconceptions worth correcting
- "A misconception a student might state." Why it's wrong, and the
  accurate version.
`;

function countSections(markdown) {
  return (markdown.match(/^## /gm) || []).length;
}

export default function NotesPanel({ token, onAuthError }) {
  const [notes, setNotes] = React.useState(null);
  const [selectedSlug, setSelectedSlug] = React.useState(null);
  const [isNew, setIsNew] = React.useState(false);
  const [newSlug, setNewSlug] = React.useState('');
  const [content, setContent] = React.useState('');
  const [loadError, setLoadError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function loadList() {
    api.adminListNotes(token)
      .then(setNotes)
      .catch((err) => (err.status === 401 ? onAuthError() : setLoadError(err.message)));
  }

  React.useEffect(loadList, [token]);

  function selectTopic(slug) {
    setSelectedSlug(slug);
    setIsNew(false);
    setSavedAt(null);
    setConfirmDelete(false);
    api.adminGetNote(token, slug)
      .then((data) => setContent(data.content))
      .catch((err) => (err.status === 401 ? onAuthError() : setLoadError(err.message)));
  }

  function startNewTopic() {
    setSelectedSlug(null);
    setIsNew(true);
    setNewSlug('');
    setContent(TEMPLATE);
    setSavedAt(null);
    setConfirmDelete(false);
  }

  async function handleSave() {
    const slug = isNew ? newSlug.trim().toLowerCase() : selectedSlug;
    if (isNew && !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
      setLoadError('Slug must be lowercase letters, numbers, and dashes only (e.g. "big-o-notation").');
      return;
    }
    setSaving(true);
    setLoadError(null);
    try {
      await api.adminSaveNote(token, slug, content);
      setSavedAt(Date.now());
      setIsNew(false);
      setSelectedSlug(slug);
      loadList();
    } catch (err) {
      if (err.status === 401) onAuthError();
      else setLoadError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try {
      await api.adminDeleteNote(token, selectedSlug);
      setSelectedSlug(null);
      setContent('');
      setConfirmDelete(false);
      loadList();
    } catch (err) {
      if (err.status === 401) onAuthError();
      else setLoadError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError && !notes) return <div className="error-banner">{loadError}</div>;
  if (!notes) return <p className="sub">Loading…</p>;

  const isEditing = isNew || selectedSlug;

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 240, flexShrink: 0 }}>
        <button className="new-chat-btn" style={{ width: '100%', marginBottom: 10 }} onClick={startNewTopic}>
          + New topic
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 480, overflowY: 'auto' }}>
          {notes.map((n) => (
            <button
              key={n.slug}
              className={`convo-item ${selectedSlug === n.slug ? 'active' : ''}`}
              onClick={() => selectTopic(n.slug)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 10px' }}
            >
              <span>{n.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{n.sectionCount} sections</span>
            </button>
          ))}
          {notes.length === 0 && <p className="sub">No topics yet.</p>}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {!isEditing ? (
          <p className="sub">Pick a topic on the left to edit it, or start a new one.</p>
        ) : (
          <>
            {isNew && (
              <div className="field-row" style={{ borderBottom: 'none', paddingTop: 0 }}>
                <label htmlFor="new-slug">Topic slug</label>
                <input
                  id="new-slug"
                  placeholder="e.g. big-o-notation"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
              </div>
            )}
            <p className="sub" style={{ margin: '0 0 8px' }}>
              {countSections(content)} section{countSections(content) === 1 ? '' : 's'} will be indexed —
              every <code>## Heading</code> becomes one retrievable passage.
            </p>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setSavedAt(null); }}
              style={{
                width: '100%', minHeight: 420, background: 'var(--bg-elevated)',
                border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
                padding: 14, lineHeight: 1.6, resize: 'vertical',
              }}
            />
            {loadError && <div className="error-banner" style={{ marginTop: 10 }}>{loadError}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create topic' : 'Save changes'}
              </button>
              {!isNew && (
                <button className="btn-secondary" onClick={handleDelete} disabled={saving} style={{ color: confirmDelete ? 'var(--warn)' : undefined }}>
                  {confirmDelete ? 'Click again to confirm delete' : 'Delete topic'}
                </button>
              )}
              {savedAt && <span className="sub" style={{ margin: 0 }}>Saved — live immediately.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
