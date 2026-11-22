import type { Frame, FrameLayer } from "../simulation/protocol.ts"
import type { Mode } from "./palette.ts"
import { sequentialRamp } from "./palette.ts"

export type Panel = "tissue" | FrameLayer

export interface PanelDescription {
  readonly panel: Panel
  readonly title: string
  readonly legend: string
  readonly slot: 0 | 1 | 2 | 3
}

export const PANELS: readonly PanelDescription[] = [
  {
    panel: "tissue",
    title: "Tissue",
    legend: "grey differentiated cell · pink progenitor",
    slot: 0,
  },
  {
    panel: "identity",
    title: "Positional identity",
    legend: "pale = shoulder (0) → dark = tip (1)",
    slot: 0,
  },
  { panel: "nerve", title: "Nerve signal", legend: "relative concentration", slot: 1 },
  {
    panel: "distalGrowth",
    title: "Distal growth signal (AEC)",
    legend: "relative concentration",
    slot: 2,
  },
  { panel: "proximal", title: "Proximal signal", legend: "relative concentration", slot: 3 },
]

export const rampsFor = (mode: Mode) =>
  Object.fromEntries(PANELS.map((p) => [p.panel, sequentialRamp(mode, p.slot)])) as Record<
    Panel,
    ReturnType<typeof sequentialRamp>
  >

export const valuesFor = (frame: Frame, layer: FrameLayer): Float32Array => frame[layer]

export const maximumOf = (values: Float32Array): number => {
  let maximum = 0
  for (let i = 0; i < values.length; i++) if (values[i] > maximum) maximum = values[i]
  return maximum
}
