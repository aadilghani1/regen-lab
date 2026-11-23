# Roadmap

Each milestone is done when its benchmarks pass and its assumptions are verified.

## North star

**Goal.** Explain which changes to the four modules are sufficient, in this model, for a mammal-like starting state to regenerate with ordered pattern and termination. Test that explanation against independent observations before interpreting it across species.

**Metric.** Report the fraction of preregistered, held-out experimental contrasts whose predicted direction and endpoint both match the source. The denominator includes every contrast due for evaluation, including misses and unresolved cases. Count each independent contrast once. Seeds measure simulation variability. A control or observation used to design or tune a rule earns no prediction credit.

**First target.** Resolve three held-out contrasts spanning at least two modules and match all three with one frozen model version. Before inspecting the held-out results, record the source-selection rule, expected directions, endpoint, horizon, seeds and parameter range. Count a match only when the registered controls pass across that range and the no-termination control remains detectable. Report the numerator, denominator and failures together. Current score: **0 confirmed matches / 1 due** (0 misses, 1 unresolved). The [cut-level onset comparison](experiments/blastema-onset/report.md) passed its simulation controls and awaits paired biological onset observations. The five foundation benchmarks and first M1 control are development evidence.

## v0.2: Foundations (this release)
- [x] Pure TypeScript core, Effect edges, TOML scenarios, property tests
- [x] Benchmarks: faithful regeneration, distal cut, denervation, proximal excess, no-termination control
- [x] Parity with the original Python engine on every benchmark (`packages/scenarios/golden/`)
- [x] CLI, tracked runs, literature search, evidence registry
- [x] Viewer on GitHub Pages and lesson 1
- [ ] Verify every citation in `evidence/assumptions.toml` (one literature note each)

## M1: Pattern
- [ ] Anterior–posterior axis with two-sided signalling. Benchmark: removing one side blocks outgrowth.
- [ ] Accessory-limb benchmark: a lateral wound plus a rerouted nerve plus opposing positional cells gives ectopic outgrowth.
- [ ] Lesson 2: positional memory.

## M2: Trigger and immune layer
- [ ] Macrophage agents. Benchmark: depletion leads to a scar-like outcome (assumption A6).
- [ ] Explicit fibrosis state competing with blastema formation (the mammalian default).

## M3: Progenitor pool and lineages
- [ ] Lineage-restricted progenitors (assumption A3).
- [ ] A cell-cycle brake parameter for comparing salamander-like and mammal-like proliferation control.

## M4: Mammal-like mode
- [ ] Scenario preset with mammal-like defaults: fast fibrosis, strong cell-cycle brakes, no blastema.
- [ ] Question: what is the minimal set of module changes that flips the mammal-like preset to faithful regeneration while termination stays intact? Answer with sweeps, and report negative results too.

## M5: Data
- [ ] Dataset registry (`data/registry.toml`) for public single-cell atlases. Analysis lives in `py/` (ADR 0002).
- [ ] Calibration: fit model units to measured blastema growth curves.
