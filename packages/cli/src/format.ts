import type { Summary } from "@regen-lab/core"

export const table = (headers: readonly string[], rows: readonly (readonly string[])[]): string => {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? "").length)),
  )
  const line = (cells: readonly string[]) =>
    cells
      .map((cell, column) => cell.padEnd(widths[column] ?? 0))
      .join("  ")
      .trimEnd()
  return [line(headers), line(widths.map((width) => "-".repeat(width))), ...rows.map(line)].join(
    "\n",
  )
}

export const ratio = (value: number): string => value.toFixed(2)

export const SUMMARY_HEADERS = [
  "scenario",
  "seed",
  "outcome",
  "length",
  "length ratio",
  "regrowth ratio",
  "positional error",
  "terminated at",
] as const

export const summaryRow = (scenario: string, seed: number, summary: Summary): readonly string[] => [
  scenario,
  String(seed),
  summary.outcome,
  String(summary.finalLength),
  ratio(summary.lengthRatio),
  ratio(summary.regrowthRatio),
  summary.positionalError.toFixed(3),
  summary.terminatedAtStep === null ? "-" : String(summary.terminatedAtStep),
]
