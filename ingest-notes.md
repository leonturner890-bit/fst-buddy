# Extending the reference-notes corpus

FST Buddy grounds its answers in `server/src/notes/*.md`, indexed into a
SQLite FTS5 table on server startup (`server/src/services/rag.js`).

## Format each file follows

```markdown
# Topic Title

## A section heading
Body text for this section. This whole block becomes one retrievable
passage, so keep each section focused on one idea — a few paragraphs is
the right size, not a whole chapter.

## Another section heading
...
```

Each `##` section becomes one row in the search index, tagged with the
file's `#` title and that section's heading. Retrieval is plain keyword
search (FTS5 `bm25`), not embeddings — no extra service to run, and it
works identically online and offline.

## Adding more topics

1. Drop a new `.md` file into `server/src/notes/`, following the format
   above.
2. Restart the server (`npm run dev` in `server/`) — `ingestNotes()` runs
   on boot and will pick it up automatically the first time (it only
   re-indexes automatically when the table is empty).
3. To force a full re-index after editing existing notes (not just adding
   new files), call `ingestNotes({ force: true })` — e.g. temporarily add
   that call in `server/src/index.js`, run once, then remove it again. A
   small `npm run reindex-notes` script is a reasonable thing to add if
   you're editing notes often.

## Pulling from real web sources

If you want the corpus grounded in specific external material (course
slides, a textbook's companion site, documentation), the simplest path is
manual: read the source, and write your own paraphrased summary into a
`.md` file in this format — this also keeps you clear of copyright
issues that come with ingesting other people's text verbatim. If you want
this automated later, a `fetch → extract text → summarize into sections`
pipeline slots in as a script that writes new `.md` files into this same
folder; the ingestion/indexing side already handles anything dropped in.
