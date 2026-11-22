import type { Observation, Summary } from "@regen-lab/core"
import type { Scenario } from "@regen-lab/scenarios"
import { Context, Effect, FileSystem, Layer, Path } from "effect"
import { RunStoreFailure } from "./errors.ts"

export interface Provenance {
  readonly gitCommit: string | null
  readonly codeVersion: string
  readonly runtime: string
}

export interface TrackedRun {
  readonly id: string
  readonly createdAt: string
  readonly provenance: Provenance
  readonly scenario: Scenario
  readonly summary: Summary
  readonly observations: readonly Observation[]
}

export class ProvenanceSource extends Context.Service<
  ProvenanceSource,
  { readonly current: Effect.Effect<Provenance> }
>()("regen-lab/ProvenanceSource") {}

export class Clock extends Context.Service<Clock, { readonly now: Effect.Effect<Date> }>()(
  "regen-lab/Clock",
) {}

export class RunStore extends Context.Service<
  RunStore,
  {
    readonly save: (run: TrackedRun) => Effect.Effect<string, RunStoreFailure>
    readonly list: Effect.Effect<readonly string[], RunStoreFailure>
    readonly load: (id: string) => Effect.Effect<TrackedRun, RunStoreFailure>
  }
>()("regen-lab/RunStore") {}

export const runIdOf = (createdAt: Date, scenarioName: string, seed: number): string =>
  `${createdAt.toISOString().replaceAll(/[-:.]/g, "")}-${scenarioName}-s${seed}`

export const observationsCsv = (observations: readonly Observation[]): string =>
  [
    "step,limbLength,progenitors,divisions",
    ...observations.map((o) => `${o.step},${o.limbLength},${o.progenitors},${o.divisions}`),
  ].join("\n")

const readGitCommit = (): string | null => {
  const head = Bun.spawnSync(["git", "rev-parse", "HEAD"], { stderr: "ignore" })
  if (head.exitCode !== 0) return null
  const dirty = Bun.spawnSync(["git", "status", "--porcelain"], { stderr: "ignore" })
  return `${head.stdout.toString().trim()}${dirty.stdout.toString().trim() === "" ? "" : "-dirty"}`
}

export const gitProvenance = (codeVersion: string) =>
  Layer.succeed(ProvenanceSource, {
    current: Effect.sync(() => ({
      gitCommit: readGitCommit(),
      codeVersion,
      runtime: `bun ${Bun.version}`,
    })),
  })

export const systemClock = Layer.succeed(Clock, { now: Effect.sync(() => new Date()) })

export const fileRunStore = (root: string) =>
  Layer.effect(
    RunStore,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path
      const failure = (operation: string) => (error: unknown) =>
        new RunStoreFailure({ operation, reason: String(error) })
      return {
        save: (run) =>
          Effect.gen(function* () {
            const directory = path.join(root, run.id)
            yield* fs.makeDirectory(directory, { recursive: true })
            const { observations, ...record } = run
            yield* fs.writeFileString(
              path.join(directory, "run.json"),
              JSON.stringify(record, null, 2),
            )
            yield* fs.writeFileString(
              path.join(directory, "observations.csv"),
              observationsCsv(observations),
            )
            yield* fs.writeFileString(
              path.join(directory, "observations.json"),
              JSON.stringify(observations),
            )
            return directory
          }).pipe(Effect.mapError(failure(`save ${run.id}`))),
        list: fs.exists(root).pipe(
          Effect.flatMap((exists) => (exists ? fs.readDirectory(root) : Effect.succeed([]))),
          Effect.map((entries) => [...entries].sort()),
          Effect.mapError(failure("list")),
        ),
        load: (id) =>
          Effect.gen(function* () {
            const directory = path.join(root, id)
            const record = JSON.parse(yield* fs.readFileString(path.join(directory, "run.json")))
            const observations = JSON.parse(
              yield* fs.readFileString(path.join(directory, "observations.json")),
            )
            return { ...record, observations } as TrackedRun
          }).pipe(Effect.mapError(failure(`load ${id}`))),
      }
    }),
  )

export const trackRun = (
  scenario: Scenario,
  summary: Summary,
  observations: readonly Observation[],
) =>
  Effect.gen(function* () {
    const provenance = yield* (yield* ProvenanceSource).current
    const createdAt = yield* (yield* Clock).now
    const run: TrackedRun = {
      id: runIdOf(createdAt, scenario.name, scenario.model.run.seed),
      createdAt: createdAt.toISOString(),
      provenance,
      scenario,
      summary,
      observations,
    }
    const location = yield* (yield* RunStore).save(run)
    return { run, location }
  })
