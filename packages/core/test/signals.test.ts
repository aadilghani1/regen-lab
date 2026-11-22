import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { createLattice, reactDiffuseInto, totalOf } from "../src/index.ts"

const lattice = createLattice({
  width: 17,
  height: 11,
  limbWidth: 3,
  limbLength: 10,
  bodyWallEnd: 2,
})
const zeros = () => new Float64Array(lattice.size)
const fieldArbitrary = fc
  .array(fc.double({ min: 0, max: 100, noNaN: true }), {
    minLength: lattice.size,
    maxLength: lattice.size,
  })
  .map((values) => Float64Array.from(values))

const diffuse = (field: Float64Array, steps: number, decay = 0) => {
  const parameters = { diffusion: 1, decay, production: 0 }
  for (let i = 0; i < steps; i++) {
    reactDiffuseInto(lattice, field, parameters, 0.2, zeros(), zeros(), zeros())
  }
  return field
}

describe("reaction-diffusion", () => {
  test("without decay or production, total signal is conserved", () => {
    fc.assert(
      fc.property(fieldArbitrary, fc.integer({ min: 1, max: 20 }), (field, steps) => {
        const before = totalOf(field)
        const after = totalOf(diffuse(field, steps))
        return Math.abs(after - before) <= 1e-9 * Math.max(1, before)
      }),
    )
  })

  test("signal never becomes negative", () => {
    fc.assert(
      fc.property(fieldArbitrary, (field) => diffuse(field, 10, 0.5).every((value) => value >= 0)),
    )
  })

  test("a uniform field stays uniform", () => {
    const field = diffuse(new Float64Array(lattice.size).fill(3), 25)
    expect(field.every((value) => Math.abs(value - 3) < 1e-12)).toBe(true)
  })

  test("a point source spreads to its neighbours", () => {
    const field = zeros()
    const centre = 5 * lattice.width + 8
    field[centre] = 10
    diffuse(field, 1)
    expect(field[centre]).toBeLessThan(10)
    expect(field[centre + 1]).toBeGreaterThan(0)
  })
})
