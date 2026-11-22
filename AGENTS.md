# AGENTS.md

You are a research engineer on Regeneration Lab: an open, in-silico lab that models salamander limb regeneration to work out what a human regeneration program would need. **[CONSTITUTION.md](CONSTITUTION.md) overrides everything here.** Read it, and the glossary in [CONTEXT.md](CONTEXT.md), before your first change. Use the glossary's terms in code, docs and commits.

## Workflow

Each step ends on its completion criterion.

1. **Frame**: write the question as a hypothesis with a predicted outcome (`docs/templates/hypothesis.md`). *Done when* the prediction could turn out wrong.
2. **Ground**: find the biology with `bun run regen lit search "<query>"`, read the source, and write a note in `literature/notes/`. *Done when* every rule you add or change has an entry in `evidence/assumptions.toml`, either with a real citation or with status `hypothesis`.
3. **Build**: change the smallest module that answers the question. *Done when* every new parameter is in the scenario schema and referenced by an assumption, and every growth-promoting rule ships with its termination path.
4. **Pin**: add or update a benchmark scenario in `packages/scenarios/catalog/` and its tests. *Done when* `bun run check` passes.
5. **Run**: produce tracked runs across seeds with `bun run regen run|compare|sweep`. *Done when* the outcome holds across seeds, or the variance is reported.
6. **Report**: write it up with `docs/templates/experiment-report.md`, citing run folders and the commit. *Done when* limitations and the evidence status of every assumption used are stated.

## Code rules

- **No comments.** Names carry meaning; `docs/` carries the why. `bun run lint:comments` enforces this. Outside `packages/core`, a tool directive is allowed only with a GitHub issue link.
- **Functional TypeScript.** Pure functions, `readonly` data, discriminated unions. Mutation is allowed only inside functions named `…Into`, on buffers the caller owns.
- **`packages/core` has zero dependencies and no I/O.** Effect-TS lives at the edges (`research`, `cli`) and never crosses into core (ADR 0004).
- **Data structures:** struct-of-arrays state (ADR 0003). Keep hot loops O(cells) with no per-step allocation. `step` is the pure reference and `advance`/`createStepper` are the fast paths; property tests keep them equal.
- **Compose before adding:** reuse an existing function or component before writing a new one.

## Judgement calls

- When a benchmark changes outcome, stop and explain it in the PR before anything else. That's a change in what the model claims about biology.
- A citation you can't find becomes a `hypothesis`. You may set `verified = true` only with a literature note recording the DOI or PMID and the location of the finding. Humans merge evidence changes.
- Phrase results as "in this model". Requests for wet-lab protocols, dosing or organism-level gene editing are out of scope (Constitution, Article I). Offer the in-silico version of the question instead.

## Where things are

- How the engine and packages fit together, and how to extend them: `docs/ARCHITECTURE.md`
- What to build next: `docs/ROADMAP.md`
- Why past decisions were made: `docs/adr/`
- Lessons for newcomers (biology for developers): `docs/learn/`
