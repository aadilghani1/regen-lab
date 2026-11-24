# literature/

- `search-log.jsonl`: append-only log written by `regen lit search` (query, time, paper metadata).
- `notes/`: one Markdown note per paper read, from `docs/templates/literature-note.md`.

A citation becomes `verified` in `evidence/assumptions.toml` only once its note exists here.

## Local research library

Open Research in the viewer to search original paper text, reading notes, citations, and model rules. Connections link scenarios to the rules they use, rules to their cited papers, and papers to locally indexed references. A citation records a source. Its presence in the library does not verify a model rule.

Python 3.11 or later with SQLite FTS5 builds the index without a network connection. From the repository root:

```sh
python3 scripts/import-pmc.py PMC4895291.1 PMC8716110.1 PMC7935289.1
bun run library build
bun run library search "metamorphosis"
bun run library neighbors A1-nerve-dependence
```

The importer keeps the archive's original plain text in the adjacent workspace directory `.regen-paper-cache/`. Versioned source, licence and SHA-256 receipts live in `literature/full-text/`. A checkout without cached text still has the records and source links. Search-log records include related work in other species. This is a working library rather than a complete species bibliography.

The viewer build regenerates the graph. After importing papers or changing notes, run the build command again and refresh the Research page. Experiments can read `.cache/research.sqlite` with a read-only SQLite connection. The `documents` table supports full-text search; the `edges` table stores subject, relation and object IDs. Each node's JSON record includes its local text and available source metadata.

## PDF ingestion and findings

For a locally held searchable PDF, run `python3 scripts/import-pdf.py path/to/article.pdf --title "Article title" --doi "10.…"`, then rebuild. Poppler's pdftotext preserves page boundaries. Image-only scans need a searchable edition. PDF extracts stay in the local cache and appear in the local development viewer. The release build omits private PDF records and links to archived paper text. Original PMC plain text takes precedence when both editions exist.

The Research page opens with AI-assisted readings of the primary studies. Each finding in `findings.toml` identifies its source DOI, a figure or section, and text that locates the passage in the cached original. The page distinguishes what the authors observed from our proposed simulation test. Indexing uses SQLite full-text search and explicit graph edges; it does not train model weights.
