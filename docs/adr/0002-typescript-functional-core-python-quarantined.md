---
status: accepted
supersedes: the language and stack choice in ADR 0001
---

# TypeScript functional core on Bun, with Python only for omics analysis

The model, tools, CLI and browser viewer are written in functional TypeScript on Bun (pure functions, readonly types, side effects only at the edges), so that one language runs the same simulation core in the terminal, in CI and live in the browser. Python is allowed only in an isolated `py/` package for single-cell omics analysis, whose ecosystem (scanpy, AnnData) has no TypeScript equivalent; it communicates with the TypeScript side through files only. The original Python engine is ported to TypeScript, checked against its benchmark outcomes as golden references, and then deleted.

## Consequences

- Hot loops use typed arrays with local mutation inside functions whose interfaces are pure (`step(state) -> newState`), because copying immutable grids every step is too slow.
- Seeded random numbers differ between the Python and TypeScript engines, so the port is checked on benchmark outcomes (outcome class, length within tolerance), not bit-for-bit output.
