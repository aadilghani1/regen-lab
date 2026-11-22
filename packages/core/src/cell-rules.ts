import { columnOf, indexOf, isInLimbBand, type Lattice, rowOf } from "./lattice.ts"
import type { CellParameters } from "./parameters.ts"
import { type RandomSource, RandomStream } from "./random.ts"
import type { Signals } from "./signals.ts"
import { CellKind, isOccupied, type Tissue } from "./tissue.ts"

const DISTAL_IDENTITY = 1 - 1e-9
const NO_NEIGHBOUR = -1

export const hill = (value: number, threshold: number, coefficient: number): number => {
  if (value <= 0) return 0
  const activation = value ** coefficient
  return activation / (activation + threshold ** coefficient)
}

export const formBlastemaInto = (
  lattice: Lattice,
  cells: CellParameters,
  tissue: Tissue,
  signals: Signals,
  proximalBaseline: Float64Array,
  cutX: number,
): number => {
  const firstColumn = Math.max(lattice.bodyWallEnd, cutX - cells.blastemaDepth)
  const eligible: number[] = []
  let excessTotal = 0
  for (let y = lattice.bandStart; y < lattice.bandEnd; y++) {
    for (let x = firstColumn; x < cutX; x++) {
      const index = indexOf(lattice, x, y)
      const isCandidate =
        tissue.kind[index] === CellKind.Differentiated &&
        signals.nerve[index] >= cells.nerveThreshold
      if (!isCandidate) continue
      eligible.push(index)
      excessTotal += Math.max(signals.proximal[index] - proximalBaseline[index], 0)
    }
  }
  if (eligible.length === 0) return 0
  const identityShift = (cells.proximalSensitivity * excessTotal) / eligible.length
  for (const index of eligible) {
    tissue.kind[index] = CellKind.Progenitor
    tissue.positionalIdentity[index] = Math.max(tissue.positionalIdentity[index] - identityShift, 0)
  }
  return eligible.length
}

const collectProgenitorsInto = (tissue: Tissue, order: Int32Array): number => {
  let count = 0
  for (let index = 0; index < tissue.kind.length; index++) {
    if (tissue.kind[index] === CellKind.Progenitor) order[count++] = index
  }
  return count
}

const shuffleInto = (
  order: Int32Array,
  count: number,
  random: RandomSource,
  step: number,
): Int32Array => {
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random.uniform(step, RandomStream.ProgenitorOrder, i) * (i + 1))
    const held = order[i]
    order[i] = order[j]
    order[j] = held
  }
  return order
}

const isFreeLimbSite = (lattice: Lattice, tissue: Tissue, x: number, y: number): boolean =>
  isInLimbBand(lattice, y) && !isOccupied(tissue, indexOf(lattice, x, y))

const freeNeighbourOf = (
  lattice: Lattice,
  tissue: Tissue,
  index: number,
  lateralDraw: number,
): number => {
  const x = columnOf(lattice, index)
  const y = rowOf(lattice, index)
  if (x + 1 < lattice.width && !isOccupied(tissue, index + 1)) return index + 1
  const [first, second] = lateralDraw < 0.5 ? [y - 1, y + 1] : [y + 1, y - 1]
  if (isFreeLimbSite(lattice, tissue, x, first)) return indexOf(lattice, x, first)
  if (isFreeLimbSite(lattice, tissue, x, second)) return indexOf(lattice, x, second)
  return NO_NEIGHBOUR
}

const divisionProbability = (cells: CellParameters, signals: Signals, index: number): number =>
  cells.proliferationRate *
  hill(signals.nerve[index], cells.nerveThreshold, cells.hillCoefficient) *
  hill(signals.distalGrowth[index], cells.distalGrowthThreshold, cells.hillCoefficient)

export const renewCellsInto = (
  lattice: Lattice,
  cells: CellParameters,
  tissue: Tissue,
  signals: Signals,
  random: RandomSource,
  step: number,
  order: Int32Array,
): number => {
  const count = collectProgenitorsInto(tissue, order)
  shuffleInto(order, count, random, step)
  const identityIncrement = 1 / lattice.limbLength
  let divisions = 0
  for (let k = 0; k < count; k++) {
    const index = order[k]
    if (tissue.kind[index] !== CellKind.Progenitor) continue
    if (cells.termination && tissue.positionalIdentity[index] >= DISTAL_IDENTITY) {
      tissue.kind[index] = CellKind.Differentiated
      continue
    }
    const daughter = freeNeighbourOf(
      lattice,
      tissue,
      index,
      random.uniform(step, RandomStream.LateralChoice, index),
    )
    if (daughter === NO_NEIGHBOUR) {
      tissue.crowdedFor[index]++
      if (tissue.crowdedFor[index] > cells.differentiationDelay) {
        tissue.kind[index] = CellKind.Differentiated
      }
      continue
    }
    if (
      random.uniform(step, RandomStream.Division, index) >=
      divisionProbability(cells, signals, index)
    ) {
      continue
    }
    tissue.kind[daughter] = CellKind.Progenitor
    tissue.crowdedFor[daughter] = 0
    tissue.positionalIdentity[daughter] =
      tissue.positionalIdentity[index] + (daughter === index + 1 ? identityIncrement : 0)
    divisions++
  }
  return divisions
}

export const reinnervateInto = (lattice: Lattice, tissue: Tissue): Tissue => {
  const rowStart = indexOf(lattice, 0, lattice.nerveRow)
  let frontier = -1
  for (let x = 0; x < lattice.width; x++) if (tissue.innervated[rowStart + x] === 1) frontier = x
  if (frontier < 0) return tissue
  while (frontier + 1 < lattice.width && isOccupied(tissue, rowStart + frontier + 1)) {
    frontier++
    tissue.innervated[rowStart + frontier] = 1
  }
  return tissue
}
