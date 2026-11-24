import { Link } from "@tanstack/react-router"
import { OutcomeBadge } from "../components/outcome-badge.tsx"
import { Card, CardDescription, CardTitle } from "../components/ui/card.tsx"
import { lessons, scenarios } from "../content/catalog.ts"

export const HomePage = () => (
  <div className="flex flex-col gap-8">
    <section className="flex max-w-2xl flex-col gap-2">
      <h1 className="text-2xl font-semibold">How does a salamander regrow a limb?</h1>
      <p className="text-ink-secondary">
        An axolotl can regrow a lost limb. A human can heal the wound, but the limb stays missing.
        Explore what starts growth in the axolotl model and what makes it stop.
      </p>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Lessons</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <Link key={lesson.slug} to="/learn/$slug" params={{ slug: lesson.slug }}>
            <Card className="h-full hover:border-accent">
              <CardTitle>{lesson.title}</CardTitle>
            </Card>
          </Link>
        ))}
      </div>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Benchmarks</h2>
      <p className="text-ink-secondary">
        Each benchmark tests one prediction about regrowth. Pick one to see what happens.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <Link key={scenario.name} to="/scenario/$name" params={{ name: scenario.name }}>
            <Card className="flex h-full flex-col gap-2 hover:border-accent">
              <CardTitle className="first-letter:uppercase">
                {scenario.name.replaceAll("-", " ")}
              </CardTitle>
              <CardDescription>{scenario.summary}</CardDescription>
              {scenario.benchmark && <OutcomeBadge outcome={scenario.benchmark.expectedOutcome} />}
            </Card>
          </Link>
        ))}
      </div>
    </section>
  </div>
)
