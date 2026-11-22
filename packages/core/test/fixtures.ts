import type { ModelParameters, PopulationParameters } from "../src/index.ts"

export const modelParameters = (overrides: Partial<ModelParameters> = {}): ModelParameters => ({
  lattice: { width: 140, height: 32, limbWidth: 10, limbLength: 80, bodyWallEnd: 4 },
  amputation: { level: 0.5 },
  signals: {
    timeStep: 0.2,
    substeps: 5,
    nerve: { diffusion: 1, decay: 0.08, production: 1 },
    distalGrowth: { diffusion: 1, decay: 0.15, production: 1.5 },
    proximal: { diffusion: 1, decay: 0.02, production: 0.2, tipDegradation: 0.5 },
  },
  cells: {
    woundHealingSteps: 10,
    blastemaDepth: 3,
    nerveThreshold: 0.5,
    distalGrowthThreshold: 0.2,
    proliferationRate: 0.25,
    hillCoefficient: 4,
    differentiationDelay: 12,
    proximalSensitivity: 0.4,
    termination: true,
    reinnervation: true,
  },
  treatment: { denervate: false, exogenousProximal: 0, exogenousWindow: [0, 40] },
  run: { seed: 0, steps: 400, warmupSteps: 150 },
  ...overrides,
})

export const smallModelParameters = (seed = 0): ModelParameters =>
  modelParameters({
    lattice: { width: 48, height: 12, limbWidth: 4, limbLength: 30, bodyWallEnd: 2 },
    run: { seed, steps: 60, warmupSteps: 40 },
  })

export const populationParameters = (
  overrides: Partial<PopulationParameters> = {},
): PopulationParameters => ({
  duration: 400,
  timeStep: 0.1,
  woundResolution: 0.1,
  recruitment: 0.5,
  proliferation: 0.08,
  differentiation: 0.05,
  nerveSupply: 1,
  cellsPerUnitLength: 10,
  termination: true,
  ...overrides,
})
