# Regeneration Lab

[![ci](https://github.com/aadilghani1/regen-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/aadilghani1/regen-lab/actions/workflows/ci.yml) [![pages](https://github.com/aadilghani1/regen-lab/actions/workflows/pages.yml/badge.svg)](https://aadilghani1.github.io/regen-lab/) [![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE) [![Docs: CC BY 4.0](https://img.shields.io/badge/docs-CC%20BY%204.0-lightgrey.svg)](LICENSE-docs.md)

An open, in-silico research lab for limb regeneration. It models how a salamander regrows exactly the limb it lost, and asks what a regeneration program would need in order to run in human tissue.

> Research model. Not medical advice. This repository is computer-only: no wet-lab or clinical protocols (see [CONSTITUTION.md](CONSTITUTION.md)).

**Try it in the browser:** https://aadilghani1.github.io/regen-lab/. Start with *Lesson 1: The limb that knows when to stop*.

## Why this exists

Six weeks ago I came across the axolotl, a salamander that can lose a leg and grow back the same leg: bone, muscle, nerves and skin, in the right order and at the right size, and then stop. I haven't been able to stop thinking about it, and I kept going round in circles: if one animal can do this, why can't we? This repository is where I'm turning that question into something that can be tested.

### The difference

When an axolotl loses a limb, skin covers the wound within hours. Cells in the stump give up their specialized jobs and gather under that skin into a **blastema**, a bud of cells that still remember where in the limb they came from. Nerves feed the bud. It grows out, rebuilds what was missing, and stops at the tip.

When a person loses a limb, the wound also closes, but connective-tissue cells fill it with scar. No blastema forms. A scar is a good short-term answer, because it seals the body fast against infection and blood loss, but nothing follows it.

### Why it looks impossible on paper

- **Scar wins the race.** In mammals, scarring starts before anything like a blastema can form. This is one explanation, and it's the one this model tests.
- **Adult human cells mostly stay in their lane.** They don't easily go back to a state where they can divide and rebuild a structure.
- **A limb isn't one tissue.** Bone, muscle, nerve, vessel and skin would all have to regrow together, in the right pattern, at the size of a human arm, over far longer than an axolotl takes.
- **Growth that doesn't stop is cancer.** Any program that restarts growth needs a reliable way to end it.
- **The experiment can't be run on people.** So a computer is the only responsible place to try out ideas first.

### Why I think it can become possible

**The parts are mostly shared.** The axolotl genome was sequenced in 2018, and most of the genes it uses to build a limb have counterparts in ours. The difference is thought to lie more in when and how those genes are switched on than in which genes exist.

**Mammals still run pieces of the program:**
- Young children can regrow a fingertip lost beyond the last joint if the wound is left to heal instead of being sewn shut.
- African spiny mice regrow skin, hair and ear tissue without scarring.
- Adult human connective-tissue cells still carry a code for where in the body they came from. A blastema relies on that same kind of positional memory.
- Adult frogs normally regrow only a spike of cartilage. In one study they regrew a more complete, partly working leg after a one-day treatment at the wound.

None of these is a regrown human limb. Together, they suggest the program isn't missing. It's switched off, interrupted, or beaten by scarring.

### The logic of this lab

This lab treats regeneration as a control system with four parts:

1. **Trigger:** a wound plus nerve signal starts a blastema instead of a scar.
2. **Progenitor pool:** blastema cells divide, but only while the right signals are present.
3. **Pattern:** each cell knows its position and builds what belongs there.
4. **Termination:** growth stops once the missing part is complete.

The axolotl runs all four. In humans the first one fails, so the other three never get a chance. That gives this lab its question: in a model that regenerates like an axolotl, which rules have to change to make it heal like a mammal? Run in reverse: what's the smallest set of changes that makes a mammal-like model regenerate faithfully while its growth still stops?

Three rules keep this honest:
- Every model rule points to a published source, or is labelled a hypothesis.
- The model must reproduce real experiments before it's trusted. For example, cutting the nerve must stop regrowth.
- Every result is a run that anyone can reproduce.

The answers describe the model, not people. Their value is in pointing out which questions deserve a real lab's time.

<details>
<summary>Further reading (not yet in the evidence registry: listed for orientation, not verified)</summary>

- Nowoshilow S. et al. (2018) The axolotl genome and the evolution of key tissue formation regulators. *Nature*. doi:10.1038/nature25458
- Gerber T. et al. (2018) Single-cell analysis uncovers convergence of cell identities during axolotl limb regeneration. *Science*. doi:10.1126/science.aaq0681
- Illingworth C.M. (1974) Trapped fingers and amputated finger tips in children. *J Pediatr Surg*. doi:10.1016/s0022-3468(74)80220-4
- Seifert A.W. et al. (2012) Skin shedding and tissue regeneration in African spiny mice (*Acomys*). *Nature*. doi:10.1038/nature11499
- Rinn J.L. et al. (2006) Anatomic demarcation by positional variation in fibroblast gene expression programs. *PLoS Genet*. doi:10.1371/journal.pgen.0020119
- Murugan N.J. et al. (2022) Acute multidrug delivery via a wearable bioreactor facilitates long-term limb regeneration and functional recovery in adult *Xenopus laevis*. *Sci Adv*. doi:10.1126/sciadv.abj2164

</details>

## What's here

| | |
|---|---|
| **Model** | Cells on a lattice read diffusing signals (nerve, distal growth, proximal), form a blastema, regrow, and terminate at the distal positional identity. Pure functional TypeScript. |
| **Benchmarks** | Five scenarios that must reproduce known observations: faithful regeneration, distal cut, denervation, proximal excess (duplication), and a no-termination negative control. |
| **Evidence** | Every model rule is linked to citations or marked as a hypothesis in `evidence/assumptions.toml`. |
| **Tools** | `regen` CLI: tracked runs, comparisons, parameter sweeps, literature search (Europe PMC), evidence checks. |
| **Viewer** | Live simulation in the browser, benchmark comparison, replay of tracked runs, and lessons. |

## Quick start

Requires [Bun](https://bun.sh) 1.4 or newer (pinned in `package.json` as `packageManager`).

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

Read [CONSTITUTION.md](CONSTITUTION.md), then [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately ([SECURITY.md](SECURITY.md)). Biologists are especially welcome to review assumptions in Discussions.

## Citing

Use the "Cite this repository" button on GitHub, or [CITATION.cff](CITATION.cff).

## License

Code: [MIT](LICENSE). Documentation, lessons and evidence notes: [CC BY 4.0](LICENSE-docs.md).
