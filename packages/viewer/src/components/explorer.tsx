import type { Scenario } from "@regen-lab/scenarios"
import { useMemo, useState } from "react"
import { LengthChart } from "../charts/length-chart.tsx"
import { PANELS, type Panel } from "../render/layers.ts"
import {
  DEFAULT_SPEED,
  type ExplorationSearch,
  explorationParameters,
} from "../simulation/explore.ts"
import { useSimulation } from "../simulation/use-simulation.ts"
import { LatticePanels } from "./lattice-panels.tsx"
import { OutcomeBadge } from "./outcome-badge.tsx"
import { Button } from "./ui/button.tsx"
import { Card } from "./ui/card.tsx"
import { RangeControl, ToggleControl } from "./ui/controls.tsx"

const DEFAULT_PANELS: readonly Panel[] = ["tissue", "identity", "nerve"]

const Metric = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <div className="flex flex-col">
    <span className="text-xs text-ink-muted">{label}</span>
    <span className="text-lg font-semibold tabular-nums text-ink">{value}</span>
  </div>
)

const ExperimentControls = ({
  scenario,
  search,
  onChange,
}: {
  readonly scenario: Scenario
  readonly search: ExplorationSearch
  readonly onChange: (next: ExplorationSearch) => void
}) => {
  const parameters = explorationParameters(scenario.model, search)
  const set = (patch: ExplorationSearch) => onChange({ ...search, ...patch })
  return (
    <Card className="flex flex-col gap-4 self-start">
      <h3 className="text-sm font-semibold">Experiment</h3>
      <RangeControl
        label="Amputation level"
        value={parameters.amputation.level}
        min={0.1}
        max={0.9}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}% along the limb`}
        onChange={(level) => set({ level })}
      />
      <RangeControl
        label="Extra proximal signal"
        value={parameters.treatment.exogenousProximal}
        min={0}
        max={0.5}
        step={0.05}
        format={(v) => v.toFixed(2)}
        onChange={(proximal) => set({ proximal })}
      />
      <ToggleControl
        label="Remove nerves"
        hint="Denervate the limb at amputation"
        checked={parameters.treatment.denervate}
        onChange={(denervate) => set({ denervate })}
      />
      <ToggleControl
        label="Termination"
        hint="Progenitors stop at the distal positional identity"
        checked={parameters.cells.termination}
        onChange={(termination) => set({ termination })}
      />
      <RangeControl
        label="Seed"
        value={parameters.run.seed}
        min={0}
        max={99}
        step={1}
        onChange={(seed) => set({ seed })}
      />
      <RangeControl
        label="Speed"
        value={search.speed ?? DEFAULT_SPEED}
        min={1}
        max={30}
        step={1}
        format={(v) => `${v} steps / frame`}
        onChange={(speed) => set({ speed })}
      />
    </Card>
  )
}

export const Explorer = ({
  scenario,
  search,
  onSearchChange,
}: {
  readonly scenario: Scenario
  readonly search: ExplorationSearch
  readonly onSearchChange: (next: ExplorationSearch) => void
}) => {
  const { level, denervate, proximal, termination, seed } = search
  const parameters = useMemo(
    () => explorationParameters(scenario.model, { level, denervate, proximal, termination, seed }),
    [scenario.model, level, denervate, proximal, termination, seed],
  )
  const [panels, setPanels] = useState<readonly Panel[]>(DEFAULT_PANELS)
  const { view, play, pause, stepOnce, reset } = useSimulation(
    parameters,
    search.speed ?? DEFAULT_SPEED,
  )
  const latest = view.observations.at(-1)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-wrap items-center gap-3">
          {view.playing ? (
            <Button variant="primary" onClick={pause}>
              Pause
            </Button>
          ) : (
            <Button variant="primary" onClick={play} disabled={view.frame?.finished ?? true}>
              Play
            </Button>
          )}
          <Button onClick={stepOnce} disabled={view.playing || (view.frame?.finished ?? true)}>
            Step
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
          <div className="ml-auto flex gap-6">
            <Metric label="step" value={`${view.frame?.step ?? 0} / ${parameters.run.steps}`} />
            <Metric label="limb length" value={`${latest?.limbLength ?? "–"}`} />
            <Metric label="progenitors" value={`${latest?.progenitors ?? "–"}`} />
          </div>
        </Card>
        {view.summary && (
          <Card className="flex flex-wrap items-center gap-4">
            <OutcomeBadge outcome={view.summary.outcome} />
            <span className="text-sm text-ink-secondary">
              Regrew {view.summary.regrown} of{" "}
              {view.summary.originalLength - view.summary.stumpLength} missing cells · length ratio{" "}
              {view.summary.lengthRatio.toFixed(2)} · positional error{" "}
              {view.summary.positionalError.toFixed(3)}
            </span>
            <span className="text-xs text-ink-muted">
              This is an exploration. Record results with <code>regen run</code>.
            </span>
          </Card>
        )}
        <Card className="flex flex-col gap-3">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Visible layers</legend>
            {PANELS.map((description) => {
              const active = panels.includes(description.panel)
              return (
                <Button
                  key={description.panel}
                  variant={active ? "primary" : "secondary"}
                  className="h-7 text-xs"
                  aria-pressed={active}
                  onClick={() =>
                    setPanels(
                      active
                        ? panels.filter((panel) => panel !== description.panel)
                        : [...panels, description.panel],
                    )
                  }
                >
                  {description.title}
                </Button>
              )
            })}
          </fieldset>
          {view.frame ? (
            <LatticePanels parameters={parameters} frame={view.frame} panels={panels} />
          ) : (
            <p className="text-sm text-ink-muted">Preparing the intact limb…</p>
          )}
        </Card>
        <Card>
          <LengthChart
            title="Limb length over time"
            series={[{ name: scenario.name, points: view.observations }]}
            maxStep={parameters.run.steps}
            originalLength={parameters.lattice.limbLength}
          />
        </Card>
      </div>
      <ExperimentControls scenario={scenario} search={search} onChange={onSearchChange} />
    </div>
  )
}
