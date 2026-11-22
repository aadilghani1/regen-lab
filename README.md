# Regeneration Lab

An open, in-silico research lab for limb regeneration. It models how a salamander regrows exactly the limb it lost, and asks what a regeneration program would need in order to run in human tissue.

> Research model. Not medical advice. This repository is computer-only: no wet-lab or clinical protocols (see [CONSTITUTION.md](CONSTITUTION.md)).

**Try it in the browser:** https://aadilghani1.github.io/regen-lab/ (once Pages is enabled). Start with *Lesson 1: The limb that knows when to stop*.

## What's here

| | |
|---|---|
| **Model** | Cells on a lattice read diffusing signals (nerve, distal growth, proximal), form a blastema, regrow, and terminate at the distal positional identity. Pure functional TypeScript. |
| **Benchmarks** | Five scenarios that must reproduce known observations: faithful regeneration, distal cut, denervation, proximal excess (duplication), and a no-termination negative control. |
| **Evidence** | Every model rule is linked to citations or marked as a hypothesis in `evidence/assumptions.toml`. |
| **Tools** | `regen` CLI: tracked runs, comparisons, parameter sweeps, literature search (Europe PMC), evidence checks. |
| **Viewer** | Live simulation in the browser, benchmark comparison, replay of tracked runs, and lessons. |

## Quick start

Requires [Bun](https://bun.sh) 1.2 or newer.

```bash
bun install
bun run check                       # typecheck, lint, no-comments check, tests, performance budget
bun run regen scenarios             # list benchmarks
bun run regen run baseline --seeds 3
bun run regen run baseline --set model.treatment.denervate=true
bun run regen sweep baseline --param model.treatment.exogenousProximal --values 0,0.1,0.2,0.3 --seeds 3
bun run regen lit search "axolotl blastema positional memory"
bun run regen evidence check --show-unverified
bun run dev:viewer                  # http://localhost:5173
```

## Repository map

| Path | What |
|---|---|
| `packages/core` | The model: zero dependencies, no I/O |
| `packages/scenarios` | Benchmark catalog (TOML), schema, and the Python golden reference |
| `packages/research` | Effect services: literature, evidence, tracked runs |
| `packages/cli` | The `regen` command |
| `packages/viewer` | The browser app |
| `evidence/` | Assumptions and their citations |
| `literature/` | Search log and per-paper notes |
| `docs/learn/` | Lessons: biology explained for developers |
| `docs/` | Architecture, roadmap, decision records (`adr/`), templates |
| `CONTEXT.md` | Glossary: the project's shared vocabulary |
| `AGENTS.md` | Guide for AI agents working in this repo |

## Contributing

Read [CONSTITUTION.md](CONSTITUTION.md), then [CONTRIBUTING.md](CONTRIBUTING.md). Biologists are especially welcome to review assumptions in Discussions.

## License

Code: [MIT](LICENSE). Documentation, lessons and evidence notes: [CC BY 4.0](LICENSE-docs.md).
