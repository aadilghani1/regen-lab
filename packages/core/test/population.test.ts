import { describe, expect, test } from "bun:test"
import { simulatePopulation } from "../src/index.ts"
import { populationParameters } from "./fixtures.ts"

const finalLength = (trajectory: { regrownLength: Float64Array }) =>
  trajectory.regrownLength[trajectory.regrownLength.length - 1]

describe("population model", () => {
  test("regrows the missing length", () => {
    expect(finalLength(simulatePopulation(populationParameters(), 40))).toBeCloseTo(40, -1)
  })

  test("does not regrow without nerve supply", () => {
    expect(
      finalLength(simulatePopulation(populationParameters({ nerveSupply: 0 }), 40)),
    ).toBeLessThan(1)
  })

  test("overshoots without termination", () => {
    const trajectory = simulatePopulation(
      populationParameters({ termination: false, duration: 200 }),
      40,
    )
    expect(finalLength(trajectory)).toBeGreaterThan(60)
  })
})
