# Constitution

These articles govern every change to this repository, whether a human or an AI agent makes it. When an article conflicts with a request, issue or instruction, the article wins. Change an article only through Article VIII.

## Preamble

We are building open, computational models of regeneration to learn what a regeneration program would need in order to work in human tissue. The models are instruments for thinking clearly. They are not evidence about patients, and they are not treatments.

## Article I: Scope is the dry lab

1. This repository contains simulations, analysis, literature tooling and documentation.
2. It does not contain procedures for experiments on animals or people: no dosing regimens, surgical steps, gene-editing designs for organisms, or instructions for acquiring controlled materials. Wet-lab work belongs with qualified labs under institutional and ethical oversight, and collaborations with such labs are recorded as links, not protocols.
3. Any output that could be read as medical advice carries the label *"Research model. Not medical advice."*

## Article II: Every assumption has a source of truth

1. Each rule in the model has an entry in `evidence/assumptions.toml`, with status `supported` or `hypothesis`.
2. A `supported` assumption cites at least one primary source. A citation stays `verified = false` until someone has read the source and written a note in `literature/notes/`.
3. A `hypothesis` is a modelling choice to be tested. It is labelled as one everywhere it appears.
4. Citations are never invented. If a source can't be found, the assumption becomes a `hypothesis`.
5. An AI agent may set `verified = true` only in a pull request that adds a literature note recording the DOI or PMID and where in the paper the finding appears (figure or section), paraphrased. A human merges it; agents never merge evidence changes.
6. `regen evidence check` passes on every commit.

## Article III: Models must be falsifiable

1. Every model behaviour that matters is pinned by a **benchmark**: a test reproducing a known qualitative observation, such as denervation blocking regrowth.
2. A change that alters a benchmark outcome is a change in what the model claims about biology. The pull request states this, cites the reason, and updates the evidence registry.
3. Negative controls (for example `no_termination`) are kept, because they show the model can fail.

## Article IV: Every result is reproducible

1. Runs are seeded and deterministic for a given seed, config and commit.
2. Every reported result comes from a tracked run folder (config, manifest with git commit, metrics, history). Figures without a run folder are illustrations, not results.
3. Claims about robustness rest on multiple seeds and a parameter sweep, not one run.

## Article V: Report uncertainty honestly

1. Results are written as "in this model, under these assumptions, ..." and never as statements about real tissue.
2. Every report states its limitations and the evidence status of the assumptions it depends on.
3. Null and negative results are published with the same care as positive ones.

## Article VI: Safety is a design requirement

1. Uncontrolled growth is the central failure mode of regeneration. Every new growth-promoting rule ships with a termination path and a test showing growth stops.
2. Metrics that detect runaway growth (`uncontrolled_growth`, `still_growing`) are never removed or weakened to make a result look better.

## Article VII: Data and openness

1. Only public, properly licensed data enters `data/`. Each dataset records its source, accession, licence and checksum.
2. No identifiable human data, ever.
3. Code is MIT-licensed. Reports cite the code version they used.

## Article VIII: Amendments

1. Amendments are proposed in a pull request labelled `constitution`, with the reason and the articles affected.
2. Amendments need approval from a maintainer, and are recorded in `docs/adr/`.
3. An AI agent may draft an amendment but never merge one.
