import { useId } from "react"

export const RangeControl = ({
  label,
  value,
  min,
  max,
  step,
  format = String,
  onChange,
}: {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly format?: (value: number) => string
  readonly onChange: (value: number) => void
}) => {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="text-ink-secondary">
          {label}
        </label>
        <span className="font-medium tabular-nums text-ink">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-accent"
      />
    </div>
  )
}

export const ToggleControl = ({
  label,
  hint,
  checked,
  onChange,
}: {
  readonly label: string
  readonly hint: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}) => {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-accent"
      />
      <label htmlFor={id} className="flex flex-col text-sm">
        <span className="text-ink">{label}</span>
        <span className="text-ink-muted">{hint}</span>
      </label>
    </div>
  )
}
