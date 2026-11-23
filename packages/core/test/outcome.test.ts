import { describe, expect, test } from "bun:test"
import { classifyOutcome } from "../src/index.ts"

describe("classifyOutcome", () => {
  test.each([
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
