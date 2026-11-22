import { parseScenarioToml, type Scenario } from "@regen-lab/scenarios"
import { parseFrontmatter } from "./frontmatter.ts"

const scenarioFiles = import.meta.glob<string>("../../../scenarios/catalog/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
})

const lessonFiles = import.meta.glob<string>("../../../../docs/learn/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
})

const CATALOG_ORDER = ["baseline", "distal-cut", "denervated", "proximal-excess", "no-termination"]

const orderOf = (name: string) => {
  const index = CATALOG_ORDER.indexOf(name)
  return index < 0 ? CATALOG_ORDER.length : index
}

export const scenarios: readonly Scenario[] = Object.values(scenarioFiles)
  .map(parseScenarioToml)
  .flatMap((result) => (result.ok ? [result.scenario] : []))
  .sort((a, b) => orderOf(a.name) - orderOf(b.name))

export const scenarioNamed = (name: string): Scenario | undefined =>
  scenarios.find((scenario) => scenario.name === name)

export interface Lesson {
  readonly slug: string
  readonly title: string
  readonly module: string
  readonly scenario: string
  readonly body: string
}

const slugOf = (path: string) => path.split("/").at(-1)?.replace(/\.md$/, "") ?? path

export const lessons: readonly Lesson[] = Object.entries(lessonFiles)
  .map(([path, text]) => {
    const { attributes, body } = parseFrontmatter(text)
    return {
      slug: slugOf(path),
      title: attributes.title ?? slugOf(path),
      module: attributes.module ?? "",
      scenario: attributes.scenario ?? "baseline",
      body,
    }
  })
  .sort((a, b) => a.slug.localeCompare(b.slug))

export const lessonNamed = (slug: string): Lesson | undefined =>
  lessons.find((lesson) => lesson.slug === slug)
