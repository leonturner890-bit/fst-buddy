// A stable, random per-install identifier. This is an IDENTITY, not a
// usage claim — the server keeps its own ledger keyed by this id and
// never trusts anything else the client sends about how much of its
// quota is left. Losing localStorage (e.g. reinstalling) issues a new
// id and a fresh free allowance, same as any local-first app.

const KEY = 'fst-buddy-device-id';

function randomId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxxyxxxyxxxyxxxyxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(KEY, id);
  }
  return id;
}
