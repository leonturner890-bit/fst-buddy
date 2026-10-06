// One-off script: rebuilds the notes_fts index from scratch. Useful after
// editing existing note files (server startup only auto-indexes when the
// table is empty). Run with: npm run reindex-notes
import './db.js';
import { ingestNotes } from './services/rag.js';

const result = ingestNotes({ force: true });
console.log(`Re-indexed ${result.rows} sections from ${result.files} files.`);
