import type { Scenario } from "@regen-lab/scenarios"
import { Effect, FileSystem } from "effect"
import { parse as parseToml } from "smol-toml"
import { z } from "zod"
import { FileUnreadable } from "./errors.ts"

const citation = z.strictObject({
  ref: z.string().min(1),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  note: z.string().optional(),
  verified: z.boolean().default(false),
})

const assumption = z.strictObject({
  id: z.string().regex(/^A\d+-[a-z0-9-]+$/),
  statement: z.string().min(1),
  status: z.enum(["supported", "hypothesis"]),
  module: z.enum(["trigger", "progenitor-pool", "pattern", "termination"]),
  params: z.array(z.string()).default([]),
  citations: z.array(citation).default([]),
  notes: z.string().optional(),
})

const registry = z.strictObject({ assumption: z.array(assumption).default([]) })

export type Assumption = z.output<typeof assumption>
export type Citation = z.output<typeof citation>

export interface EvidenceIssue {
  readonly assumption: string
  readonly problem: string
}

export const parseEvidence = (
  text: string,
): { ok: true; assumptions: readonly Assumption[] } | { ok: false; issues: readonly string[] } => {
  try {
    const result = registry.safeParse(parseToml(text))
    return result.success
      ? { ok: true, assumptions: result.data.assumption }
      : {
          ok: false,
          issues: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        }
  } catch (error) {
    return { ok: false, issues: [`invalid TOML: ${(error as Error).message}`] }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const parameterPathsOf = (value: unknown, prefix = ""): readonly string[] =>
  isRecord(value)
    ? Object.entries(value).flatMap(([key, child]) =>
        parameterPathsOf(child, prefix === "" ? key : `${prefix}.${key}`),
      )
    : [prefix]

export const scenarioParameterPaths = (scenario: Scenario): ReadonlySet<string> =>
  new Set(parameterPathsOf({ model: scenario.model, population: scenario.population }))

const duplicateIds = (assumptions: readonly Assumption[]): EvidenceIssue[] =>
  assumptions
    .filter((a, i) => assumptions.findIndex((other) => other.id === a.id) !== i)
    .map((a) => ({ assumption: a.id, problem: "duplicate id" }))

const assumptionIssues = (a: Assumption, parameters: ReadonlySet<string>): EvidenceIssue[] => [
  ...(a.status === "supported" && a.citations.length === 0
    ? [{ assumption: a.id, problem: "a supported assumption needs at least one citation" }]
    : []),
  ...a.citations
    .filter((c) => c.verified && c.doi === undefined && c.pmid === undefined)
    .map((c) => ({ assumption: a.id, problem: `verified citation needs a DOI or PMID: ${c.ref}` })),
  ...a.params
    .filter((p) => !parameters.has(p))
    .map((p) => ({ assumption: a.id, problem: `unknown parameter ${p}` })),
]

const benchmarkIssues = (
  assumptions: readonly Assumption[],
  scenarios: readonly Scenario[],
): EvidenceIssue[] => {
  const known = new Set(assumptions.map((a) => a.id))
  return scenarios.flatMap((scenario) =>
    (scenario.benchmark?.assumptions ?? [])
      .filter((id) => !known.has(id))
      .map((id) => ({
        assumption: id,
        problem: `cited by benchmark ${scenario.name} but not registered`,
      })),
  )
}

export const checkEvidence = (
  assumptions: readonly Assumption[],
  scenarios: readonly Scenario[],
): readonly EvidenceIssue[] => {
  const parameters =
    scenarios[0] === undefined ? new Set<string>() : scenarioParameterPaths(scenarios[0])
  return [
    ...duplicateIds(assumptions),
    ...assumptions.flatMap((a) => assumptionIssues(a, parameters)),
    ...benchmarkIssues(assumptions, scenarios),
  ]
}

export const unverifiedCitations = (assumptions: readonly Assumption[]) =>
  assumptions.flatMap((a) =>
    a.citations.filter((c) => !c.verified).map((c) => ({ assumption: a.id, ref: c.ref })),
  )

export const loadEvidence = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const text = yield* fs
      .readFileString(path)
      .pipe(Effect.mapError((error) => new FileUnreadable({ path, issues: [String(error)] })))
    const parsed = parseEvidence(text)
    return parsed.ok
      ? parsed.assumptions
      : yield* Effect.fail(new FileUnreadable({ path, issues: parsed.issues }))
  })
