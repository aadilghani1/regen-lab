import type { ModelParameters, Summary } from "@regen-lab/core"
import { parseScenarioObject } from "@regen-lab/scenarios"
import { useMutation } from "@tanstack/react-query"
import { LengthChart } from "../charts/length-chart.tsx"
import { OutcomeBadge } from "../components/outcome-badge.tsx"
import { Card } from "../components/ui/card.tsx"
import { runBatch } from "../simulation/batch.ts"

interface Replay {
  readonly id: string
  readonly gitCommit: string | null
  readonly parameters: ModelParameters
  readonly recorded: Summary
  readonly replayed: Summary
  readonly observations: readonly { step: number; limbLength: number }[]
}

const COMPARED: readonly (keyof Summary)[] = [
  "outcome",
  "finalLength",
  "regrown",
  "lengthRatio",
  "positionalError",
  "terminatedAtStep",
]

const replayFile = async (file: File): Promise<Replay> => {
  const record = JSON.parse(await file.text())
  const parsed = parseScenarioObject(record.scenario)
  if (!parsed.ok) throw new Error(parsed.issues.join("; "))
  const [result] = await runBatch([parsed.scenario.model])
  if (!result) throw new Error("the replay produced no result")
  return {
    id: String(record.id),
    gitCommit: record.provenance?.gitCommit ?? null,
    parameters: parsed.scenario.model,
    recorded: record.summary,
    replayed: result.summary,
    observations: result.observations,
  }
}

const agrees = (replay: Replay) =>
  COMPARED.every(
    (key) => JSON.stringify(replay.recorded[key]) === JSON.stringify(replay.replayed[key]),
  )

export const ReplayPage = () => {
  const replay = useMutation({ mutationFn: replayFile })
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Replay a tracked run</h1>
        <p className="text-ink-secondary">
          Choose a <code>run.json</code> written by <code>regen run</code>. The run is re-simulated
          here from its recorded parameters and seed, and the outcomes are compared.
        </p>
      </div>
      <Card>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) replay.mutate(file)
          }}
        />
      </Card>
      {replay.isPending && <p className="text-sm text-ink-muted">Replaying…</p>}
      {replay.isError && <p className="text-critical">Could not replay: {String(replay.error)}</p>}
      {replay.data && (
        <>
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">{replay.data.id}</span>
              <OutcomeBadge outcome={replay.data.replayed.outcome} />
              <span className={agrees(replay.data) ? "text-good" : "text-critical"}>
                {agrees(replay.data) ? "✓ Reproduced exactly" : "! Differs from the recorded run"}
              </span>
              <span className="text-xs text-ink-muted">
                commit {replay.data.gitCommit ?? "unknown"}
              </span>
            </div>
            <table className="text-sm">
              <thead>
                <tr className="text-left text-ink-secondary">
                  <th className="pr-6 font-medium">Metric</th>
                  <th className="pr-6 font-medium">Recorded</th>
                  <th className="font-medium">Replayed</th>
                </tr>
              </thead>
              <tbody>
                {COMPARED.map((key) => (
                  <tr key={key}>
                    <td className="pr-6 text-ink-secondary">{key}</td>
                    <td className="pr-6 tabular-nums">{String(replay.data.recorded[key])}</td>
                    <td className="tabular-nums">{String(replay.data.replayed[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <LengthChart
              title="Replayed limb length"
              series={[{ name: replay.data.id, points: replay.data.observations }]}
              maxStep={replay.data.parameters.run.steps}
              originalLength={replay.data.parameters.lattice.limbLength}
            />
          </Card>
        </>
      )}
    </div>
  )
}
