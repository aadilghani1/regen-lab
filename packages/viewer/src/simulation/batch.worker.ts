import { type ModelParameters, simulate, summarize } from "@regen-lab/core"
import type { BatchRequest, BatchResponse } from "./batch.ts"

self.onmessage = (event: MessageEvent<BatchRequest>) => {
  const results = event.data.runs.map((parameters: ModelParameters) => {
    const trajectory = simulate(parameters)
    return { summary: summarize(parameters, trajectory), observations: trajectory.observations }
  })
  self.postMessage({ id: event.data.id, results } satisfies BatchResponse)
}
