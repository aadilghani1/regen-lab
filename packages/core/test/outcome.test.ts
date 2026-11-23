import { describe, expect, test } from "bun:test"
import { classifyOutcome, simulate, summarize } from "../src/index.ts"

import { modelParameters } from "./fixtures.ts"

test.each([
  [84, "incomplete-regeneration"],
  [140, "uncontrolled-growth"],
] as const)("finite lattice width %i cannot establish termination", (width, expected) => {
  const parameters = modelParameters()
  const model = {
    ...parameters,
    lattice: { ...parameters.lattice, width },
    cells: { ...parameters.cells, termination: false },
    run: { ...parameters.run, steps: 800 },
  }
  const summary = summarize(model, simulate(model))
  expect(summary.stillGrowing).toBe(false)
  expect(summary.outcome).toBe(expected)
  expect(summary.terminatedAtStep).toBeNull()
})

test("records a distal overrun outside the nerve row", () => {
  const defaults = modelParameters()
  const model = {
    ...defaults,
    cells: { ...defaults.cells, termination: false },
    run: { ...defaults.run, seed: 1, steps: 228 },
  }
  const summary = summarize(model, simulate(model))
  expect(summary.finalLength).toBe(summary.originalLength)
  expect(summary.outcome).toBe("uncontrolled-growth")
})

test("rounding a cut to the intact tip leaves no wound to regenerate", () => {
  const model = modelParameters({ amputation: { level: 0.999 } })
  const summary = summarize(model, simulate(model))
  expect(summary.blastemaSize).toBe(0)
  expect(summary.regrown).toBe(0)
  expect(summary.outcome).toBe("no-regeneration")
})

describe("classifyOutcome", () => {
  test.each([
    [
      { lengthRatio: 1, blastemaSize: 20, stillGrowing: false, insufficientHistory: true },
      "incomplete-regeneration",
    ],
    [
      { lengthRatio: 1, blastemaSize: 20, stillGrowing: false, orderedIdentity: false },
      "incomplete-regeneration",
    ],
    [
      { lengthRatio: 1, blastemaSize: 20, stillGrowing: false, progenitorsExhausted: false },
      "incomplete-regeneration",
    ],
    [{ lengthRatio: 0.5, blastemaSize: 0, stillGrowing: false }, "no-regeneration"],
    [{ lengthRatio: 1.5, blastemaSize: 20, stillGrowing: true }, "uncontrolled-growth"],
    [{ lengthRatio: 0.8, blastemaSize: 20, stillGrowing: false }, "incomplete-regeneration"],
    [{ lengthRatio: 1.25, blastemaSize: 20, stillGrowing: false }, "duplication"],
    [{ lengthRatio: 1.0, blastemaSize: 20, stillGrowing: false }, "faithful-regeneration"],
    [{ lengthRatio: 1.0, blastemaSize: 20, stillGrowing: true }, "incomplete-regeneration"],
  ] as const)("%o is %s", (evidence, outcome) => {
    expect(
      classifyOutcome({ orderedIdentity: true, progenitorsExhausted: true, ...evidence }),
    ).toBe(outcome)
  })
})
