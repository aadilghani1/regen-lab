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

## Coverage and study measurements

The November 24, 2026 Europe PMC title search returned 192 records for
`(TITLE:axolotl OR TITLE:"Ambystoma mexicanum") AND (TITLE:limb OR TITLE:forelimb) AND TITLE:regenerat*`.
The search log retains the query, retrieval time and identifiers. This search misses studies that name the species or the limb only in the abstract. Preprints, journal editions and corrections can have distinct records. The count of records therefore differs from the count of experiments.

`title-screen.tsv` records the initial relevance screen. “Title match” means the publication surfaced in the search and awaits assessment. “Axolotl limb study” identifies work with axolotl limb observations. “Background or comparison” includes reviews, related species and contextual material. Ambiguous records stay under “Needs closer review.” Source identifiers resolve through the same DOI and PMID aliases as the rest of the library.

`measurements.tsv` records one useful comparison per assessed paper, the observable and its figure, dataset or section. The notes summarize study design. A blank timing review means the paper still awaits assessment for this prediction. To qualify, a cohort must be independent of model development and report first visible blastema at both cut levels on a common schedule. Record the qualification rationale under `onset_review` and give that cohort a stable `independent_cohort` identifier. Reuse the identifier for secondary publications of the same animals. The viewer counts distinct eligible cohorts. An exclusion gets a reason and no cohort identifier. The first four timing assessments come from the [original screening record](https://github.com/aadilghani1/regen-lab/blob/eacb7bb798ade4ac82e8759120198502e69f0ab9/literature/notes/cut-level-blastema-onset.md).

To restore the local paper text from all versioned receipts in a fresh checkout, run from the repository root:

```sh
for receipt in literature/full-text/*.json; do
  accession=${receipt##*/}
  python3 scripts/import-pmc.py "${accession%.json}" || break
done
bun run library build
```

For this pass, PMC imports use the archive's version 1 where available and the existing CC BY or CC0 filter. The Roy and Lévesque archive text contained only front matter, so its record remains citation-only. Archive links in the public viewer point to the original texts. Local copies can be searched offline.
