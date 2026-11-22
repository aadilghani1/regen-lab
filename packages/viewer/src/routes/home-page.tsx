import { Link } from "@tanstack/react-router"
import { OutcomeBadge } from "../components/outcome-badge.tsx"
import { Card, CardDescription, CardTitle } from "../components/ui/card.tsx"
import { lessons, scenarios } from "../content/catalog.ts"

export const HomePage = () => (
  <div className="flex flex-col gap-8">
    <section className="flex max-w-2xl flex-col gap-2">
      <h1 className="text-2xl font-semibold">How does a salamander regrow a limb?</h1>
      <p className="text-ink-secondary">
        An in-silico lab for limb regeneration. Cells on a grid read diffusing signals, form a
        blastema, regrow what was lost, and stop. Change the experiment and watch what breaks.
      </p>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Lessons</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <Link key={lesson.slug} to="/learn/$slug" params={{ slug: lesson.slug }}>
            <Card className="h-full hover:border-accent">
              <CardTitle>{lesson.title}</CardTitle>
              <CardDescription>Module: {lesson.module}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Benchmarks</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <Link key={scenario.name} to="/scenario/$name" params={{ name: scenario.name }}>
            <Card className="flex h-full flex-col gap-2 hover:border-accent">
              <CardTitle>{scenario.name}</CardTitle>
              <CardDescription>
                {scenario.benchmark?.observation ?? scenario.summary}
              </CardDescription>
              {scenario.benchmark && <OutcomeBadge outcome={scenario.benchmark.expectedOutcome} />}
            </Card>
          </Link>
        ))}
      </div>
    </section>
  </div>
)
