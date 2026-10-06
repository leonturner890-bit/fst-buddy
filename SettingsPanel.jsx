import React from 'react';
import { api } from '../../lib/api.js';

export default function SettingsPanel({ token, onAuthError }) {
  const [values, setValues] = React.useState(null);
  const [meta, setMeta] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);

  React.useEffect(() => {
    api.adminGetSettings(token)
      .then((data) => { setValues(data.values); setMeta(data.meta); })
      .catch((err) => (err.status === 401 ? onAuthError() : setLoadError(err.message)));
  }, [token]);

  function update(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.adminUpdateSettings(token, values);
      setSavedAt(Date.now());
    } catch (err) {
      if (err.status === 401) onAuthError();
      else setLoadError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <div className="error-banner">{loadError}</div>;
  if (!values || !meta) return <p className="sub">Loading…</p>;

  // Group fields for display, preserving each group's first-seen order.
  const groups = [];
  const byGroup = {};
  for (const [key, def] of Object.entries(meta)) {
    const g = def.group || 'General';
    if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
    byGroup[g].push([key, def]);
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group} style={{ marginBottom: 28 }}>
          <p className="rail-label" style={{ marginBottom: 4 }}>{group}</p>
          <div className="settings-grid">
            {byGroup[group].map(([key, def]) => (
              <div className="field-row" key={key}>
                <label htmlFor={key}>{def.label}</label>
                {def.type === 'textarea' ? (
                  <textarea id={key} value={values[key] ?? ''} onChange={(e) => update(key, e.target.value)} />
                ) : def.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13.5 }}>
                    <input
                      type="checkbox"
                      checked={values[key] === 'true'}
                      onChange={(e) => update(key, e.target.checked ? 'true' : 'false')}
                    />
                    {values[key] === 'true' ? 'Enabled' : 'Disabled'}
                  </label>
                ) : (
                  <input
                    id={key}
                    type={def.type === 'number' ? 'number' : 'text'}
                    value={values[key] ?? ''}
                    onChange={(e) => update(key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {savedAt && <span className="sub" style={{ margin: 0 }}>Saved.</span>}
      </div>
    </div>
  );
}
