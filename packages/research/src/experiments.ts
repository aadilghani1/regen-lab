import {
  type Observation,
  type Summary,
  simulate,
  simulatePopulation,
  summarize,
} from "@regen-lab/core"
import { type Scenario, withOverride, withSeed } from "@regen-lab/scenarios"

export interface Experiment {
  readonly scenario: Scenario
  readonly summary: Summary
  readonly observations: readonly Observation[]
}

export const runExperiment = (scenario: Scenario): Experiment => {
  const trajectory = simulate(scenario.model)
  return {
    scenario,
    summary: summarize(scenario.model, trajectory),
    observations: trajectory.observations,
  }
}

export const seedsFrom = (first: number, count: number): readonly number[] =>
  Array.from({ length: count }, (_, i) => first + i)

export interface SweepPoint {
  readonly value: unknown
  readonly seed: number
  readonly summary: Summary
}

export type SweepResult =
  | { readonly ok: true; readonly points: readonly SweepPoint[] }
  | { readonly ok: false; readonly issues: readonly string[] }

export const sweep = (
  scenario: Scenario,
  parameter: string,
  values: readonly unknown[],
  seeds: readonly number[],
): SweepResult => {
  const variants = values.map((value) => ({
    value,
    parsed: withOverride(scenario, parameter, value),
  }))
  const invalid = variants.flatMap((v) => (v.parsed.ok ? [] : v.parsed.issues))
  if (invalid.length > 0) return { ok: false, issues: invalid }
  return {
    ok: true,
    points: variants.flatMap(({ value, parsed }) =>
      parsed.ok
        ? seeds.map((seed) => ({
            value,
            seed,
            summary: runExperiment(withSeed(parsed.scenario, seed)).summary,
          }))
        : [],
    ),
  }
}

export const populationOutcome = (scenario: Scenario) => {
  const missing = scenario.model.lattice.limbLength * (1 - scenario.model.amputation.level)
  const trajectory = simulatePopulation(scenario.population, missing)
  return {
    missing,
    regrown: trajectory.regrownLength[trajectory.regrownLength.length - 1] ?? 0,
    trajectory,
  }
}
