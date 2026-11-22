# ADR 0001: Modular field + agent engine with an ODE companion

- Status: accepted; language and stack superseded by ADR 0002
- Date: 2026-11-22

## Context
We want simulations that are visual and explainable (individual cells deciding from local signals), but also fast enough for large parameter sweeps.

## Decision
- A **field layer** (reaction-diffusion on a lattice) and an **agent layer** (cells with state and positional identity), coupled each step in `engine.py`.
- A separate **population ODE** for sweeps, which must agree qualitatively with the agent model on the benchmarks.
- Pure Python + NumPy + Matplotlib, with no simulation framework dependency, so contributors can read everything.
- Configuration in TOML, mirrored by dataclasses, with unknown keys rejected.

## Consequences
- Easy to read and extend. Performance is fine at about 10^4 lattice sites. Larger 3D work may need a move to a framework (for example PhysiCell, Morpheus or CompuCell3D), which would be recorded in a new ADR.
- Units are arbitrary until calibrated (roadmap M1 and M5).
