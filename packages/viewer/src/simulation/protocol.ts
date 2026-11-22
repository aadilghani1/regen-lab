import type { ModelParameters, Observation, Summary } from "@regen-lab/core"

export interface Frame {
  readonly step: number
  readonly finished: boolean
  readonly kind: Uint8Array
  readonly identity: Float32Array
  readonly nerve: Float32Array
  readonly distalGrowth: Float32Array
  readonly proximal: Float32Array
}

export type FrameLayer = "identity" | "nerve" | "distalGrowth" | "proximal"

export type ToWorker =
  | { readonly type: "load"; readonly session: number; readonly parameters: ModelParameters }
  | { readonly type: "advance"; readonly steps: number }
  | { readonly type: "recycle"; readonly frame: Frame }

export type FromWorker = {
  readonly type: "frame"
  readonly session: number
  readonly frame: Frame
  readonly observations: readonly Observation[]
  readonly summary: Summary | null
}

export const frameTransferables = (frame: Frame): Transferable[] => [
  frame.kind.buffer,
  frame.identity.buffer,
  frame.nerve.buffer,
  frame.distalGrowth.buffer,
  frame.proximal.buffer,
]
