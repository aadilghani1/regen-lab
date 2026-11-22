import {
  createStepper,
  initialize,
  type ModelParameters,
  type Observation,
  observe,
  type SimulationState,
  summarize,
} from "@regen-lab/core"
import { createFramePool, fillFrame } from "./frames.ts"
import { type FromWorker, frameTransferables, type ToWorker } from "./protocol.ts"

interface Session {
  readonly id: number
  readonly parameters: ModelParameters
  readonly state: SimulationState
  readonly observations: readonly Observation[]
  readonly pool: ReturnType<typeof createFramePool>
  readonly stepper: ReturnType<typeof createStepper>
}

let session: Session | null = null

const post = (message: FromWorker) => self.postMessage(message, frameTransferables(message.frame))

const publish = (current: Session, fresh: readonly Observation[]) => {
  const finished = current.state.step >= current.parameters.run.steps
  const summary = finished
    ? summarize(current.parameters, {
        initial: current.state,
        final: current.state,
        observations: current.observations,
      })
    : null
  post({
    type: "frame",
    session: current.id,
    frame: fillFrame(current.pool.take(), current.state, finished),
    observations: fresh,
    summary,
  })
}

const load = (id: number, parameters: ModelParameters) => {
  const state = initialize(parameters)
  session = {
    id,
    parameters,
    state,
    observations: [],
    pool: createFramePool(parameters.lattice.width * parameters.lattice.height),
    stepper: createStepper(parameters),
  }
  publish(session, [observe(parameters, state)])
}

const advanceBy = (current: Session, steps: number) => {
  const remaining = Math.min(steps, current.parameters.run.steps - current.state.step)
  const fresh: Observation[] = []
  const state = current.stepper.advance(current.state, remaining, (next) =>
    fresh.push(observe(current.parameters, next)),
  )
  session = { ...current, state, observations: [...current.observations, ...fresh] }
  publish(session, fresh)
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const message = event.data
  if (message.type === "load") return load(message.session, message.parameters)
  if (session === null) return
  if (message.type === "advance") return advanceBy(session, message.steps)
  session.pool.give(message.frame)
}
