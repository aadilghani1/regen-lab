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
  readonly insufficientHistory?: boolean
  readonly boundaryLimited?: boolean
  readonly exceededDistalIdentity?: boolean
  readonly orderedIdentity: boolean
  readonly progenitorsExhausted: boolean
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
  if (
    evidence.exceededDistalIdentity ||
    (evidence.stillGrowing && evidence.lengthRatio > 1 + FAITHFUL_TOLERANCE)
  ) {
    return "uncontrolled-growth"
  }
  if (evidence.boundaryLimited) return "incomplete-regeneration"
  if (evidence.lengthRatio < 1 - FAITHFUL_TOLERANCE) return "incomplete-regeneration"
  if (evidence.lengthRatio > 1 + FAITHFUL_TOLERANCE) return "duplication"
  if (
    evidence.insufficientHistory ||
    evidence.stillGrowing ||
    !evidence.progenitorsExhausted ||
    !evidence.orderedIdentity
  )
    return "incomplete-regeneration"
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

const positionalMetricsOf = (
  parameters: ModelParameters,
  trajectory: Trajectory,
  finalLength: number,
) => {
  const lattice = createLattice(parameters.lattice)
  const compared = Math.min(finalLength, lattice.limbLength)
  let previous = -Infinity
  let orderedIdentity = true
  const firstOverrun = 1 + 1 / lattice.limbLength - 1e-9
  const exceededDistalIdentity = trajectory.final.tissue.positionalIdentity.some(
    (value) => value >= firstOverrun,
  )
  let error = 0
  for (let offset = 0; offset < finalLength; offset++) {
    const x = lattice.bodyWallEnd + offset
    const identity =
      trajectory.final.tissue.positionalIdentity[indexOf(lattice, x, lattice.nerveRow)]
    if (identity < previous) orderedIdentity = false
    previous = identity
    if (offset < compared) error += Math.abs(identity - intactIdentityAt(lattice, x))
  }
  return {
    positionalError: compared ? error / compared : 0,
    orderedIdentity,
    exceededDistalIdentity,
  }
}

export const summarize = (parameters: ModelParameters, trajectory: Trajectory): Summary => {
  const originalLength = parameters.lattice.limbLength
  const stumpLength = trajectory.final.cutX - parameters.lattice.bodyWallEnd
  const finalLength = trajectory.observations.at(-1)?.limbLength ?? stumpLength
  const missing = originalLength - stumpLength
  const regrown = finalLength - stumpLength
  const { positionalError, orderedIdentity, exceededDistalIdentity } = positionalMetricsOf(
    parameters,
    trajectory,
    finalLength,
  )
  const evidence: OutcomeEvidence = {
    insufficientHistory: trajectory.observations.length <= GROWTH_WINDOW,
    orderedIdentity,
    boundaryLimited:
      !parameters.cells.termination &&
      finalLength === parameters.lattice.width - parameters.lattice.bodyWallEnd,
    exceededDistalIdentity,
    progenitorsExhausted:
      trajectory.final.blastemaSize > 0 && trajectory.observations.at(-1)?.progenitors === 0,
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
    positionalError,
    terminatedAtStep:
      evidence.progenitorsExhausted && !exceededDistalIdentity && !evidence.boundaryLimited
        ? terminationStepOf(parameters, trajectory.observations)
        : null,
  }
}
