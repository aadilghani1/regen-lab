import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import { advance, CellKind, cellAt, initialize, type SimulationState, step } from "../src/index.ts"
import { smallModelParameters } from "./fixtures.ts"

const snapshot = (state: SimulationState) => ({
  kind: Array.from(state.tissue.kind),
  identity: Array.from(state.tissue.positionalIdentity),
  innervated: Array.from(state.tissue.innervated),
  nerve: Array.from(state.signals.nerve),
  proximal: Array.from(state.signals.proximal),
  scalars: [state.step, state.woundOpen, state.blastemaSize, state.divisions],
})

describe("step", () => {
  test("does not modify the state it is given", () => {
    const parameters = smallModelParameters()
    const state = advance(parameters, initialize(parameters), 15)
    const before = snapshot(state)
    step(parameters, state)
    expect(snapshot(state)).toEqual(before)
  })

  test("advance(state, n) equals n applications of step", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 25 }), fc.nat(1000), (steps, seed) => {
        const parameters = smallModelParameters(seed)
        const initial = initialize(parameters)
        const stepped = Array.from({ length: steps }).reduce<SimulationState>(
          (state) => step(parameters, state),
          initial,
        )
        expect(snapshot(advance(parameters, initial, steps))).toEqual(snapshot(stepped))
      }),
      { numRuns: 15 },
    )
  })

  test("advance leaves its input untouched", () => {
    const parameters = smallModelParameters()
    const initial = initialize(parameters)
    const before = snapshot(initial)
    advance(parameters, initial, 30)
    expect(snapshot(initial)).toEqual(before)
  })
})

describe("cellAt", () => {
  test("reads the domain view of a cell", () => {
    const parameters = smallModelParameters()
    const state = initialize(parameters)
    expect(cellAt(parameters, state, 0, 0)).toEqual({
      kind: "differentiated",
      positionalIdentity: 0,
      innervated: false,
    })
    expect(cellAt(parameters, state, parameters.lattice.width - 1, 0)).toEqual({ kind: "empty" })
  })

  test("agrees with the raw cell kind everywhere", () => {
    const parameters = smallModelParameters()
    const state = advance(parameters, initialize(parameters), 20)
    const names = {
      [CellKind.Empty]: "empty",
      [CellKind.Differentiated]: "differentiated",
      [CellKind.Progenitor]: "progenitor",
    } as const
    const { width, height } = parameters.lattice
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const kind = state.tissue.kind[y * width + x] as CellKind
        expect(cellAt(parameters, state, x, y).kind).toBe(names[kind])
      }
    }
  })
})
