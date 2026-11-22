import { catalogDirectory, parseScenarioToml, type Scenario } from "@regen-lab/scenarios"
import { Effect, FileSystem, Path } from "effect"
import { FileUnreadable } from "./errors.ts"

const catalogPath = decodeURIComponent(catalogDirectory.pathname)

export const readScenarioFile = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const text = yield* fs
      .readFileString(path)
      .pipe(Effect.mapError((error) => new FileUnreadable({ path, issues: [String(error)] })))
    const parsed = parseScenarioToml(text)
    return parsed.ok
      ? parsed.scenario
      : yield* Effect.fail(new FileUnreadable({ path, issues: parsed.issues }))
  })

export const resolveScenarioPath = (nameOrPath: string) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    return nameOrPath.endsWith(".toml") ? nameOrPath : path.join(catalogPath, `${nameOrPath}.toml`)
  })

export const loadScenario = (nameOrPath: string) =>
  Effect.flatMap(resolveScenarioPath(nameOrPath), readScenarioFile)

export const loadCatalog = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const files = yield* fs
    .readDirectory(catalogPath)
    .pipe(
      Effect.mapError(
        (error) => new FileUnreadable({ path: catalogPath, issues: [String(error)] }),
      ),
    )
  const tomlFiles = files.filter((file) => file.endsWith(".toml")).sort()
  return yield* Effect.forEach(tomlFiles, (file) => readScenarioFile(path.join(catalogPath, file)))
}) satisfies Effect.Effect<readonly Scenario[], FileUnreadable, FileSystem.FileSystem | Path.Path>
