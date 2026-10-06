// Every request that touches the ledger needs a stable user id. The
// desktop client generates a random id on first launch (see
// desktop/src/lib/deviceId.js) and sends it as X-FST-User; we never let
// the client assert usage numbers, only its own identity, and identity
// alone can't grant extra questions.

import { nanoid } from 'nanoid';

export function deviceId(req, res, next) {
  const provided = req.header('x-fst-user');
  req.userId = provided && provided.length >= 8 ? provided : nanoid();
  next();
}
