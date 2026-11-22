import { readFileSync } from "node:fs"
import { advance, initialize, type ModelParameters } from "@regen-lab/core"
import { catalogDirectory, parseScenarioToml } from "@regen-lab/scenarios"

const BUDGET_MS = 200
const STEPS = 400
const REPEATS = 5

const baseline = parseScenarioToml(readFileSync(new URL("baseline.toml", catalogDirectory), "utf8"))
if (!baseline.ok) throw new Error(baseline.issues.join("; "))

const viewerSized: ModelParameters = {
  ...baseline.scenario.model,
  lattice: { width: 256, height: 64, limbWidth: 20, limbLength: 160, bodyWallEnd: 8 },
}

const medianOf = (values: readonly number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? Number.NaN

const timeAdvance = (parameters: ModelParameters): number => {
  const initial = initialize(parameters)
  const started = performance.now()
  advance(parameters, initial, STEPS)
  return performance.now() - started
}

const measure = (label: string, parameters: ModelParameters) => {
  timeAdvance(parameters)
  const median = medianOf(Array.from({ length: REPEATS }, () => timeAdvance(parameters)))
  const stepsPerFrame = (1000 / 60 / (median / STEPS)).toFixed(1)
  console.log(
    `${label}: ${STEPS} steps in ${median.toFixed(1)} ms (${stepsPerFrame} steps per 60fps frame)`,
  )
  return median
}

const benchmarkMs = measure("benchmark lattice 140x32", baseline.scenario.model)
measure("viewer lattice 256x64", viewerSized)

if (benchmarkMs > BUDGET_MS) {
  console.error(`over budget: ${benchmarkMs.toFixed(1)} ms > ${BUDGET_MS} ms`)
  process.exit(1)
}
