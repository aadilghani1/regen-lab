import { Context, Effect, FileSystem, Layer, Path } from "effect"
import { HttpClient } from "effect/http"
import { z } from "zod"
import { LiteratureUnavailable } from "./errors.ts"

export interface Paper {
  readonly id: string
  readonly source: string
  readonly title: string
  readonly authors: string
  readonly journal: string | null
  readonly year: number | null
  readonly doi: string | null
  readonly pmid: string | null
  readonly citedBy: number
  readonly openAccess: boolean
}

const europePmcResponse = z.object({
  resultList: z.object({
    result: z.array(
      z.object({
        id: z.string(),
        source: z.string(),
        title: z.string().default(""),
        authorString: z.string().default(""),
        journalTitle: z.string().optional(),
        pubYear: z.string().optional(),
        doi: z.string().optional(),
        pmid: z.string().optional(),
        citedByCount: z.number().default(0),
        isOpenAccess: z.string().default("N"),
      }),
    ),
  }),
})

export const EUROPE_PMC_SEARCH = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

export const europePmcSearchUrl = (query: string, limit: number): string =>
  `${EUROPE_PMC_SEARCH}?${new URLSearchParams({
    query,
    format: "json",
    resultType: "lite",
    pageSize: String(Math.min(Math.max(limit, 1), 1000)),
  })}`

export const papersFromEuropePmc = (body: unknown): readonly Paper[] | null => {
  const parsed = europePmcResponse.safeParse(body)
  if (!parsed.success) return null
  return parsed.data.resultList.result.map((raw) => ({
    id: raw.id,
    source: raw.source,
    title: raw.title,
    authors: raw.authorString,
    journal: raw.journalTitle ?? null,
    year: raw.pubYear === undefined ? null : Number(raw.pubYear),
    doi: raw.doi ?? null,
    pmid: raw.pmid ?? null,
    citedBy: raw.citedByCount,
    openAccess: raw.isOpenAccess === "Y",
  }))
}

export const paperTable = (papers: readonly Paper[]): string =>
  [
    "| Year | Title | Journal | DOI | Cited by |",
    "|---|---|---|---|---|",
    ...papers.map(
      (paper) =>
        `| ${paper.year ?? ""} | ${paper.title.replaceAll("|", "/").slice(0, 110)} | ${paper.journal ?? ""} | ${paper.doi ?? ""} | ${paper.citedBy} |`,
    ),
  ].join("\n")

export const searchLogLines = (query: string, retrievedAt: string, papers: readonly Paper[]) =>
  papers.map((paper) => `${JSON.stringify({ query, retrievedAt, ...paper })}\n`).join("")

export class Literature extends Context.Service<
  Literature,
  {
    readonly search: (
      query: string,
      limit: number,
    ) => Effect.Effect<readonly Paper[], LiteratureUnavailable>
  }
>()("regen-lab/Literature") {}

export const europePmcLiterature = Layer.effect(
  Literature,
  Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk)
    return {
      search: (query, limit) =>
        client.get(europePmcSearchUrl(query, limit)).pipe(
          Effect.flatMap((response) => response.json),
          Effect.mapError((error) => new LiteratureUnavailable({ query, reason: String(error) })),
          Effect.flatMap((body) => {
            const papers = papersFromEuropePmc(body)
            return papers === null
              ? Effect.fail(
                  new LiteratureUnavailable({ query, reason: "unexpected Europe PMC response" }),
                )
              : Effect.succeed(papers)
          }),
        ),
    }
  }),
)

export const appendSearchLog = (
  logPath: string,
  query: string,
  papers: readonly Paper[],
  retrievedAt: string,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    yield* fs.makeDirectory(path.dirname(logPath), { recursive: true })
    yield* fs.writeFileString(logPath, searchLogLines(query, retrievedAt, papers), { flag: "a" })
    return logPath
  })
