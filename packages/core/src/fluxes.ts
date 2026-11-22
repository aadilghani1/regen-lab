import type { Lattice } from "./lattice.ts"
import type { ModelParameters } from "./parameters.ts"
import { allocateSignals, type SignalFluxes } from "./signals.ts"
import { CellKind, markGrowingFaceInto, type Tissue } from "./tissue.ts"

export interface FluxContext {
  readonly step: number
  readonly growing: boolean
}

export const allocateFluxes = (lattice: Lattice): SignalFluxes => ({
  production: allocateSignals(lattice),
  degradation: allocateSignals(lattice),
})

const isTreatmentActive = (parameters: ModelParameters, step: number): boolean => {
  const [start, end] = parameters.treatment.exogenousWindow
  return parameters.treatment.exogenousProximal > 0 && step >= start && step < end
}

export const emitFluxesInto = (
  parameters: ModelParameters,
  lattice: Lattice,
  tissue: Tissue,
  context: FluxContext,
  fluxes: SignalFluxes,
  growingFace: Uint8Array,
): SignalFluxes => {
  const { nerve, distalGrowth, proximal } = parameters.signals
  const exogenous = isTreatmentActive(parameters, context.step)
    ? parameters.treatment.exogenousProximal
    : 0
  markGrowingFaceInto(lattice, tissue, growingFace)
  fluxes.degradation.nerve.fill(0)
  fluxes.degradation.distalGrowth.fill(0)
  for (let index = 0; index < lattice.size; index++) {
    const y = Math.floor(index / lattice.width)
    const inBand = y >= lattice.bandStart && y < lattice.bandEnd
    const isFace = context.growing && growingFace[index] === 1
    const isDifferentiatedLimb = inBand && tissue.kind[index] === CellKind.Differentiated
    const proximalness = Math.min(Math.max(1 - tissue.positionalIdentity[index], 0), 1)
    fluxes.production.nerve[index] = tissue.innervated[index] * nerve.production
    fluxes.production.distalGrowth[index] = isFace ? distalGrowth.production : 0
    fluxes.production.proximal[index] =
      (isDifferentiatedLimb ? proximal.production * proximalness : 0) + exogenous
    fluxes.degradation.proximal[index] = isFace ? proximal.tipDegradation : 0
  }
  return fluxes
}
