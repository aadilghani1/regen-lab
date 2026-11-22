import { createLattice, indexOf } from "./lattice.ts"
import type { ModelParameters } from "./parameters.ts"
import type { SimulationState } from "./simulation.ts"
import { CellKind } from "./tissue.ts"

export type Cell =
  | { readonly kind: "empty" }
  | {
      readonly kind: "differentiated"
      readonly positionalIdentity: number
      readonly innervated: boolean
    }
  | {
      readonly kind: "progenitor"
      readonly positionalIdentity: number
      readonly innervated: boolean
      readonly crowdedFor: number
    }

export const cellAt = (
  parameters: ModelParameters,
  state: SimulationState,
  x: number,
  y: number,
): Cell => {
  const index = indexOf(createLattice(parameters.lattice), x, y)
  const { kind, positionalIdentity, innervated, crowdedFor } = state.tissue
  switch (kind[index]) {
    case CellKind.Differentiated:
      return {
        kind: "differentiated",
        positionalIdentity: positionalIdentity[index],
        innervated: innervated[index] === 1,
      }
    case CellKind.Progenitor:
      return {
        kind: "progenitor",
        positionalIdentity: positionalIdentity[index],
        innervated: innervated[index] === 1,
        crowdedFor: crowdedFor[index],
      }
    default:
      return { kind: "empty" }
  }
}
