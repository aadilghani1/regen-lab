import { OUTCOMES } from "@regen-lab/core"
import {
  appendSearchLog,
  Clock,
  checkEvidence,
  fileRunStore,
  Literature,
  loadCatalog,
  loadEvidence,
  loadScenario,
  ProvenanceSource,
  paperTable,
  populationOutcome,
  runExperiment,
  seedsFrom,
  sweep,
  trackRun,
  unverifiedCitations,
} from "@regen-lab/research"
import { type Scenario, withOverride, withSeed } from "@regen-lab/scenarios"
import { Console, Effect, FileSystem, Path } from "effect"
import { Argument, CliError, Command, Flag } from "effect/cli"
import { SUMMARY_HEADERS, summaryRow, table } from "./format.ts"
import { parseValue, parseValueList } from "./values.ts"

const fail = (message: string) => Effect.fail(new CliError.UserError({ cause: message }))

const scenarioArgument = Argument.String("scenario").pipe(
  Argument.withDescription("catalog name (e.g. baseline) or path to a .toml file"),
)
const outFlag = Flag.String("out").pipe(
  Flag.withDescription("directory for tracked runs"),
  Flag.withDefault("runs"),
)
const seedsFlag = Flag.Int("seeds").pipe(
  Flag.withDescription("number of consecutive seeds, starting at the scenario's seed"),
  Flag.withDefault(1),
)

const applyOverrides = (scenario: Scenario, overrides: Readonly<Record<string, string>>) =>
  Object.entries(overrides).reduce<Effect.Effect<Scenario, CliError.UserError>>(
    (current, [path, raw]) =>
      Effect.flatMap(current, (next) => {
        const result = withOverride(next, path, parseValue(raw))
        return result.ok ? Effect.succeed(result.scenario) : fail(result.issues.join("\n"))
      }),
    Effect.succeed(scenario),
  )

const runSeeds = (scenario: Scenario, seeds: number, out: string) =>
  Effect.forEach(seedsFrom(scenario.model.run.seed, seeds), (seed) => {
    const experiment = runExperiment(withSeed(scenario, seed))
    return trackRun(experiment.scenario, experiment.summary, experiment.observations).pipe(
      Effect.map(({ location }) => ({ seed, summary: experiment.summary, location })),
    )
  }).pipe(Effect.provide(fileRunStore(out)))

const scenariosCommand = Command.make("scenarios", {}, () =>
  Effect.gen(function* () {
    const catalog = yield* loadCatalog
    yield* Console.log(
      table(
        ["scenario", "expected outcome", "summary"],
        catalog.map((s) => [s.name, s.benchmark?.expectedOutcome ?? "-", s.summary]),
      ),
    )
  }),
).pipe(Command.withDescription("list the scenario catalog"))

const runCommand = Command.make(
  "run",
  {
    scenario: scenarioArgument,
    set: Flag.KeyValuePair("set").pipe(
      Flag.withDescription("override a parameter, e.g. --set model.cells.proximalSensitivity=0.8"),
      Flag.withDefault({}),
    ),
    seeds: seedsFlag,
    out: outFlag,
  },
  ({ scenario, set, seeds, out }) =>
    Effect.gen(function* () {
      const loaded = yield* applyOverrides(yield* loadScenario(scenario), set)
      const results = yield* runSeeds(loaded, seeds, out)
      yield* Console.log(
        table(
          SUMMARY_HEADERS,
          results.map((r) => summaryRow(loaded.name, r.seed, r.summary)),
        ),
      )
      for (const result of results) yield* Console.log(`tracked run: ${result.location}`)
    }),
).pipe(Command.withDescription("run a scenario and record tracked runs"))

const compareCommand = Command.make(
  "compare",
  {
    scenarios: Argument.String("scenarios").pipe(Argument.variadic()),
    seeds: seedsFlag,
    out: outFlag,
  },
  ({ scenarios, seeds, out }) =>
    Effect.gen(function* () {
      const loaded =
        scenarios.length === 0 ? yield* loadCatalog : yield* Effect.forEach(scenarios, loadScenario)
      const rows = yield* Effect.forEach(loaded, (scenario) =>
        runSeeds(scenario, seeds, out).pipe(
          Effect.map((results) => results.map((r) => summaryRow(scenario.name, r.seed, r.summary))),
        ),
      )
      yield* Console.log(table(SUMMARY_HEADERS, rows.flat()))
    }),
).pipe(Command.withDescription("run several scenarios (default: the whole catalog) side by side"))

const sweepCommand = Command.make(
  "sweep",
  {
    scenario: scenarioArgument,
    param: Flag.String("param").pipe(
      Flag.withDescription("parameter path, e.g. model.treatment.exogenousProximal"),
    ),
    values: Flag.String("values").pipe(
      Flag.withDescription("comma-separated values, e.g. 0,0.1,0.2"),
    ),
    seeds: seedsFlag,
    out: outFlag,
  },
  ({ scenario, param, values, seeds, out }) =>
    Effect.gen(function* () {
      const loaded = yield* loadScenario(scenario)
      const result = sweep(
        loaded,
        param,
        parseValueList(values),
        seedsFrom(loaded.model.run.seed, seeds),
      )
      if (!result.ok) return yield* fail(result.issues.join("\n"))
      yield* Console.log(
        table(
          [param, ...SUMMARY_HEADERS.slice(1)],
          result.points.map((p) => [
            String(p.value),
            ...summaryRow(loaded.name, p.seed, p.summary).slice(1),
          ]),
        ),
      )
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path
      const provenance = yield* (yield* ProvenanceSource).current
      const createdAt = (yield* (yield* Clock).now).toISOString()
      const file = path.join(
        out,
        "sweeps",
        `${createdAt.replaceAll(/[-:.]/g, "")}-${loaded.name}-${param}.json`,
      )
      yield* fs.makeDirectory(path.dirname(file), { recursive: true })
      yield* fs.writeFileString(
        file,
        JSON.stringify(
          { createdAt, provenance, scenario: loaded, parameter: param, points: result.points },
          null,
          2,
        ),
      )
      yield* Console.log(`tracked sweep: ${file}`)
    }),
).pipe(Command.withDescription("vary one parameter across values and seeds"))

const populationCommand = Command.make(
  "population",
  { scenario: scenarioArgument },
  ({ scenario }) =>
    Effect.gen(function* () {
      const outcome = populationOutcome(yield* loadScenario(scenario))
      yield* Console.log(
        `population model: regrew ${outcome.regrown.toFixed(1)} of ${outcome.missing.toFixed(1)} missing cells`,
      )
    }),
).pipe(Command.withDescription("run the fast population-level model"))

const searchCommand = Command.make(
  "search",
  {
    query: Argument.String("query"),
    limit: Flag.Int("limit").pipe(Flag.withDefault(25)),
    log: Flag.String("log").pipe(
      Flag.withDescription("append results to this JSONL log"),
      Flag.withDefault("literature/search-log.jsonl"),
    ),
    noLog: Flag.Boolean("no-log").pipe(Flag.withDefault(false)),
  },
  ({ query, limit, log, noLog }) =>
    Effect.gen(function* () {
      const papers = yield* (yield* Literature).search(query, limit)
      yield* Console.log(paperTable(papers))
      if (noLog) return
      const retrievedAt = (yield* (yield* Clock).now).toISOString()
      yield* Console.log(`\nlogged to ${yield* appendSearchLog(log, query, papers, retrievedAt)}`)
    }),
).pipe(Command.withDescription("search Europe PMC"))

const checkCommand = Command.make(
  "check",
  {
    registry: Flag.String("registry").pipe(Flag.withDefault("evidence/assumptions.toml")),
    showUnverified: Flag.Boolean("show-unverified").pipe(Flag.withDefault(false)),
  },
  ({ registry, showUnverified }) =>
    Effect.gen(function* () {
      const [assumptions, catalog] = yield* Effect.all([loadEvidence(registry), loadCatalog])
      const issues = checkEvidence(assumptions, catalog)
      const unverified = unverifiedCitations(assumptions)
      for (const issue of issues)
        yield* Console.error(`error  ${issue.assumption}: ${issue.problem}`)
      if (showUnverified) {
        for (const item of unverified)
          yield* Console.log(`unverified  ${item.assumption}: ${item.ref}`)
      }
      yield* Console.log(
        `${assumptions.length} assumptions, ${issues.length} errors, ${unverified.length} unverified citations`,
      )
      if (issues.length > 0) return yield* fail("evidence registry has errors")
    }),
).pipe(Command.withDescription("validate the evidence registry against the scenario catalog"))

const outcomesCommand = Command.make("outcomes", {}, () => Console.log(OUTCOMES.join("\n"))).pipe(
  Command.withDescription("list the outcome classes"),
)

export const regen = Command.make("regen").pipe(
  Command.withDescription("Regeneration Lab: simulations and research tools"),
  Command.withSubcommands([
    scenariosCommand,
    runCommand,
    compareCommand,
    sweepCommand,
    populationCommand,
    outcomesCommand,
    Command.make("lit").pipe(
      Command.withDescription("literature tools"),
      Command.withSubcommands([searchCommand]),
    ),
    Command.make("evidence").pipe(
      Command.withDescription("evidence registry tools"),
      Command.withSubcommands([checkCommand]),
    ),
  ]),
)
