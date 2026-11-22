# Contributing

1. Read [CONSTITUTION.md](CONSTITUTION.md) and the glossary in [CONTEXT.md](CONTEXT.md). AI agents also read [AGENTS.md](AGENTS.md).
2. Open an issue from a template (hypothesis, model change or literature), or start a Discussion if you're a biologist reviewing assumptions.
3. Run `bun install`, then make your change.
4. Before pushing: `bun run check && bun run regen evidence check`.
5. In the PR, name the module touched, the assumptions added or changed, and any benchmark whose outcome moved.

Good first contribution: verify one citation in `evidence/assumptions.toml`. Read the paper, write a note in `literature/notes/` from `docs/templates/literature-note.md`, then add the DOI or PMID and set `verified = true`.
