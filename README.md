# FST Buddy

An AI study buddy for software engineering, computer science, and AI
students: freeform chat (not a quiz), grounded in a reference-notes
corpus, that corrects you when you say something wrong. Runs on your own
machine, works online (Claude) or offline (a local model via Ollama), and
has a daily free-question limit with a watch-an-ad-for-more relief valve
and an optional unlimited subscriber tier.

```
┌─────────────────────────────┐        ┌───────────────────────────────┐
│   desktop/  (Vite + React)  │  HTTP  │   server/  (Node + Express)    │
│   fullscreen chat UI        │ ─────▶ │   usage ledger (SQLite)        │
│   admin panel (#admin)      │        │   ad-reward verification       │
│   wrapped by Tauri for a    │        │   RAG over notes/*.md (FTS5)   │
│   native desktop build      │        │   routes to Anthropic or Ollama│
└─────────────────────────────┘        └───────────────────────────────┘
```

## Quick start (development)

Requires **Node.js ≥ 22.5** (uses the built-in `node:sqlite` module — no
native compilation, no separate database server to install).

```bash
# from the repo root
bash scripts/dev.sh
```

That copies `server/.env.example` → `server/.env` and
`desktop/.env.example` → `desktop/.env` on first run, then starts both the
backend (`http://127.0.0.1:4317`) and the frontend dev server
(`http://localhost:5183`). Open the frontend URL in a browser to chat.

**Before online mode will work**, put a real key in `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Get one at console.anthropic.com. Without it, online mode returns a clear
error telling you what's missing (it never silently fails or charges a
question for a failed call).

**For offline mode**, install [Ollama](https://ollama.com), then:
```bash
ollama pull llama3.1
```
(or whatever model you set `model_offline` to in the admin panel — must
match an Ollama-pulled model tag exactly).

If you'd rather run the two pieces yourself instead of `scripts/dev.sh`:
```bash
cd server && cp .env.example .env && npm install && npm run dev
cd desktop && cp .env.example .env && npm install && npm run dev
```

## The admin panel

Open `http://localhost:5183/#admin` and paste the `ADMIN_TOKEN` value
from `server/.env`. Three tabs:

- **Settings** — grouped into Usage limits, Models, Response length,
  Persona, Feature flags, and Abuse & rate limits. Feature flags includes
  **"Ads & subscriptions enabled"** — turn it off to run FST Buddy as a
  bare MVP: hitting the daily limit shows a plain "come back tomorrow"
  with no ad or upgrade prompt, and the ad-unlock endpoint rejects
  requests server-side even if called directly (not just hidden in the
  UI). Leave it on for the full ad-unlock + subscription experience.
  Everything here
  (including the ad-unlock rate-limit thresholds — max attempts/hour and
  the cooldown between attempts, previously hardcoded) is read live by
  the server on every request, so a save takes effect immediately, no
  restart.
- **Notes** — add, edit, and delete the reference-notes topics that
  ground FST Buddy's answers (previously only editable as files on disk).
  Pick a topic to edit its markdown directly, or "+ New topic" to add
  one; the editor shows a live count of how many `## `-headed sections
  will be indexed. Saving or deleting re-indexes the FTS5 search table
  immediately — a saved edit is groundable on the very next question, no
  restart or manual re-index needed. Slugs are restricted to lowercase
  letters/numbers/dashes and validated server-side against path
  traversal.
- **Metrics** — daily active users (14-day), total users, subscriber
  count and conversion rate, how many users hit their daily limit vs. how
  many used an ad-unlock, and an estimated API cost per day. Also lists
  users with a one-click tier toggle, so you can try the subscriber
  experience without wiring up real payments yet.

## How the usage ledger works

Every number that matters — questions used today, ad-unlocks used today,
subscriber status — lives in `server/data/fst-buddy.sqlite`, not in the
client. The desktop app only ever *asks* the server "can I ask a
question?" or "credit this verified ad view"; it can't assert its own
usage count. A failed model call (bad API key, Ollama not running) is
never charged against the daily limit — usage is only committed after a
reply actually comes back.

## Ad-unlock verification — what's real vs. stubbed

The architecture never trusts a client-side "I watched the ad" signal on
its own: `server/src/services/adVerification.js` requires either a real
ad network's server-to-server callback or a signed reward token before
crediting anything, and every transaction ID can only be credited once
(replay-proof). What's wired in today:
- ✅ Replay protection, per-user daily unlock cap, and IP/fingerprint rate
  limiting (`server/src/middleware/abuseGuard.js`) — all real and tested.
- ✅ A `dev-simulated` provider so you can try the full unlock flow
  locally without an ad account (disabled automatically outside dev).
- 🔲 The actual signature check for AdMob / ironSource / AppLovin MAX is
  a documented stub — each network's exact SSV payload format is tied to
  your own account, so fill in `verifyWithProvider()` once you've signed
  up with one. Until you do, real-provider requests fail closed (rejected,
  nothing credited) rather than silently accepting them.
- Rewarded-video SDKs are primarily mobile; for this desktop app, the
  realistic path is Google Ad Manager/IMA's web rewarded-ad unit running
  inside the Tauri webview. `desktop/src/components/RewardedAdPlayer.jsx`
  is where you'd swap in that SDK.

## Subscriptions — what's real vs. stubbed

The ledger already treats `tier: 'subscriber'` as unlimited + the
strongest model — that part is fully real and tested. What's not wired in
is an actual payment processor:
- ✅ Admin panel → Metrics → Users → "Set subscriber" flips a real user to
  the subscriber tier, so you can test/demo the experience today.
- 🔲 `server/src/services/subscriptions.stripe-example.js` is a
  documented (not mounted) reference for wiring real Stripe Checkout +
  webhooks, which is the recommended real path — copy it into
  `server/src/routes/`, add your Stripe keys to `server/.env`, and mount
  it in `index.js`.

## Offline mode

Offline mode calls a local [Ollama](https://ollama.com) instance
(`OLLAMA_BASE_URL` in `server/.env`, default `http://127.0.0.1:11434`) —
no model weights are bundled with this repo. Pull whichever model you set
in the admin panel's "Ollama model tag" field before switching a chat to
Offline.

## Reference notes / RAG grounding

`server/src/notes/*.md` covers SDLC, OOP, UML, testing, Agile, design
patterns, databases, and AI/ML fundamentals, each with a "common
misconceptions" section the system prompt leans on for the
correct-wrong-answers behavior. It's indexed with SQLite FTS5 (keyword
search, not embeddings — same code path online and offline). See
`scripts/ingest-notes.md` for how to add more topics.

## Deploying as one service (e.g. for a student pilot)

For development, the backend and frontend run as two separate processes
on two ports. For deployment — putting this in front of real students
over a URL — the backend can serve the built frontend itself, so the
whole app is one process, one port, one thing to deploy:

```bash
npm run build   # from the repo root — builds desktop/dist, installs server deps
npm start       # from the repo root — serves the API AND the built frontend
```

`npm start` listens on `process.env.PORT` (most hosts set this for you;
defaults to 4317 locally) and serves the frontend from whatever origin
it's reached at — the frontend's API calls are relative (`/api/...`), so
the same build works on any domain without rebuilding.

**The one thing that matters for correctness: persistent storage.** The
usage ledger is a SQLite file at `server/data/` by default. On a host
with an ephemeral filesystem (most "free tier" containers), that file —
and every student's daily usage count — gets wiped on every
restart/redeploy. Set `DATA_DIR` in `server/.env` (or as a platform env
var) to a path backed by real persistent storage, such as a Railway or
Fly.io volume's mount path, before pointing real students at it.

Required environment variables for deployment: `ANTHROPIC_API_KEY`,
`ADMIN_TOKEN`, and `DATA_DIR` if you're using a mounted volume — set
these in the platform's dashboard/secrets, not in a committed `.env`
file.

Local development is unaffected: `scripts/dev.sh` still runs the two
pieces separately with hot reload, and Vite's dev server proxies `/api`
to the backend (`desktop/vite.config.js`) so it behaves the same way
without needing a build first.

## Packaging as a native desktop app

The frontend runs as a normal web app in development. To get an actual
installable `.exe` / `.dmg` / `.AppImage`, use the Tauri scaffold in
`desktop/src-tauri/`:

```bash
cd desktop
npm run tauri icon src-tauri/icons/icon.png   # regenerates a full, valid icon set (incl. .icns)
npm run tauri build
```

This has to run on a machine with Rust installed and (on Linux)
`webkit2gtk` — see [Tauri's prerequisites
guide](https://v2.tauri.app/start/prerequisites/). It produces a
platform-native installer for *whatever OS you build it on* — there's no
cross-compiling a Windows `.exe` from a Linux machine. Tauri's own
tooling moves fast enough that if `npm run tauri dev` complains about a
version mismatch, the more reliable fix is `npm create tauri-app@latest`
in a scratch folder and copying this project's `desktop/src/` and
`package.json` scripts into that fresh scaffold, rather than
hand-patching version numbers.

The packaged app still needs `server/` running somewhere it can reach —
either started alongside it (see the comment in
`desktop/src-tauri/src/main.rs` for where a sidecar-process launch would
go) or pointed at a server you run separately via
`desktop/.env`'s `VITE_API_BASE_URL`.

## What to build next

Per the brief, this build prioritized the core chat experience and the
usage-limit mechanic first, then filled in admin controls (settings,
notes editor, rate limits, metrics, manual tier toggle). What's still
outside the admin panel's reach, roughly in order of likely usefulness:
1. Per-user actions — reset an individual user's daily usage, ban/block a
   user, view their conversation history — the panel currently only has
   the tier toggle.
2. Real ad-network SSV verification (pick one network, fill in the stub
   in `adVerification.js`) and real Stripe subscriptions (see the
   reference file above) — both need your own external accounts, so no
   amount of admin-panel work substitutes for setting those up.
3. Admin accounts with roles and a change-audit log, instead of one
   shared `ADMIN_TOKEN`.
4. Streaming responses (currently request/response, not token-by-token).
5. Richer analytics — retention, per-topic question breakdown, exportable
   reports.
6. A sidecar-packaged Tauri build that launches `server/` automatically
   so end users never run two processes by hand.
