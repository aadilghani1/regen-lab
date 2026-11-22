import {
  isStableTimeStep,
  type ModelParameters,
  OUTCOMES,
  type PopulationParameters,
} from "@regen-lab/core"
import { z } from "zod"

const positive = z.number().positive()
const nonNegative = z.number().nonnegative()
const count = z.number().int().nonnegative()

const lattice = z
  .object({
    width: count.default(140),
    height: count.default(32),
    limbWidth: count.default(10),
    limbLength: count.default(80),
    bodyWallEnd: count.default(4),
  })
  .refine((l) => l.bodyWallEnd + l.limbLength <= l.width, {
    message: "the intact limb must fit inside the lattice width",
  })
  .refine((l) => l.limbWidth <= l.height, {
    message: "the limb must fit inside the lattice height",
  })

const diffusingSignal = (diffusion: number, decay: number, production: number) =>
  z.strictObject({
    diffusion: positive.default(diffusion),
    decay: nonNegative.default(decay),
    production: nonNegative.default(production),
  })

const signals = z
  .object({
    timeStep: positive.default(0.2),
    substeps: count.min(1).default(5),
    nerve: diffusingSignal(1, 0.08, 1).prefault({}),
    distalGrowth: diffusingSignal(1, 0.15, 1.5).prefault({}),
    proximal: diffusingSignal(1, 0.02, 0.2)
      .extend({ tipDegradation: nonNegative.default(0.5) })
      .prefault({}),
  })
  .refine(
    (s) =>
      [s.nerve, s.distalGrowth, s.proximal].every((signal) =>
        isStableTimeStep(signal.diffusion, s.timeStep),
      ),
    { message: "diffusion × timeStep must be at most 0.25 for every signal" },
  )

const cells = z.strictObject({
  woundHealingSteps: count.default(10),
  blastemaDepth: count.default(3),
  nerveThreshold: positive.default(0.5),
  distalGrowthThreshold: positive.default(0.2),
  proliferationRate: z.number().min(0).max(1).default(0.25),
  hillCoefficient: positive.default(4),
  differentiationDelay: count.default(12),
  proximalSensitivity: nonNegative.default(0.4),
  termination: z.boolean().default(true),
  reinnervation: z.boolean().default(true),
})

const treatment = z.strictObject({
  denervate: z.boolean().default(false),
  exogenousProximal: nonNegative.default(0),
  exogenousWindow: z.tuple([count, count]).default([0, 40]),
})

const run = z.strictObject({
  seed: count.default(0),
  steps: count.default(400),
  warmupSteps: count.default(150),
})

export const modelParametersSchema = z.strictObject({
  lattice: lattice.prefault({}),
  amputation: z.strictObject({ level: z.number().min(0).max(1).default(0.5) }).prefault({}),
  signals: signals.prefault({}),
  cells: cells.prefault({}),
  treatment: treatment.prefault({}),
  run: run.prefault({}),
})

export const populationParametersSchema = z.strictObject({
  duration: positive.default(400),
  timeStep: positive.default(0.1),
  woundResolution: nonNegative.default(0.1),
  recruitment: nonNegative.default(0.5),
  proliferation: nonNegative.default(0.08),
  differentiation: nonNegative.default(0.05),
  nerveSupply: nonNegative.default(1),
  cellsPerUnitLength: positive.default(10),
  termination: z.boolean().default(true),
})

export const benchmarkSchema = z.strictObject({
  observation: z.string().min(1),
  expectedOutcome: z.enum(OUTCOMES),
  assumptions: z.array(z.string()).default([]),
})

export const scenarioSchema = z.strictObject({
  name: z.string().regex(/^[a-z0-9-]+$/),
  summary: z.string().min(1),
  benchmark: benchmarkSchema.optional(),
  model: modelParametersSchema.prefault({}),
  population: populationParametersSchema.prefault({}),
})

export type ScenarioInput = z.input<typeof scenarioSchema>
export type Benchmark = z.output<typeof benchmarkSchema>

export interface Scenario {
  readonly name: string
  readonly summary: string
  readonly benchmark: Benchmark | undefined
  readonly model: ModelParameters
  readonly population: PopulationParameters
}

export const toScenario = (parsed: z.output<typeof scenarioSchema>): Scenario => ({
  name: parsed.name,
  summary: parsed.summary,
  benchmark: parsed.benchmark,
  model: parsed.model,
  population: parsed.population,
})
