export type Mode = "light" | "dark"

type Rgb = readonly [number, number, number]

const rgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]

export const SURFACE: Record<Mode, string> = { light: "#fcfcfb", dark: "#1a1a19" }

export const SERIES: Record<Mode, readonly string[]> = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c", "#9085e9", "#e66767"],
}

export const TISSUE: Record<
  Mode,
  { readonly differentiated: string; readonly progenitor: string }
> = {
  light: { differentiated: "#b9b8b2", progenitor: SERIES.light[4] ?? "#e87ba4" },
  dark: { differentiated: "#55544f", progenitor: SERIES.dark[4] ?? "#d55181" },
}

const SEQUENTIAL_DARK_END: Record<Mode, readonly string[]> = {
  light: ["#0d366b", "#7a2a0d", "#0b4d35", "#5c3e00"],
  dark: ["#cde2fb", "#fbd5c4", "#c4f0de", "#fde7b3"],
}

export interface Ramp {
  readonly table: Uint8Array
  readonly size: number
}

const RAMP_SIZE = 256

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

const rampThrough = (stops: readonly Rgb[]): Ramp => {
  const table = new Uint8Array(RAMP_SIZE * 3)
  const segments = stops.length - 1
  for (let i = 0; i < RAMP_SIZE; i++) {
    const position = (i / (RAMP_SIZE - 1)) * segments
    const segment = Math.min(Math.floor(position), segments - 1)
    const t = position - segment
    const from = stops[segment] ?? [0, 0, 0]
    const to = stops[segment + 1] ?? from
    table[i * 3] = lerp(from[0], to[0], t)
    table[i * 3 + 1] = lerp(from[1], to[1], t)
    table[i * 3 + 2] = lerp(from[2], to[2], t)
  }
  return { table, size: RAMP_SIZE }
}

export const sequentialRamp = (mode: Mode, slot: 0 | 1 | 2 | 3): Ramp =>
  rampThrough([
    rgb(SURFACE[mode]),
    rgb(SERIES[mode][slot] ?? "#888888"),
    rgb(SEQUENTIAL_DARK_END[mode][slot] ?? "#000000"),
  ])

export const hexOf = rgb
