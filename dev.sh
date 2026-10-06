#!/usr/bin/env bash
# Convenience script: runs the backend and the frontend dev server
# together, and stops both on Ctrl+C. Run from the repo root:
#   bash scripts/dev.sh
set -e
cd "$(dirname "$0")/.."

if [ ! -f server/.env ]; then
  echo "server/.env not found — copying server/.env.example. Edit it with your ANTHROPIC_API_KEY before using online mode."
  cp server/.env.example server/.env
fi
if [ ! -f desktop/.env ]; then
  cp desktop/.env.example desktop/.env
fi

cleanup() {
  echo "Stopping..."
  kill "$SERVER_PID" "$DESKTOP_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd server && npm run dev) &
SERVER_PID=$!

(cd desktop && npm run dev) &
DESKTOP_PID=$!

wait
