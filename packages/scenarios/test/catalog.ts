import { readdirSync, readFileSync } from "node:fs"
import { catalogDirectory, parseScenarioToml, type Scenario } from "../src/index.ts"

export const catalogFiles = readdirSync(catalogDirectory).filter((file) => file.endsWith(".toml"))

export const loadCatalogScenario = (file: string): Scenario => {
  const result = parseScenarioToml(readFileSync(new URL(file, catalogDirectory), "utf8"))
  if (!result.ok) throw new Error(`${file}: ${result.issues.join("; ")}`)
  return result.scenario
}
