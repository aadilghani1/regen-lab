import type { ModelParameters, Observation, Summary } from "@regen-lab/core"
import { useCallback, useEffect, useReducer, useRef } from "react"
import type { Frame, FromWorker, ToWorker } from "./protocol.ts"

export interface SimulationView {
  readonly frame: Frame | null
  readonly observations: readonly Observation[]
  readonly summary: Summary | null
  readonly playing: boolean
}

type Action =
  | { readonly type: "received"; readonly message: FromWorker }
  | { readonly type: "reset" }
  | { readonly type: "playing"; readonly playing: boolean }

const EMPTY: SimulationView = { frame: null, observations: [], summary: null, playing: false }

const reduce = (view: SimulationView, action: Action): SimulationView => {
  switch (action.type) {
    case "reset":
      return { ...EMPTY, playing: view.playing }
    case "playing":
      return { ...view, playing: action.playing }
    case "received":
      return {
        frame: action.message.frame,
        observations: [...view.observations, ...action.message.observations],
        summary: action.message.summary,
        playing: view.playing && !action.message.frame.finished,
      }
  }
}

const createWorker = () =>
  new Worker(new URL("./simulation.worker.ts", import.meta.url), { type: "module" })

export const useSimulation = (parameters: ModelParameters, stepsPerFrame: number) => {
  const [view, dispatch] = useReducer(reduce, EMPTY)
  const worker = useRef<Worker | null>(null)
  const pending = useRef(false)
  const shown = useRef<Frame | null>(null)
  const playing = useRef(false)
  const session = useRef(0)
  const speed = useRef(stepsPerFrame)
  speed.current = stepsPerFrame
  playing.current = view.playing

  const send = useCallback((message: ToWorker, transfer: Transferable[] = []) => {
    worker.current?.postMessage(message, transfer)
  }, [])

  const request = useCallback(
    (steps: number) => {
      if (pending.current) return
      pending.current = true
      send({ type: "advance", steps })
    },
    [send],
  )

  useEffect(() => {
    const instance = createWorker()
    worker.current = instance
    instance.onmessage = (event: MessageEvent<FromWorker>) => {
      if (event.data.session !== session.current) return
      pending.current = false
      const previous = shown.current
      shown.current = event.data.frame
      dispatch({ type: "received", message: event.data })
      if (previous !== null) {
        instance.postMessage({ type: "recycle", frame: previous } satisfies ToWorker, [
          previous.kind.buffer,
          previous.identity.buffer,
          previous.nerve.buffer,
          previous.distalGrowth.buffer,
          previous.proximal.buffer,
        ])
      }
      if (playing.current && !event.data.frame.finished) {
        requestAnimationFrame(() => {
          if (playing.current) {
            pending.current = true
            instance.postMessage({ type: "advance", steps: speed.current } satisfies ToWorker)
          }
        })
      }
    }
    return () => {
      instance.terminate()
      worker.current = null
    }
  }, [])

  const load = useCallback(() => {
    session.current += 1
    shown.current = null
    pending.current = true
    dispatch({ type: "reset" })
    send({ type: "load", session: session.current, parameters })
  }, [parameters, send])

  useEffect(load, [load])

  const play = useCallback(() => {
    dispatch({ type: "playing", playing: true })
    playing.current = true
    request(speed.current)
  }, [request])

  const pause = useCallback(() => dispatch({ type: "playing", playing: false }), [])

  const stepOnce = useCallback(() => request(1), [request])

  const reset = useCallback(() => {
    dispatch({ type: "playing", playing: false })
    playing.current = false
    load()
  }, [load])

  return { view, play, pause, stepOnce, reset }
}
