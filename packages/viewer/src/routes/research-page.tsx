import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

interface RecordNode {
  readonly id: string
  readonly kind: string
  readonly title: string
  readonly text: string
  readonly screen?: string
  readonly publication?: string
  readonly measured?: string
  readonly groups?: string
  readonly onset_review?: string
  readonly independent_cohort?: string
  readonly implication?: string
  readonly paper?: string
  readonly location?: string
  readonly anchor?: string
  readonly authors?: string
  readonly source?: string
  readonly origin?: string
  readonly license?: string
  readonly module?: string
  readonly status?: string
}

interface Library {
  readonly nodes: readonly RecordNode[]
  readonly edges: readonly (readonly [string, string, string])[]
}

const loadIndex = async (): Promise<Library> => {
  const response = await fetch(`${import.meta.env.BASE_URL}research-index.json`)
  if (!response.ok) throw new Error("Research index unavailable")
  return response.json()
}

const label = (node: RecordNode) =>
  node.kind === "Paper"
    ? node.text
      ? "Local text"
      : node.origin
        ? "Archived text"
        : "Citation"
    : node.kind

export const ResearchPage = () => {
  const query = useQuery({ queryKey: ["research-library"], queryFn: loadIndex })
  const [view, setView] = useState<"Findings" | "Library">("Findings")
  const [section, setSection] = useState("")
  const [scope, setScope] = useState("Papers with text")
  const [term, setTerm] = useState("")
  const [selected, setSelected] = useState("")
  if (query.isError)
    return (
      <p>
        Research index unavailable.{" "}
        <button type="button" onClick={() => query.refetch()}>
          Try again
        </button>
      </p>
    )
  if (!query.data) return <p>Opening research library…</p>
  const { nodes, edges } = query.data
  const papers = nodes.filter((n) => n.kind === "Paper")
  const assessed = papers.filter((n) => n.onset_review)
  const cohorts = new Set(assessed.map((n) => n.independent_cohort).filter(Boolean))
  const words = term.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const matches = nodes
    .filter((n) => {
      if (scope === "Papers with text") {
        if (n.kind !== "Paper" || (!n.text && !n.origin)) return false
      } else if (scope === "Onset reviews") {
        if (!n.onset_review) return false
      } else if (scope === "Measurements") {
        if (!n.measured) return false
      } else if (scope === "All papers") {
        if (n.kind !== "Paper") return false
      } else if (scope === "Axolotl limb studies") {
        if (n.screen !== "Axolotl limb study") return false
      } else if (scope !== "All records" && label(n) !== scope) return false
      const searchable = [
        n.title,
        n.id,
        n.authors,
        n.kind,
        n.text,
        n.module,
        n.status,
        n.measured,
        n.groups,
        n.location,
        n.onset_review,
        n.publication,
        n.screen,
        label(n),
      ]
        .join(" ")
        .toLowerCase()
      return words.every((word) => searchable.includes(word))
    })
    .sort(
      (a, b) =>
        Number(Boolean(b.text && b.kind === "Paper")) -
          Number(Boolean(a.text && a.kind === "Paper")) || a.title.localeCompare(b.title),
    )
  const active = nodes.find((n) => n.id === selected) ?? matches[0]
  const related = active ? edges.filter(([a, , b]) => a === active.id || b === active.id) : []
  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold">Research</h1>
        <p className="text-ink-secondary">
          {papers.length} paper records · {papers.filter((n) => n.origin || n.text).length} with
          text available · {papers.filter((n) => n.measured).length} with measurements indexed
        </p>
        <details className="mt-3 max-w-prose text-sm">
          <summary className="cursor-pointer font-medium">
            Timing prediction · {assessed.length} studies checked · {cohorts.size} independent
            datasets qualify
          </summary>
          <p className="mt-2 text-ink-secondary">
            Does new tissue first appear at the same time after cuts at two different levels? A
            study needs to report the first visible bud separately for both groups on the same
            schedule. We count each eligible group of animals once and exclude data used to build
            the model.
          </p>
          <button
            type="button"
            className="mt-2 text-accent underline underline-offset-4"
            onClick={() => {
              setView("Library")
              setScope("Onset reviews")
              setTerm("")
              setSelected("")
              setSection("")
            }}
          >
            See the {assessed.length} studies checked for timing
          </button>
        </details>
      </header>
      <nav aria-label="Research views" className="flex gap-5 border-b border-border">
        {(["Findings", "Library"] as const).map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={view === item}
            onClick={() => setView(item)}
            className="border-b-2 border-transparent pb-2 text-sm font-medium text-ink-muted aria-pressed:border-ink aria-pressed:text-ink"
          >
            {item}
          </button>
        ))}
      </nav>
      {view === "Findings" ? (
        <section
          className="mx-auto max-w-3xl divide-y divide-border"
          aria-label="Research findings"
        >
          {nodes
            .filter((n) => n.kind === "Finding")
            .map((n) => (
              <article key={n.id} className="space-y-3 py-6 first:pt-1">
                <h2 className="max-w-2xl text-2xl font-semibold leading-tight">{n.title}</h2>
                <p className="max-w-prose leading-relaxed text-ink-secondary">{n.text}</p>
                <p className="max-w-prose text-sm leading-relaxed">
                  <strong>For the model. </strong>
                  {n.implication}
                </p>
                <button
                  type="button"
                  className="text-sm text-accent underline underline-offset-4"
                  onClick={() => {
                    setView("Library")
                    setScope("All records")
                    setTerm("")
                    setSelected(n.paper ?? "")
                    setSection(n.anchor ?? "")
                  }}
                >
                  Read the evidence · {n.location}
                </button>
              </article>
            ))}
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block w-full max-w-xl text-sm font-medium">
              Search the library
              <input
                type="search"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value)
                  setSection("")
                  setSelected("")
                }}
                placeholder="Try metamorphosis or nerve dependence"
                className="mt-1 block w-full rounded border border-border bg-surface-1 p-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Show
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value)
                  setSelected("")
                  setSection("")
                }}
                className="mt-1 block rounded border border-border bg-surface-1 px-3 py-2"
              >
                {[
                  "Papers with text",
                  "All papers",
                  "Axolotl limb studies",
                  "Measurements",
                  "Onset reviews",
                  "Reading note",
                  "Model rule",
                  "Scenario",
                  "All records",
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-6 md:grid-cols-[minmax(220px,1fr)_2fr]">
            <section aria-label="Search results">
              <p aria-live="polite" className="mb-2 text-sm text-ink-secondary">
                {matches.length} records
              </p>
              <div className="max-h-80 overflow-auto border-y border-border md:max-h-[65vh]">
                {matches.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    aria-pressed={active?.id === n.id}
                    onClick={() => {
                      setSelected(n.id)
                      setSection("")
                    }}
                    className="block w-full border-b border-border px-2 py-3 text-left hover:bg-surface-1 aria-pressed:bg-surface-1"
                  >
                    <span className="block text-xs text-ink-muted">{label(n)}</span>
                    {n.title}
                  </button>
                ))}
              </div>
            </section>
            {active ? (
              <article className="min-w-0 space-y-3" aria-label="Selected record">
                <p className="text-sm text-ink-muted">
                  {[
                    label(active),
                    active.screen,
                    active.publication,
                    active.status,
                    active.module,
                    active.license,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h2 className="text-xl font-semibold">{active.title}</h2>
                {active.authors && <p className="text-sm">{active.authors}</p>}
                {active.measured && (
                  <dl className="space-y-2 border-l-2 border-border pl-3 text-sm">
                    {[
                      ["What was measured", active.measured],
                      ["Groups compared", active.groups],
                      ["Where to check", active.location],
                      ["Timing prediction", active.onset_review],
                    ].map(
                      ([name, value]) =>
                        value && (
                          <div key={name}>
                            <dt className="text-ink-muted">{name}</dt>
                            <dd>{value}</dd>
                          </div>
                        ),
                    )}
                  </dl>
                )}
                {active.source && (
                  <a className="underline" href={active.source}>
                    Original publication
                  </a>
                )}
                {active.origin && (
                  <a className="ml-4 underline" href={active.origin}>
                    Source text
                  </a>
                )}
                {section && active.text.includes(section) && (
                  <blockquote className="max-h-52 overflow-auto border-l-2 border-accent bg-surface-1 p-3 text-sm leading-relaxed">
                    {active.text.split("\n").find((line) => line.includes(section))}
                  </blockquote>
                )}
                {related.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-semibold">
                      Connections ({related.length})
                    </summary>
                    <ul>
                      {related.map(([a, relation, b]) => {
                        const other = nodes.find((n) => n.id === (active.id === a ? b : a))
                        if (!other) return null
                        const reverse: Record<string, string> = {
                          "draws from": "Source for",
                          "uses rule": "Used by",
                          cites: "Cited by",
                          discusses: "Discussed in",
                        }
                        return (
                          <li key={a + relation + b} className="text-sm">
                            {active.id === a ? relation : reverse[relation]} ·{" "}
                            <button
                              type="button"
                              className="underline"
                              onClick={() => {
                                setSection("")
                                setSelected(other.id)
                              }}
                            >
                              {other.title}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                )}
                {active.text ? (
                  <div className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words border-t border-border pt-3 text-sm leading-relaxed">
                    {active.text}
                  </div>
                ) : (
                  <p className="text-sm text-ink-secondary">
                    {active.origin
                      ? "Open Source text to read the archived edition."
                      : "Only the citation is stored locally."}
                  </p>
                )}
              </article>
            ) : (
              <p>No matching records. Try a broader term.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
