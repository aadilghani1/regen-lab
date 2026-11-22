import type { ModelParameters } from "@regen-lab/core"
import { useEffect, useMemo, useRef } from "react"
import { PANELS, type Panel, type PanelDescription, rampsFor } from "../render/layers.ts"
import { paintLayerInto, paintTissueInto } from "../render/paint.ts"
import { useColorMode } from "../render/use-color-mode.ts"
import type { Frame } from "../simulation/protocol.ts"

const LatticePanel = ({
  description,
  frame,
  width,
  height,
}: {
  readonly description: PanelDescription
  readonly frame: Frame
  readonly width: number
  readonly height: number
}) => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const mode = useColorMode()
  const ramps = useMemo(() => rampsFor(mode), [mode])
  const image = useRef<ImageData | null>(null)

  useEffect(() => {
    const context = canvas.current?.getContext("2d")
    if (!context) return
    if (image.current?.width !== width || image.current.height !== height) {
      image.current = context.createImageData(width, height)
    }
    const pixels = image.current.data
    if (description.panel === "tissue") paintTissueInto(pixels, frame, mode)
    else paintLayerInto(pixels, frame, description.panel, ramps[description.panel], mode)
    context.putImageData(image.current, 0, 0)
  }, [frame, description.panel, mode, ramps, width, height])

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-ink">{description.title}</span>
        <span className="text-ink-muted">{description.legend}</span>
      </figcaption>
      <canvas
        ref={canvas}
        width={width}
        height={height}
        className="lattice w-full rounded border border-border"
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label={`${description.title} at step ${frame.step}`}
      />
    </figure>
  )
}

export const LatticePanels = ({
  parameters,
  frame,
  panels,
}: {
  readonly parameters: ModelParameters
  readonly frame: Frame
  readonly panels: readonly Panel[]
}) => (
  <div className="flex flex-col gap-3">
    {PANELS.filter((description) => panels.includes(description.panel)).map((description) => (
      <LatticePanel
        key={description.panel}
        description={description}
        frame={frame}
        width={parameters.lattice.width}
        height={parameters.lattice.height}
      />
    ))}
  </div>
)
