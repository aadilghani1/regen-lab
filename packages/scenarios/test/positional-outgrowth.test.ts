import { expect, test } from "bun:test"
import { simulate, summarize } from "@regen-lab/core"
import { withSeed } from "../src/index.ts"
import { loadCatalogScenario } from "./catalog.ts"

test.each([0, 1, 2, 3, 4])(
  "anterior-only tissue recruits a blastema but fails to sustain outgrowth, seed %i",
  (seed) => {
    const endpoint = (file: string) => {
      const { model } = withSeed(loadCatalogScenario(file), seed)
      return summarize(model, simulate(model))
    }
    const paired = endpoint("baseline.toml")
    const anterior = endpoint("anterior-only.toml")
    expect(paired.outcome).toBe("faithful-regeneration")
    expect(anterior.blastemaSize).toBeGreaterThan(0)
    expect(anterior.blastemaSize).toBe(paired.blastemaSize)
    expect(anterior.regrown).toBeLessThan(paired.regrown)
    expect(anterior.outcome).toBe("incomplete-regeneration")
  },
)
