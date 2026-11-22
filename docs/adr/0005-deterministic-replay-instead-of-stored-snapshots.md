# Tracked runs store parameters and seed, not simulation snapshots

A tracked run records its full parameters, seed, code commit, summary and per-step observations, but no lattice snapshots. Because the random source is counter-based and the core is pure, re-simulating the recorded parameters at the recorded commit reproduces the run exactly, so the viewer's replay page re-simulates instead of loading stored frames. This keeps runs small and diffable, and makes "does this result still reproduce?" a one-click check.
