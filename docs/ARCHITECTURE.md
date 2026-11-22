# Architecture

## Packages

```
packages/core        pure model: zero dependencies, no I/O
packages/scenarios   TOML catalog + Zod schema → typed scenarios; golden reference outcomes
packages/research    Effect services: literature search, evidence registry, scenario files, tracked runs
packages/cli         `regen`: Effect CLI over research + core
packages/viewer      Vite + React + TanStack; runs core in Web Workers
```

Dependencies only point downward: `viewer → scenarios → core` and `cli → research → scenarios → core`. The viewer never imports `research`, because research needs Bun and the file system.

## The model (packages/core)

| Layer | File | Represents |
|---|---|---|
| Lattice | `lattice.ts` | Grid geometry: width × height sites, the limb band, the nerve row |
| Tissue | `tissue.ts` | Struct-of-arrays cell state: kind (empty, differentiated, progenitor), positional identity, innervation, crowding |
| Signals | `signals.ts`, `fluxes.ts` | Reaction-diffusion of the nerve signal, distal growth signal and proximal signal, with sources and sinks emitted by cells |
| Cell rules | `cell-rules.ts` | Blastema formation, division, patterning, termination, reinnervation |
| Simulation | `simulation.ts` | `initialize`, pure `step`, fast `advance`/`createStepper`, `simulate` |
| Outcomes | `outcome.ts` | Summary metrics and the five outcome classes |
| Population | `population.ts` | ODE model of wound, progenitor and differentiated pools (RK4) for fast checks |

### One step

1. Copy the previous state into a target buffer.
2. Cells emit fluxes: nerves produce the nerve signal, the growing face produces the distal growth signal and degrades the proximal signal, and differentiated limb cells produce the proximal signal (more strongly near the shoulder).
3. Signals react and diffuse for `substeps` explicit Euler substeps (no-flux boundaries, stable when diffusion × timeStep ≤ 0.25).
4. At `woundHealingSteps`, stump cells near the cut that have enough nerve signal become progenitors, shifted proximally by any excess proximal signal.
5. Progenitors visit in a random order. Each one terminates (at identity 1), divides (with probability gated by the nerve and distal growth signals, placing a distal daughter with identity + 1/limbLength), or differentiates after waiting `differentiationDelay` steps with no free neighbour.
6. Nerves extend along the nerve row into new tissue.

### Ownership and memory

- `step(parameters, state)` allocates fresh buffers and never mutates its input. It's the reference implementation.
- `advance(parameters, state, n)` and `createStepper(parameters).advance(...)` reuse two preallocated buffer sets (ping-pong). A state returned by a stepper stays valid only until that stepper's next call. Copy it if you need to keep it (the viewer copies each state into a recycled frame).
- Randomness is counter-based (`counterRandom(seed).uniform(step, stream, index)`), so any step can be reproduced on its own. `RandomSource` is an interface, so the generator is swappable.

## Edges (research, cli)

Effect services, each swappable in tests: `Literature` (Europe PMC over `HttpClient`), `RunStore` (files under `runs/`), `ProvenanceSource` (git commit, code version, runtime) and `Clock`. Domain errors are tagged (`LiteratureUnavailable`, `FileUnreadable`, `RunStoreFailure`) and rendered as readable CLI messages.

## Viewer

- A **simulation worker** owns a stepper and posts frames (typed arrays) with their buffers *transferred*. The main thread paints them to canvas and transfers them back for reuse, so steady-state playback allocates no frame memory.
- A **batch worker** runs whole simulations for the compare and replay pages (wrapped in TanStack Query).
- URLs carry the experiment (`#/scenario/baseline?denervate=true&seed=3`), so a link reproduces an exploration.

## Model limits

- 2D lattice with one proximal–distal axis. No anterior–posterior or dorsal–ventral patterning yet.
- One generic tissue: no separate muscle, cartilage, skin or vessel lineages.
- No immune layer, even though macrophages are required in vivo (assumption A6).
- Arbitrary units until a cited calibration exists.
- Outcome classes depend on run length. A slow regenerate can still be growing at the last step and is then classed as uncontrolled growth.

## Extending

- **New signal:** add its parameters to the schema and `SignalParameters`, its name to `SIGNAL_NAMES`, and its fluxes in `emitFluxesInto`.
- **New cell state or lineage:** add it to `CellKind`, give it rules in `cell-rules.ts`, a case in `cellAt`, and a colour in the viewer palette.
- **New layer** (e.g. immune cells): its own module and parameters, coupled in `stepInto`.

Every extension ships with an assumption entry and a benchmark.
