import { type PointerEvent, useMemo, useState } from "react"
import { SERIES } from "../render/palette.ts"
import { useColorMode } from "../render/use-color-mode.ts"
import { useElementWidth } from "./use-element-width.ts"

export interface LengthSeries {
  readonly name: string
  readonly points: readonly { readonly step: number; readonly limbLength: number }[]
}

const HEIGHT = 240
const MARGIN = { top: 12, right: 16, bottom: 28, left: 40 }
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom

const niceCeiling = (value: number) => Math.ceil(value / 20) * 20

const ticks = (maximum: number, count: number) =>
  Array.from({ length: count + 1 }, (_, i) => Math.round((maximum / count) * i))

export const LengthChart = ({
  series,
  maxStep,
  originalLength,
  title,
}: {
  readonly series: readonly LengthSeries[]
  readonly maxStep: number
  readonly originalLength: number
  readonly title: string
}) => {
  const mode = useColorMode()
  const [container, chartWidth] = useElementWidth<HTMLDivElement>(640)
  const plotWidth = chartWidth - MARGIN.left - MARGIN.right
  const [hoverStep, setHoverStep] = useState<number | null>(null)
  const maxLength = useMemo(
    () =>
      niceCeiling(
        Math.max(
          originalLength * 1.1,
          ...series.flatMap((s) => s.points.map((point) => point.limbLength)),
        ),
      ),
    [series, originalLength],
  )
  const x = (step: number) => MARGIN.left + (step / Math.max(maxStep, 1)) * plotWidth
  const y = (length: number) => MARGIN.top + PLOT_HEIGHT - (length / maxLength) * PLOT_HEIGHT
  const colorOf = (index: number) => SERIES[mode][index] ?? "#888888"

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const fraction = (event.clientX - box.left) / box.width
    setHoverStep(Math.round(Math.min(Math.max(fraction, 0), 1) * maxStep))
  }

  const readout =
    hoverStep === null
      ? []
      : series.map((s, index) => ({
          name: s.name,
          color: colorOf(index),
          value: s.points.findLast((point) => point.step <= hoverStep)?.limbLength,
        }))

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium text-ink">{title}</figcaption>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-secondary">
          {series.map((s, index) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: colorOf(index) }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div ref={container} className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={title}
        >
          {ticks(maxLength, 4).map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={chartWidth - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--border)"
              />
              <text
                x={MARGIN.left - 6}
                y={y(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted)"
              >
                {tick}
              </text>
            </g>
          ))}
          {ticks(maxStep, 4).map((tick) => (
            <text
              key={tick}
              x={x(tick)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
            >
              {tick}
            </text>
          ))}
          <line
            x1={MARGIN.left}
            x2={chartWidth - MARGIN.right}
            y1={y(originalLength)}
            y2={y(originalLength)}
            stroke="var(--text-secondary)"
            strokeDasharray="4 4"
          />
          <text
            x={chartWidth - MARGIN.right}
            y={y(originalLength) - 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--text-secondary)"
          >
            original length
          </text>
          {series.map((s, index) => (
            <polyline
              key={s.name}
              fill="none"
              stroke={colorOf(index)}
              strokeWidth={2}
              strokeLinejoin="round"
              points={s.points.map((point) => `${x(point.step)},${y(point.limbLength)}`).join(" ")}
            />
          ))}
          {hoverStep !== null && (
            <line
              x1={x(hoverStep)}
              x2={x(hoverStep)}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
              stroke="var(--text-muted)"
            />
          )}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotWidth}
            height={PLOT_HEIGHT}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHoverStep(null)}
          />
        </svg>
        {hoverStep !== null && (
          <div className="pointer-events-none absolute top-2 left-14 rounded-md border border-border bg-surface-1 px-3 py-2 text-xs shadow-sm">
            <div className="mb-1 text-ink-muted">step {hoverStep}</div>
            {readout.map((row) => (
              <div key={row.name} className="flex items-center gap-2">
                <span className="h-0.5 w-3 rounded" style={{ background: row.color }} />
                <span className="font-semibold tabular-nums text-ink">{row.value ?? "–"}</span>
                <span className="text-ink-secondary">{row.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-ink-muted">
        Limb length in cells (y) against simulation step (x).
      </p>
    </figure>
  )
}
