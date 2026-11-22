import type { ModelParameters } from "@regen-lab/core"
import { parse as parseToml } from "smol-toml"
import { type Scenario, scenarioSchema, toScenario } from "./schema.ts"

export type { Benchmark, Scenario, ScenarioInput } from "./schema.ts"
export { modelParametersSchema, populationParametersSchema, scenarioSchema } from "./schema.ts"

export type ParseResult =
  | { readonly ok: true; readonly scenario: Scenario }
  | { readonly ok: false; readonly issues: readonly string[] }

const describeIssues = (issues: readonly { path: readonly PropertyKey[]; message: string }[]) =>
  issues.map((issue) => `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`)

export const parseScenarioObject = (input: unknown): ParseResult => {
  const result = scenarioSchema.safeParse(input)
  return result.success
    ? { ok: true, scenario: toScenario(result.data) }
    : { ok: false, issues: describeIssues(result.error.issues) }
}

export const parseScenarioToml = (text: string): ParseResult => {
  try {
    return parseScenarioObject(parseToml(text))
  } catch (error) {
    return { ok: false, issues: [`invalid TOML: ${(error as Error).message}`] }
  }
}

export const withOverride = (scenario: Scenario, path: string, value: unknown): ParseResult => {
  const [section, ...rest] = path.split(".")
  if (section !== "model" && section !== "population") {
    return { ok: false, issues: [`override path must start with model. or population.: ${path}`] }
  }
  const draft: Record<string, unknown> = structuredClone({
    name: scenario.name,
    summary: scenario.summary,
    benchmark: scenario.benchmark,
    model: scenario.model,
    population: scenario.population,
  })
  const parent = [section, ...rest.slice(0, -1)].reduce<Record<string, unknown> | undefined>(
    (node, key) => (node?.[key] as Record<string, unknown> | undefined) ?? undefined,
    draft,
  )
  const leaf = rest.at(-1)
  if (parent === undefined || leaf === undefined || !(leaf in parent)) {
    return { ok: false, issues: [`unknown parameter: ${path}`] }
  }
  parent[leaf] = value
  return parseScenarioObject(draft)
}

export const withSeed = (scenario: Scenario, seed: number): Scenario => ({
  ...scenario,
  model: { ...scenario.model, run: { ...scenario.model.run, seed } } satisfies ModelParameters,
})

export const catalogDirectory = new URL("../catalog/", import.meta.url)
