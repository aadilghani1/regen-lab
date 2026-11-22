import { formBlastemaInto, reinnervateInto, renewCellsInto } from "./cell-rules.ts"
import { allocateFluxes, emitFluxesInto } from "./fluxes.ts"
import { createLattice, type Lattice } from "./lattice.ts"
import type { ModelParameters } from "./parameters.ts"
import { counterRandom, type RandomSource } from "./random.ts"
import {
  advanceSignalsInto,
  allocateSignals,
  copySignalsInto,
  type SignalFluxes,
  type Signals,
} from "./signals.ts"
import {
  allocateTissue,
  amputateInto,
  copyTissueInto,
  countProgenitors,
  createIntactTissue,
  limbLengthOf,
  type Tissue,
} from "./tissue.ts"

export interface SimulationState {
  readonly step: number
  readonly woundOpen: boolean
  readonly cutX: number
  readonly blastemaSize: number
  readonly divisions: number
  readonly tissue: Tissue
  readonly signals: Signals
  readonly proximalBaseline: Float64Array
}

export interface StateBuffers {
  readonly tissue: Tissue
  readonly signals: Signals
}

export interface Workspace {
  readonly fluxes: SignalFluxes
  readonly growingFace: Uint8Array
  readonly scratch: Float64Array
  readonly progenitorOrder: Int32Array
}

export interface Observation {
  readonly step: number
  readonly limbLength: number
  readonly progenitors: number
  readonly divisions: number
}

export const allocateBuffers = (lattice: Lattice): StateBuffers => ({
  tissue: allocateTissue(lattice),
  signals: allocateSignals(lattice),
})

export const allocateWorkspace = (lattice: Lattice): Workspace => ({
  fluxes: allocateFluxes(lattice),
  growingFace: new Uint8Array(lattice.size),
  scratch: new Float64Array(lattice.size),
  progenitorOrder: new Int32Array(lattice.size),
})

const relaxSignalsInto = (
  parameters: ModelParameters,
  lattice: Lattice,
  tissue: Tissue,
  signals: Signals,
  workspace: Workspace,
): Signals => {
  for (let i = 0; i < parameters.run.warmupSteps; i++) {
    emitFluxesInto(
      parameters,
      lattice,
      tissue,
      { step: -1, growing: false },
      workspace.fluxes,
      workspace.growingFace,
    )
    advanceSignalsInto(lattice, signals, parameters.signals, workspace.fluxes, workspace.scratch)
  }
  return signals
}

export const cutColumnOf = (parameters: ModelParameters): number =>
  parameters.lattice.bodyWallEnd +
  Math.round(parameters.amputation.level * parameters.lattice.limbLength)

export const initialize = (parameters: ModelParameters): SimulationState => {
  const lattice = createLattice(parameters.lattice)
  const tissue = createIntactTissue(lattice)
  const signals = relaxSignalsInto(
    parameters,
    lattice,
    tissue,
    allocateSignals(lattice),
    allocateWorkspace(lattice),
  )
  const cutX = cutColumnOf(parameters)
  amputateInto(lattice, tissue, cutX, parameters.treatment.denervate)
  return {
    step: 0,
    woundOpen: true,
    cutX,
    blastemaSize: 0,
    divisions: 0,
    tissue,
    signals,
    proximalBaseline: Float64Array.from(signals.proximal),
  }
}

export const stepInto = (
  parameters: ModelParameters,
  random: RandomSource,
  from: SimulationState,
  target: StateBuffers,
  workspace: Workspace,
): SimulationState => {
  const lattice = createLattice(parameters.lattice)
  const tissue = copyTissueInto(from.tissue, target.tissue)
  const signals = copySignalsInto(from.signals, target.signals)
  const growing = from.woundOpen || countProgenitors(tissue) > 0
  emitFluxesInto(
    parameters,
    lattice,
    tissue,
    { step: from.step, growing },
    workspace.fluxes,
    workspace.growingFace,
  )
  advanceSignalsInto(lattice, signals, parameters.signals, workspace.fluxes, workspace.scratch)
  const blastemaForms = from.step === parameters.cells.woundHealingSteps
  const blastemaSize = blastemaForms
    ? formBlastemaInto(lattice, parameters.cells, tissue, signals, from.proximalBaseline, from.cutX)
    : from.blastemaSize
  const divisions = renewCellsInto(
    lattice,
    parameters.cells,
    tissue,
    signals,
    random,
    from.step,
    workspace.progenitorOrder,
  )
  if (parameters.cells.reinnervation) reinnervateInto(lattice, tissue)
  return {
    ...from,
    step: from.step + 1,
    woundOpen: from.woundOpen && !blastemaForms,
    blastemaSize,
    divisions,
    tissue,
    signals,
  }
}

export const step = (
  parameters: ModelParameters,
  state: SimulationState,
  random: RandomSource = counterRandom(parameters.run.seed),
): SimulationState => {
  const lattice = createLattice(parameters.lattice)
  return stepInto(parameters, random, state, allocateBuffers(lattice), allocateWorkspace(lattice))
}

export const advanceObserving = (
  parameters: ModelParameters,
  state: SimulationState,
  steps: number,
  onStep: (state: SimulationState) => void,
  random: RandomSource = counterRandom(parameters.run.seed),
): SimulationState => {
  if (steps <= 0) return state
  const lattice = createLattice(parameters.lattice)
  const pingPong = [allocateBuffers(lattice), allocateBuffers(lattice)] as const
  const workspace = allocateWorkspace(lattice)
  let current = state
  for (let i = 0; i < steps; i++) {
    current = stepInto(parameters, random, current, pingPong[i % 2], workspace)
    onStep(current)
  }
  return current
}

export interface Stepper {
  readonly advance: (
    state: SimulationState,
    steps: number,
    onStep?: (state: SimulationState) => void,
  ) => SimulationState
}

const ignore = (): void => undefined

export const createStepper = (
  parameters: ModelParameters,
  random: RandomSource = counterRandom(parameters.run.seed),
): Stepper => {
  const lattice = createLattice(parameters.lattice)
  const buffers = [allocateBuffers(lattice), allocateBuffers(lattice)] as const
  const workspace = allocateWorkspace(lattice)
  const otherThan = (state: SimulationState): StateBuffers =>
    state.tissue === buffers[0].tissue ? buffers[1] : buffers[0]
  return {
    advance: (state, steps, onStep = ignore) => {
      let current = state
      for (let i = 0; i < steps; i++) {
        current = stepInto(parameters, random, current, otherThan(current), workspace)
        onStep(current)
      }
      return current
    },
  }
}

export const advance = (
  parameters: ModelParameters,
  state: SimulationState,
  steps: number,
  random: RandomSource = counterRandom(parameters.run.seed),
): SimulationState => advanceObserving(parameters, state, steps, ignore, random)

export const observe = (parameters: ModelParameters, state: SimulationState): Observation => ({
  step: state.step,
  limbLength: limbLengthOf(createLattice(parameters.lattice), state.tissue),
  progenitors: countProgenitors(state.tissue),
  divisions: state.divisions,
})

export interface Trajectory {
  readonly initial: SimulationState
  readonly final: SimulationState
  readonly observations: readonly Observation[]
}

export const simulate = (
  parameters: ModelParameters,
  random: RandomSource = counterRandom(parameters.run.seed),
): Trajectory => {
  const initial = initialize(parameters)
  const observations: Observation[] = []
  const final = advanceObserving(
    parameters,
    initial,
    parameters.run.steps,
    (state) => observations.push(observe(parameters, state)),
    random,
  )
  return { initial, final, observations }
}
