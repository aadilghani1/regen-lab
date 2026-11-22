# Effect-TS for the edges, plain functional TypeScript for the model core

Everything that touches the outside world (CLI, literature API, file and run storage, evidence registry loading) is written with Effect-TS, for typed errors, retries, resource safety and swappable services in tests. The model core (`packages/core`) stays plain functional TypeScript with zero dependencies, so biologists can read it, it runs unchanged in a Web Worker, and hot loops avoid effect overhead. Effect values never cross into `core`: the edges unwrap them and pass plain data in.

## Considered options

A plain `async`/`await` with a small `Result` union was simpler to learn, but was rejected in favour of Effect's typed error channels and dependency injection for the research tooling.
