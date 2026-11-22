import type { Summary } from "@regen-lab/core"
import { useQuery } from "@tanstack/react-query"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { LengthChart } from "../charts/length-chart.tsx"
import { OutcomeBadge } from "../components/outcome-badge.tsx"
import { Button } from "../components/ui/button.tsx"
import { Card } from "../components/ui/card.tsx"
import { RangeControl } from "../components/ui/controls.tsx"
import { scenarios } from "../content/catalog.ts"
import { runBatch } from "../simulation/batch.ts"

interface Row {
  readonly scenario: string
  readonly seed: number
  readonly summary: Summary
}

const column = createColumnHelper<Row>()

const columns = [
  column.accessor("scenario", { header: "Scenario" }),
  column.accessor("seed", { header: "Seed" }),
  column.accessor((row) => row.summary.outcome, {
    id: "outcome",
    header: "Outcome",
    cell: (info) => <OutcomeBadge outcome={info.getValue()} />,
  }),
  column.accessor((row) => row.summary.finalLength, { id: "length", header: "Length" }),
  column.accessor((row) => row.summary.lengthRatio, {
    id: "ratio",
    header: "Length ratio",
    cell: (info) => info.getValue().toFixed(2),
  }),
  column.accessor((row) => row.summary.positionalError, {
    id: "error",
    header: "Positional error",
    cell: (info) => info.getValue().toFixed(3),
  }),
  column.accessor((row) => row.summary.terminatedAtStep, {
    id: "terminated",
    header: "Terminated at",
    cell: (info) => info.getValue() ?? "–",
  }),
]

const runsFor = (seeds: number) =>
  scenarios.flatMap((scenario) =>
    Array.from({ length: seeds }, (_, seed) => ({
      scenario: scenario.name,
      seed,
      parameters: { ...scenario.model, run: { ...scenario.model.run, seed } },
    })),
  )

export const ComparePage = () => {
  const [seeds, setSeeds] = useState(3)
  const [sorting, setSorting] = useState<SortingState>([])
  const query = useQuery({
    queryKey: ["compare", seeds],
    queryFn: async () => {
      const runs = runsFor(seeds)
      const results = await runBatch(runs.map((run) => run.parameters))
      return runs.map((run, i) => ({ ...run, result: results[i] }))
    },
  })
  const rows = useMemo<readonly Row[]>(
    () =>
      (query.data ?? []).flatMap((run) =>
        run.result ? [{ scenario: run.scenario, seed: run.seed, summary: run.result.summary }] : [],
      ),
    [query.data],
  )
  const series = useMemo(
    () =>
      (query.data ?? [])
        .filter((run) => run.seed === 0 && run.result)
        .map((run) => ({ name: run.scenario, points: run.result?.observations ?? [] })),
    [query.data],
  )
  const table = useReactTable({
    data: rows as Row[],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  const reference = scenarios[0]?.model

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Compare every benchmark</h1>
          <p className="text-ink-secondary">
            Each scenario across several seeds, run in a background worker.
          </p>
        </div>
        <div className="w-64">
          <RangeControl
            label="Seeds per scenario"
            value={seeds}
            min={1}
            max={10}
            step={1}
            onChange={setSeeds}
          />
        </div>
      </div>
      <Card className={query.isFetching ? "opacity-60" : ""}>
        {reference && (
          <LengthChart
            title="Limb length over time (seed 0)"
            series={series}
            maxStep={reference.run.steps}
            originalLength={reference.lattice.limbLength}
          />
        )}
      </Card>
      <Card className={query.isFetching ? "overflow-x-auto opacity-60" : "overflow-x-auto"}>
        {query.isError && <p className="text-critical">Simulation failed: {String(query.error)}</p>}
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-border text-left">
                {group.headers.map((header) => (
                  <th key={header.id} className="py-2 pr-4 font-medium text-ink-secondary">
                    <Button
                      variant="ghost"
                      className="h-7 px-1"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? ""}
                    </Button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2 pr-4 tabular-nums">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {query.isPending && <p className="py-4 text-sm text-ink-muted">Running simulations…</p>}
      </Card>
    </div>
  )
}
