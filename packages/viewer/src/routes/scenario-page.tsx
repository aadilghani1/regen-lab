import { Link, useNavigate } from "@tanstack/react-router"
import { Explorer } from "../components/explorer.tsx"
import { OutcomeBadge } from "../components/outcome-badge.tsx"
import { scenarioNamed } from "../content/catalog.ts"
import { scenarioRoute } from "../router.tsx"

export const ScenarioPage = () => {
  const { name } = scenarioRoute.useParams()
  const search = scenarioRoute.useSearch()
  const navigate = useNavigate({ from: scenarioRoute.fullPath })
  const scenario = scenarioNamed(name)
  if (!scenario) {
    return (
      <p>
        No scenario named {name}. <Link to="/">Back home</Link>
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold first-letter:uppercase">
          {scenario.name.replaceAll("-", " ")}
        </h1>
        <p className="text-ink-secondary">{scenario.summary}</p>
        {scenario.benchmark && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
            Expected outcome
            <OutcomeBadge outcome={scenario.benchmark.expectedOutcome} />
          </p>
        )}
      </div>
      <Explorer
        scenario={scenario}
        search={search}
        onSearchChange={(next) => navigate({ search: next, replace: true })}
      />
    </div>
  )
}
