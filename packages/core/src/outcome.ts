import { createLattice, indexOf } from "./lattice.ts"
import type { ModelParameters } from "./parameters.ts"
import type { Observation, Trajectory } from "./simulation.ts"
import { intactIdentityAt } from "./tissue.ts"

export const OUTCOMES = [
  "faithful-regeneration",
  "incomplete-regeneration",
  "no-regeneration",
  "duplication",
  "uncontrolled-growth",
] as const

export type Outcome = (typeof OUTCOMES)[number]

export interface OutcomeEvidence {
  readonly lengthRatio: number
  readonly blastemaSize: number
  readonly stillGrowing: boolean
}

export interface Summary extends OutcomeEvidence {
  readonly outcome: Outcome
  readonly originalLength: number
  readonly stumpLength: number
  readonly finalLength: number
  readonly regrown: number
  readonly regrowthRatio: number
  readonly positionalError: number
  readonly terminatedAtStep: number | null
}

export const GROWTH_WINDOW = 50
const FAITHFUL_TOLERANCE = 0.05

export const classifyOutcome = (evidence: OutcomeEvidence): Outcome => {
  if (evidence.blastemaSize === 0) return "no-regeneration"
  if (evidence.stillGrowing && evidence.lengthRatio > 1 + FAITHFUL_TOLERANCE) {
    return "uncontrolled-growth"
  }
  if (evidence.lengthRatio < 1 - FAITHFUL_TOLERANCE) return "incomplete-regeneration"
  if (evidence.lengthRatio > 1 + FAITHFUL_TOLERANCE) return "duplication"
  return "faithful-regeneration"
}

const isStillGrowing = (observations: readonly Observation[]): boolean => {
  const last = observations.at(-1)
  const window = Math.min(GROWTH_WINDOW, observations.length - 1)
  const earlier = observations.at(-1 - window)
  return window > 0 && last !== undefined && earlier !== undefined
    ? last.limbLength > earlier.limbLength
    : false
}

const terminationStepOf = (
  parameters: ModelParameters,
  observations: readonly Observation[],
): number | null =>
  observations.find(
    (observation) =>
      observation.step > parameters.cells.woundHealingSteps + 1 && observation.progenitors === 0,
  )?.step ?? null

const positionalErrorOf = (
  parameters: ModelParameters,
  trajectory: Trajectory,
  finalLength: number,
): number => {
  const lattice = createLattice(parameters.lattice)
  const compared = Math.min(finalLength, lattice.limbLength)
  if (compared === 0) return 0
  let error = 0
  for (let offset = 0; offset < compared; offset++) {
    const x = lattice.bodyWallEnd + offset
    const identity =
      trajectory.final.tissue.positionalIdentity[indexOf(lattice, x, lattice.nerveRow)]
    error += Math.abs(identity - intactIdentityAt(lattice, x))
  }
  return error / compared
}

export const summarize = (parameters: ModelParameters, trajectory: Trajectory): Summary => {
  const originalLength = parameters.lattice.limbLength
  const stumpLength = trajectory.final.cutX - parameters.lattice.bodyWallEnd
  const finalLength = trajectory.observations.at(-1)?.limbLength ?? stumpLength
  const missing = originalLength - stumpLength
  const regrown = finalLength - stumpLength
  const evidence: OutcomeEvidence = {
    lengthRatio: finalLength / originalLength,
    blastemaSize: trajectory.final.blastemaSize,
    stillGrowing: isStillGrowing(trajectory.observations),
  }
  return {
    ...evidence,
    outcome: classifyOutcome(evidence),
    originalLength,
    stumpLength,
    finalLength,
    regrown,
    regrowthRatio: missing === 0 ? 0 : regrown / missing,
    positionalError: positionalErrorOf(parameters, trajectory, finalLength),
    terminatedAtStep: terminationStepOf(parameters, trajectory.observations),
  }
}
