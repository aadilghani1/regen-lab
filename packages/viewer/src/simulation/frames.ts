import type { SimulationState } from "@regen-lab/core"
import type { Frame } from "./protocol.ts"

export const allocateFrame = (size: number): Frame => ({
  step: 0,
  finished: false,
  kind: new Uint8Array(size),
  identity: new Float32Array(size),
  nerve: new Float32Array(size),
  distalGrowth: new Float32Array(size),
  proximal: new Float32Array(size),
})

export const fillFrame = (frame: Frame, state: SimulationState, finished: boolean): Frame => {
  frame.kind.set(state.tissue.kind)
  frame.identity.set(state.tissue.positionalIdentity)
  frame.nerve.set(state.signals.nerve)
  frame.distalGrowth.set(state.signals.distalGrowth)
  frame.proximal.set(state.signals.proximal)
  return { ...frame, step: state.step, finished }
}

export const createFramePool = (size: number) => {
  const free: Frame[] = []
  return {
    take: (): Frame => free.pop() ?? allocateFrame(size),
    give: (frame: Frame): void => {
      if (frame.kind.length === size) free.push(frame)
    },
  }
}
