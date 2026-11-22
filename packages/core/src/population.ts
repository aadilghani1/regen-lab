import type { PopulationParameters } from "./parameters.ts"

export interface PopulationState {
  readonly woundCells: number
  readonly progenitors: number
  readonly differentiated: number
}

export interface PopulationTrajectory {
  readonly times: Float64Array
  readonly woundCells: Float64Array
  readonly progenitors: Float64Array
  readonly differentiated: Float64Array
  readonly regrownLength: Float64Array
  readonly missingLength: number
}

type Vector = readonly [number, number, number]

const regrownLengthOf = (
  parameters: PopulationParameters,
  [, progenitors, differentiated]: Vector,
) => (progenitors + differentiated) / parameters.cellsPerUnitLength

const positionalGap = (parameters: PopulationParameters, missingLength: number, state: Vector) =>
  parameters.termination ? Math.max(0, 1 - regrownLengthOf(parameters, state) / missingLength) : 1

export const populationRates = (
  parameters: PopulationParameters,
  missingLength: number,
  state: Vector,
): Vector => {
  const [woundCells, progenitors] = state
  const gap = positionalGap(parameters, missingLength, state)
  const recruited = parameters.recruitment * parameters.nerveSupply * woundCells
  const differentiating = parameters.differentiation * progenitors * (1 - gap)
  return [
    -parameters.woundResolution * woundCells - recruited,
    recruited +
      parameters.proliferation * parameters.nerveSupply * progenitors * gap -
      differentiating,
    differentiating,
  ]
}

const along = (state: Vector, rates: Vector, scale: number): Vector => [
  state[0] + scale * rates[0],
  state[1] + scale * rates[1],
  state[2] + scale * rates[2],
]

const rungeKuttaStep = (
  parameters: PopulationParameters,
  missingLength: number,
  state: Vector,
): Vector => {
  const h = parameters.timeStep
  const rates = (at: Vector) => populationRates(parameters, missingLength, at)
  const k1 = rates(state)
  const k2 = rates(along(state, k1, h / 2))
  const k3 = rates(along(state, k2, h / 2))
  const k4 = rates(along(state, k3, h))
  const next = (i: 0 | 1 | 2) =>
    Math.max(state[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]), 0)
  return [next(0), next(1), next(2)]
}

export const simulatePopulation = (
  parameters: PopulationParameters,
  missingLength: number,
  initialWoundCells: number = parameters.cellsPerUnitLength * 3,
): PopulationTrajectory => {
  const count = Math.round(parameters.duration / parameters.timeStep) + 1
  const trajectory: PopulationTrajectory = {
    times: new Float64Array(count),
    woundCells: new Float64Array(count),
    progenitors: new Float64Array(count),
    differentiated: new Float64Array(count),
    regrownLength: new Float64Array(count),
    missingLength,
  }
  let state: Vector = [initialWoundCells, 0, 0]
  for (let i = 0; i < count; i++) {
    trajectory.times[i] = i * parameters.timeStep
    trajectory.woundCells[i] = state[0]
    trajectory.progenitors[i] = state[1]
    trajectory.differentiated[i] = state[2]
    trajectory.regrownLength[i] = regrownLengthOf(parameters, state)
    state = rungeKuttaStep(parameters, missingLength, state)
  }
  return trajectory
}
