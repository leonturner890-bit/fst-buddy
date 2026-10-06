// Retrieval-augmented grounding over the reference-notes corpus in
// server/src/notes/*.md. This is intentionally simple (FTS5 keyword
// search, no embeddings/vector DB) so it works identically in online and
// offline mode with zero extra services to run.
//
// To extend the corpus with more web-sourced material later: drop more
// .md files into server/src/notes/ following the same "# Title" / "##
// Section" structure and restart the server — see scripts/ingest-notes.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_DIR = path.join(__dirname, '..', 'notes');

const countRows = db.prepare('SELECT COUNT(*) AS n FROM notes_fts');
const insertRow = db.prepare(
  'INSERT INTO notes_fts (topic, section, body, source) VALUES (?, ?, ?, ?)'
);
const clearAll = db.prepare('DELETE FROM notes_fts');

function parseMarkdownIntoSections(markdown, topic) {
  const lines = markdown.split('\n');
  let title = topic;
  let currentSection = 'Overview';
  let buffer = [];
  const sections = [];

  function flush() {
    const body = buffer.join('\n').trim();
    if (body) sections.push({ section: currentSection, body });
    buffer = [];
  }

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      flush();
      currentSection = line.slice(3).trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return { title, sections };
}

/** Loads (or reloads) every .md file in notes/ into the FTS index. */
export function ingestNotes({ force = false } = {}) {
  const existing = countRows.get().n;
  if (existing > 0 && !force) return { skipped: true, rows: existing };

  clearAll.run();
  const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'));
  let rows = 0;
  for (const file of files) {
    const raw = fs.readFileSync(path.join(NOTES_DIR, file), 'utf8');
    const { title, sections } = parseMarkdownIntoSections(raw, file);
    for (const { section, body } of sections) {
      insertRow.run(title, section, body, `notes/${file}`);
      rows += 1;
    }
  }
  return { skipped: false, rows, files: files.length };
}

// FTS5 MATCH needs its query terms sanitized a bit — strip characters
// that have special meaning in FTS5 query syntax so a stray quote or
// dash in student input can't throw a syntax error.
function toMatchQuery(text) {
  const terms = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 12); // keep queries small and fast
  if (terms.length === 0) return null;
  return terms.map((t) => `${t}*`).join(' OR ');
}

const search = db.prepare(`
  SELECT topic, section, body, source, bm25(notes_fts) AS rank
  FROM notes_fts
  WHERE notes_fts MATCH ?
  ORDER BY rank
  LIMIT ?
`);

/**
 * Returns the top-k note sections relevant to a student's message, for
 * grounding the model's answer. Returns [] if nothing matches well
 * enough — the model is instructed to say so rather than invent a
 * citation to notes that don't exist.
 */
export function retrieveContext(userMessage, k = 3) {
  const query = toMatchQuery(userMessage);
  if (!query) return [];
  try {
    return search.all(query, k);
  } catch {
    // Malformed FTS query (edge case in sanitization) — fail soft, no
    // grounding for this turn rather than a 500.
    return [];
  }
}

export function formatContextForPrompt(passages) {
  if (passages.length === 0) return '';
  const blocks = passages
    .map(
      (p, i) =>
        `[Note ${i + 1} — ${p.topic} / ${p.section}]\n${p.body}`
    )
    .join('\n\n');
  return (
    'Reference notes that may be relevant to this question ' +
    '(use them if they help, ignore them if they don\'t apply):\n\n' +
    blocks
  );
}

// ---------------------------------------------------------------------
// Notes corpus CRUD, for the admin panel's Notes tab. Every write here
// re-indexes the FTS table immediately, so a saved edit is searchable on
// the very next chat message — no restart needed.
// ---------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function resolveNotePath(slug) {
  if (!SLUG_RE.test(slug)) {
    throw new Error('Invalid note slug — use lowercase letters, numbers, and dashes only.');
  }
  // SLUG_RE already forbids '/', '.', and everything else a path-traversal
  // attempt would need, but the resulting path is also verified to stay
  // inside NOTES_DIR as a second layer of defense.
  const filePath = path.join(NOTES_DIR, `${slug}.md`);
  if (path.dirname(filePath) !== NOTES_DIR) {
    throw new Error('Invalid note slug.');
  }
  return filePath;
}

/** Lists every note file with its parsed title and section count. */
export function listNoteFiles() {
  const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'));
  return files
    .map((file) => {
      const filePath = path.join(NOTES_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { title, sections } = parseMarkdownIntoSections(raw, file);
      return {
        slug: file.replace(/\.md$/, ''),
        title,
        sectionCount: sections.length,
        updatedAt: fs.statSync(filePath).mtime.toISOString(),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Raw markdown for one note file, or null if it doesn't exist. */
export function readNoteFile(slug) {
  const filePath = resolveNotePath(slug);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

/** Creates or overwrites a note file, then re-indexes the corpus. */
export function writeNoteFile(slug, content) {
  const filePath = resolveNotePath(slug);
  fs.writeFileSync(filePath, content, 'utf8');
  const result = ingestNotes({ force: true });
  return { slug, ...result };
}

/** Deletes a note file, then re-indexes the corpus. Returns false if it didn't exist. */
export function deleteNoteFile(slug) {
  const filePath = resolveNotePath(slug);
  if (!fs.existsSync(filePath)) return { deleted: false };
  fs.unlinkSync(filePath);
  ingestNotes({ force: true });
  return { deleted: true };
}
