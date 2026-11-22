import type { ModelParameters, Observation, Summary } from "@regen-lab/core"

export interface BatchRequest {
  readonly id: number
  readonly runs: readonly ModelParameters[]
}

export interface BatchResult {
  readonly summary: Summary
  readonly observations: readonly Observation[]
}

export interface BatchResponse {
  readonly id: number
  readonly results: readonly BatchResult[]
}

let nextId = 0

export const runBatch = (runs: readonly ModelParameters[]): Promise<readonly BatchResult[]> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./batch.worker.ts", import.meta.url), { type: "module" })
    const id = ++nextId
    worker.onmessage = (event: MessageEvent<BatchResponse>) => {
      if (event.data.id !== id) return
      worker.terminate()
      resolve(event.data.results)
    }
    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }
    worker.postMessage({ id, runs } satisfies BatchRequest)
  })
