import type { Lattice } from "./lattice.ts"
import type { DiffusingSignalParameters, SignalParameters } from "./parameters.ts"

export const SIGNAL_NAMES = ["nerve", "distalGrowth", "proximal"] as const

export type SignalName = (typeof SIGNAL_NAMES)[number]

export type Signals = { readonly [name in SignalName]: Float64Array }

export type SignalFluxes = {
  readonly production: Signals
  readonly degradation: Signals
}

export const allocateSignals = (lattice: Lattice): Signals => ({
  nerve: new Float64Array(lattice.size),
  distalGrowth: new Float64Array(lattice.size),
  proximal: new Float64Array(lattice.size),
})

export const copySignalsInto = (source: Signals, target: Signals): Signals => {
  for (const name of SIGNAL_NAMES) target[name].set(source[name])
  return target
}

export const totalOf = (field: Float64Array): number => {
  let total = 0
  for (let index = 0; index < field.length; index++) total += field[index]
  return total
}

export const isStableTimeStep = (diffusion: number, timeStep: number): boolean =>
  diffusion * timeStep <= 0.25

const updatedValue = (
  value: number,
  neighbourSum: number,
  diffusion: number,
  decay: number,
  timeStep: number,
  production: number,
  degradation: number,
): number =>
  Math.max(
    value +
      timeStep *
        (diffusion * (neighbourSum - 4 * value) - (decay + degradation) * value + production),
    0,
  )

const reactDiffuseEdgeInto = (
  lattice: Lattice,
  field: Float64Array,
  parameters: DiffusingSignalParameters,
  timeStep: number,
  production: Float64Array,
  degradation: Float64Array,
  scratch: Float64Array,
  x: number,
  y: number,
): void => {
  const { width, height } = lattice
  const index = y * width + x
  const neighbourSum =
    field[y > 0 ? index - width : index] +
    field[y < height - 1 ? index + width : index] +
    field[x > 0 ? index - 1 : index] +
    field[x < width - 1 ? index + 1 : index]
  scratch[index] = updatedValue(
    field[index],
    neighbourSum,
    parameters.diffusion,
    parameters.decay,
    timeStep,
    production[index],
    degradation[index],
  )
}

export const reactDiffuseInto = (
  lattice: Lattice,
  field: Float64Array,
  parameters: DiffusingSignalParameters,
  timeStep: number,
  production: Float64Array,
  degradation: Float64Array,
  scratch: Float64Array,
): Float64Array => {
  const { width, height } = lattice
  const { diffusion, decay } = parameters
  for (let y = 1; y < height - 1; y++) {
    const rowStart = y * width
    for (let index = rowStart + 1; index < rowStart + width - 1; index++) {
      const value = field[index]
      const neighbourSum =
        field[index - width] + field[index + width] + field[index - 1] + field[index + 1]
      scratch[index] = updatedValue(
        value,
        neighbourSum,
        diffusion,
        decay,
        timeStep,
        production[index],
        degradation[index],
      )
    }
  }
  for (let x = 0; x < width; x++) {
    reactDiffuseEdgeInto(
      lattice,
      field,
      parameters,
      timeStep,
      production,
      degradation,
      scratch,
      x,
      0,
    )
    if (height > 1) {
      reactDiffuseEdgeInto(
        lattice,
        field,
        parameters,
        timeStep,
        production,
        degradation,
        scratch,
        x,
        height - 1,
      )
    }
  }
  for (let y = 1; y < height - 1; y++) {
    reactDiffuseEdgeInto(
      lattice,
      field,
      parameters,
      timeStep,
      production,
      degradation,
      scratch,
      0,
      y,
    )
    if (width > 1) {
      reactDiffuseEdgeInto(
        lattice,
        field,
        parameters,
        timeStep,
        production,
        degradation,
        scratch,
        width - 1,
        y,
      )
    }
  }
  field.set(scratch)
  return field
}

export const advanceSignalsInto = (
  lattice: Lattice,
  signals: Signals,
  parameters: SignalParameters,
  fluxes: SignalFluxes,
  scratch: Float64Array,
): Signals => {
  for (let substep = 0; substep < parameters.substeps; substep++) {
    for (const name of SIGNAL_NAMES) {
      reactDiffuseInto(
        lattice,
        signals[name],
        parameters[name],
        parameters.timeStep,
        fluxes.production[name],
        fluxes.degradation[name],
        scratch,
      )
    }
  }
  return signals
}
