import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { counterRandom, RandomStream } from "../src/index.ts"

const streams = fc.constantFrom(...Object.values(RandomStream))

describe("counterRandom", () => {
  test("draws lie in [0, 1)", () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), streams, fc.nat(), (seed, step, stream, index) => {
        const draw = counterRandom(seed).uniform(step, stream, index)
        return draw >= 0 && draw < 1
      }),
    )
  })

  test("the same counter always gives the same draw", () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), streams, fc.nat(), (seed, step, stream, index) =>
        Object.is(
          counterRandom(seed).uniform(step, stream, index),
          counterRandom(seed).uniform(step, stream, index),
        ),
      ),
    )
  })

  test("draws are roughly uniform", () => {
    const random = counterRandom(42)
    const draws = Array.from({ length: 20000 }, (_, i) =>
      random.uniform(i, RandomStream.Division, i * 7),
    )
    const mean = draws.reduce((sum, draw) => sum + draw, 0) / draws.length
    expect(mean).toBeCloseTo(0.5, 1)
  })
})
