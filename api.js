import { getDeviceId } from './deviceId.js';

// Relative by default so one build works wherever it's deployed — the
// backend serves this same frontend from the same origin in production
// (see server/src/index.js). Set VITE_API_BASE_URL only if the frontend
// and backend are on different origins (e.g. local dev without the Vite
// proxy below, or a split deployment).
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, { method = 'GET', body, headers = {}, admin = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(admin ? {} : { 'x-fst-user': getDeviceId(), 'x-fst-fingerprint': getDeviceId() }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const error = new Error(data?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export const api = {
  getSession: () => request('/session'),
  listConversations: () => request('/conversations'),
  createConversation: (title) => request('/conversations', { method: 'POST', body: { title } }),
  getMessages: (id) => request(`/conversations/${id}/messages`),
  sendChat: ({ conversationId, message, mode, attachments }) =>
    request('/chat', { method: 'POST', body: { conversationId, message, mode, attachments } }),
  requestAdReward: ({ provider, transactionId, payload }) =>
    request('/ads/reward', { method: 'POST', body: { provider, transactionId, payload } }),
  uploadFile: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: { 'x-fst-user': getDeviceId() },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },

  // ---- Admin (token supplied by the AdminApp, not the device id) ------
  adminGetSettings: (token) =>
    request('/admin/settings', { admin: true, headers: { authorization: `Bearer ${token}` } }),
  adminUpdateSettings: (token, patch) =>
    request('/admin/settings', {
      method: 'PUT',
      admin: true,
      headers: { authorization: `Bearer ${token}` },
      body: patch,
    }),
  adminGetMetrics: (token) =>
    request('/admin/metrics', { admin: true, headers: { authorization: `Bearer ${token}` } }),
  adminGetUsers: (token) =>
    request('/admin/users', { admin: true, headers: { authorization: `Bearer ${token}` } }),
  adminSetTier: (token, userId, tier) =>
    request(`/admin/users/${userId}/tier`, {
      method: 'PUT',
      admin: true,
      headers: { authorization: `Bearer ${token}` },
      body: { tier },
    }),
  adminListNotes: (token) =>
    request('/admin/notes', { admin: true, headers: { authorization: `Bearer ${token}` } }),
  adminGetNote: (token, slug) =>
    request(`/admin/notes/${slug}`, { admin: true, headers: { authorization: `Bearer ${token}` } }),
  adminSaveNote: (token, slug, content) =>
    request(`/admin/notes/${slug}`, {
      method: 'PUT',
      admin: true,
      headers: { authorization: `Bearer ${token}` },
      body: { content },
    }),
  adminDeleteNote: (token, slug) =>
    request(`/admin/notes/${slug}`, {
      method: 'DELETE',
      admin: true,
      headers: { authorization: `Bearer ${token}` },
    }),
};
