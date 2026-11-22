import { describe, expect, test } from "bun:test"
import { parseScenarioObject, parseScenarioToml, withOverride } from "../src/index.ts"
import { catalogFiles, loadCatalogScenario } from "./catalog.ts"

describe("catalog", () => {
  test.each(catalogFiles)("%s parses and names a benchmark", (file) => {
    const scenario = loadCatalogScenario(file)
    expect(`${scenario.name}.toml`).toBe(file)
    expect(scenario.benchmark).toBeDefined()
  })
})

describe("scenario schema", () => {
  test("fills every parameter from defaults", () => {
    const result = parseScenarioObject({ name: "minimal", summary: "defaults only" })
    expect(result.ok && result.scenario.model.cells.termination).toBe(true)
  })

  test("rejects unknown parameters", () => {
    const result = parseScenarioObject({
      name: "typo",
      summary: "misspelled key",
      model: { cells: { terminaton: false } },
    })
    expect(result.ok).toBe(false)
  })

  test("rejects an unstable diffusion time step", () => {
    const result = parseScenarioObject({
      name: "unstable",
      summary: "too large a time step",
      model: { signals: { timeStep: 0.5 } },
    })
    expect(result.ok).toBe(false)
  })

  test("reports invalid TOML instead of throwing", () => {
    expect(parseScenarioToml("name = ").ok).toBe(false)
  })
})

describe("withOverride", () => {
  const baseline = loadCatalogScenario("baseline.toml")

  test("replaces one parameter and revalidates", () => {
    const result = withOverride(baseline, "model.cells.proximalSensitivity", 0.8)
    expect(result.ok && result.scenario.model.cells.proximalSensitivity).toBe(0.8)
  })

  test("rejects unknown paths", () => {
    expect(withOverride(baseline, "model.cells.nope", 1).ok).toBe(false)
    expect(withOverride(baseline, "cells.termination", false).ok).toBe(false)
  })

  test("rejects invalid values", () => {
    expect(withOverride(baseline, "model.amputation.level", 2).ok).toBe(false)
  })
})
