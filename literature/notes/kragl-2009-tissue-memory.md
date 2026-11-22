# Kragl 2009: Cells keep a memory of their tissue origin during axolotl limb regeneration

- Citation (full): Kragl M, Knapp D, Nacu E, Khattak S, Maden M, Epperlein HH, Tanaka EM. (2009) Cells keep a memory of their tissue origin during axolotl limb regeneration. Nature 460(7251):60-65.
- DOI / PMID: 10.1038/nature08152 / PMID 19571878
- Read by / date: AI agent (Claude), 2026-11-23, abstract only; full text not read (paywalled at Nature; no PMC copy found in Europe PMC)
- Organism and system: axolotl (*Ambystoma mexicanum*), limb regeneration, tissue tracking with an integrated GFP transgene

## Claim in one sentence

According to the abstract, each limb tissue gives rise to blastema progenitors of restricted potential rather than pluripotent cells, and positional identity is carried by some lineages (cartilage-derived) but not others (Schwann-derived).

## Evidence

From the abstract only (no figure or section could be checked):

- The major limb tissues were tracked through regeneration with an integrated GFP transgene.
- Each tissue produced progenitors with restricted potential, so the blastema is described as a heterogeneous collection of restricted progenitors.
- Cartilage-derived blastema cells carry positional identity; Schwann-cell-derived cells do not.

## Relevance to the model

- `A3-local-lineage-restricted-progenitors`: the abstract **supports** the "keep a memory of their tissue of origin" half of the statement. It does not, in the abstract, state that progenitors come from tissue next to the cut, so the "local origin" half (the half the model actually uses, via `model.cells.blastemaDepth`) is **not checked** by this reading.
- Also relevant to the pattern module: positional identity is lineage-specific here, whereas the model gives every progenitor a positional value (see `A7-shared-blastema-signalling`).

## Caveats

- Abstract only; full text not read. `verified` stays false until someone reads the Results and records the figure that shows local origin and lineage restriction.
- The model treats all progenitors as one type; the paper's main point (heterogeneous, lineage-restricted progenitors, and lineage-specific positional identity) is not represented.
