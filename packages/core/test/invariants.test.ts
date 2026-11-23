import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  CellKind,
  createLattice,
  indexOf,
  type ModelParameters,
  simulate,
  summarize,
  type Trajectory,
} from "../src/index.ts"
import { modelParameters } from "./fixtures.ts"

const untreated = (seed: number, level: number): ModelParameters =>
  modelParameters({ amputation: { level }, run: { seed, steps: 800, warmupSteps: 150 } })

const nerveRowIdentities = (
  parameters: ModelParameters,
  trajectory: Trajectory,
  length: number,
) => {
  const lattice = createLattice(parameters.lattice)
  return Array.from(
    { length },
    (_, offset) =>
      trajectory.final.tissue.positionalIdentity[
        indexOf(lattice, lattice.bodyWallEnd + offset, lattice.nerveRow)
      ],
  )
}

const cellsOutsideLimbBand = (parameters: ModelParameters, trajectory: Trajectory) => {
  const lattice = createLattice(parameters.lattice)
  let count = 0
  for (let y = 0; y < lattice.height; y++) {
    if (y >= lattice.bandStart && y < lattice.bandEnd) continue
    for (let x = lattice.bodyWallEnd; x < lattice.width; x++) {
      if (trajectory.final.tissue.kind[indexOf(lattice, x, y)] !== CellKind.Empty) count++
    }
  }
  return count
}

describe("invariants of untreated regeneration", () => {
  test("sampled amputation levels regenerate faithfully within 800 steps, with ordered positional identity, inside the limb", () => {
    fc.assert(
      fc.property(
        fc.nat(10_000),
        fc.double({ min: 0.2, max: 0.85, noNaN: true }),
        (seed, level) => {
          const parameters = untreated(seed, level)
          const trajectory = simulate(parameters)
          const summary = summarize(parameters, trajectory)
          expect(summary.outcome).toBe("faithful-regeneration")
          const identities = nerveRowIdentities(parameters, trajectory, summary.finalLength)
          expect(identities.every((value, i) => i === 0 || value >= identities[i - 1])).toBe(true)
          expect(cellsOutsideLimbBand(parameters, trajectory)).toBe(0)
        },
      ),
      { numRuns: 6 },
    )
  })
})
