import { CellKind } from "@regen-lab/core"
import type { Frame, FrameLayer } from "../simulation/protocol.ts"
import { maximumOf } from "./layers.ts"
import { hexOf, type Mode, type Ramp, SURFACE, TISSUE } from "./palette.ts"

const writePixel = (pixels: Uint8ClampedArray, index: number, r: number, g: number, b: number) => {
  const offset = index * 4
  pixels[offset] = r
  pixels[offset + 1] = g
  pixels[offset + 2] = b
  pixels[offset + 3] = 255
}

export const paintTissueInto = (pixels: Uint8ClampedArray, frame: Frame, mode: Mode) => {
  const surface = hexOf(SURFACE[mode])
  const differentiated = hexOf(TISSUE[mode].differentiated)
  const progenitor = hexOf(TISSUE[mode].progenitor)
  for (let i = 0; i < frame.kind.length; i++) {
    const color =
      frame.kind[i] === CellKind.Progenitor
        ? progenitor
        : frame.kind[i] === CellKind.Differentiated
          ? differentiated
          : surface
    writePixel(pixels, i, color[0], color[1], color[2])
  }
  return pixels
}

const paintValuesInto = (
  pixels: Uint8ClampedArray,
  values: Float32Array,
  scale: number,
  ramp: Ramp,
  visible: (index: number) => boolean,
  mode: Mode,
) => {
  const surface = hexOf(SURFACE[mode])
  const top = ramp.size - 1
  for (let i = 0; i < values.length; i++) {
    if (!visible(i)) {
      writePixel(pixels, i, surface[0], surface[1], surface[2])
      continue
    }
    const step = Math.min(top, Math.max(0, Math.round((values[i] / scale) * top)))
    writePixel(pixels, i, ramp.table[step * 3], ramp.table[step * 3 + 1], ramp.table[step * 3 + 2])
  }
  return pixels
}

export const paintLayerInto = (
  pixels: Uint8ClampedArray,
  frame: Frame,
  layer: FrameLayer,
  ramp: Ramp,
  mode: Mode,
) =>
  layer === "identity"
    ? paintValuesInto(
        pixels,
        frame.identity,
        1,
        ramp,
        (i) => frame.kind[i] !== CellKind.Empty,
        mode,
      )
    : paintValuesInto(
        pixels,
        frame[layer],
        Math.max(maximumOf(frame[layer]), 1e-9),
        ramp,
        () => true,
        mode,
      )
