export interface LatticeParameters {
  readonly width: number
  readonly height: number
  readonly limbWidth: number
  readonly limbLength: number
  readonly bodyWallEnd: number
}

export interface AmputationParameters {
  readonly level: number
}

export interface DiffusingSignalParameters {
  readonly diffusion: number
  readonly decay: number
  readonly production: number
}

export interface ProximalSignalParameters extends DiffusingSignalParameters {
  readonly tipDegradation: number
}

export interface SignalParameters {
  readonly timeStep: number
  readonly substeps: number
  readonly nerve: DiffusingSignalParameters
  readonly distalGrowth: DiffusingSignalParameters
  readonly proximal: ProximalSignalParameters
}

export interface CellParameters {
  readonly woundHealingSteps: number
  readonly blastemaDepth: number
  readonly nerveThreshold: number
  readonly distalGrowthThreshold: number
  readonly proliferationRate: number
  readonly hillCoefficient: number
  readonly differentiationDelay: number
  readonly proximalSensitivity: number
  readonly termination: boolean
  readonly reinnervation: boolean
}

export interface TreatmentParameters {
  readonly denervate: boolean
  readonly exogenousProximal: number
  readonly exogenousWindow: readonly [start: number, end: number]
}

export interface RunParameters {
  readonly seed: number
  readonly steps: number
  readonly warmupSteps: number
}

export interface ModelParameters {
  readonly lattice: LatticeParameters
  readonly amputation: AmputationParameters
  readonly signals: SignalParameters
  readonly cells: CellParameters
  readonly treatment: TreatmentParameters
  readonly run: RunParameters
}

export interface PopulationParameters {
  readonly duration: number
  readonly timeStep: number
  readonly woundResolution: number
  readonly recruitment: number
  readonly proliferation: number
  readonly differentiation: number
  readonly nerveSupply: number
  readonly cellsPerUnitLength: number
  readonly termination: boolean
}
