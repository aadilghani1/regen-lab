import { describe, expect, test } from "bun:test"
import { type Outcome, simulate, summarize } from "@regen-lab/core"
import golden from "../golden/python-reference.json"
import { withSeed } from "../src/index.ts"
import { catalogFiles, loadCatalogScenario } from "./catalog.ts"

const pythonNames: Record<string, string> = {
  "distal-cut": "distal_cut",
  "no-termination": "no_termination",
  "proximal-excess": "ra_proximalized",
}

const pythonOutcomes: Record<string, Outcome> = {
  faithful: "faithful-regeneration",
  no_regeneration: "no-regeneration",
  duplication: "duplication",
  uncontrolled_growth: "uncontrolled-growth",
}

type GoldenRow = { seed: number; outcome: string; finalLength: number }
const goldenRows = golden.scenarios as Record<string, GoldenRow[]>

const SEEDS = [0, 1, 2, 3, 4]

const catalog = catalogFiles.map(loadCatalogScenario)

test("every Python reference scenario has a catalog counterpart", () => {
  const names = catalog.map(({ name }) => pythonNames[name] ?? name)
  for (const name of Object.keys(goldenRows)) expect(names).toContain(name)
})

describe.each(catalog)("benchmark $name", (scenario) => {
  const reference = goldenRows[pythonNames[scenario.name] ?? scenario.name]
  const summaries = SEEDS.map((seed) => {
    const seeded = withSeed(scenario, seed)
    return summarize(seeded.model, simulate(seeded.model))
  })

  test("reproduces its expected outcome on every seed", () => {
    const expected = scenario.benchmark?.expectedOutcome
    expect(expected).toBeDefined()
    for (const summary of summaries) expect<Outcome | undefined>(summary.outcome).toBe(expected)
  })

  if (!reference) return
  const lengths = reference.map((row) => row.finalLength)

  test("matches the Python golden reference", () => {
    expect(reference.length).toBe(SEEDS.length)
    for (const summary of summaries) {
      expect<Outcome | undefined>(summary.outcome).toBe(pythonOutcomes[reference[0]?.outcome ?? ""])
      expect(summary.finalLength).toBeGreaterThanOrEqual(Math.min(...lengths) * 0.9)
      expect(summary.finalLength).toBeLessThanOrEqual(Math.max(...lengths) * 1.1)
    }
  })
})
