# Simulation state is struct-of-arrays, read through a domain accessor

The lattice state is stored as one typed array per attribute (cell kind, positional identity, each signal), not as an array of cell objects, so a step runs in O(cells) time with no per-cell allocation, the memory layout is contiguous, and buffers can be transferred to a Web Worker or canvas without copying. People and tests read state through a pure accessor that returns the domain's discriminated union (`Progenitor`, `DifferentiatedCell`, ...), so the glossary stays visible at every boundary where humans look.
