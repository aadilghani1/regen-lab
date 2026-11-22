import { describe, expect, test } from "bun:test"
import { BunServices } from "@effect/platform-bun"
import { simulate, summarize } from "@regen-lab/core"
import { Effect, Layer } from "effect"
import { FetchHttpClient } from "effect/http"
import {
  Clock,
  checkEvidence,
  europePmcLiterature,
  europePmcSearchUrl,
  Literature,
  loadCatalog,
  loadEvidence,
  loadScenario,
  ProvenanceSource,
  papersFromEuropePmc,
  paperTable,
  parameterPathsOf,
  RunStore,
  runIdOf,
  seedsFrom,
  sweep,
  type TrackedRun,
  trackRun,
  unverifiedCitations,
} from "../src/index.ts"

const REGISTRY = new URL("../../../evidence/assumptions.toml", import.meta.url).pathname

const europePmcBody = {
  resultList: {
    result: [
      {
        id: "123",
        source: "MED",
        title: "Cells keep a memory | of origin",
        authorString: "Kragl M",
        journalTitle: "Nature",
        pubYear: "2009",
        doi: "10.0000/example",
        citedByCount: 900,
        isOpenAccess: "N",
      },
    ],
  },
}

const runBun = <A, E>(effect: Effect.Effect<A, E, BunServices.BunServices>) =>
  Effect.runPromise(effect.pipe(Effect.provide(BunServices.layer)))

describe("literature", () => {
  test("builds a Europe PMC query", () => {
    const url = new URL(europePmcSearchUrl("axolotl blastema", 5000))
    expect(url.searchParams.get("query")).toBe("axolotl blastema")
    expect(url.searchParams.get("pageSize")).toBe("1000")
  })

  test("parses Europe PMC results into papers", () => {
    const [paper] = papersFromEuropePmc(europePmcBody) ?? []
    expect(paper).toMatchObject({ year: 2009, doi: "10.0000/example", openAccess: false })
    expect(papersFromEuropePmc({ unexpected: true })).toBeNull()
  })

  test("renders a markdown table without breaking on pipes", () => {
    const table = paperTable(papersFromEuropePmc(europePmcBody) ?? [])
    expect(table.split("\n")).toHaveLength(3)
    expect(table).toContain("memory / of origin")
  })

  test("the Europe PMC service decodes a response over HTTP", async () => {
    const fakeFetch = (async () => Response.json(europePmcBody)) as unknown as typeof fetch
    const papers = await Effect.runPromise(
      Effect.gen(function* () {
        const literature = yield* Literature
        return yield* literature.search("x", 1)
      }).pipe(
        Effect.provide(europePmcLiterature),
        Effect.provide(FetchHttpClient.layer),
        Effect.provideService(FetchHttpClient.Fetch, fakeFetch),
      ),
    )
    expect(papers.map((paper) => paper.id)).toEqual(["123"])
  })
})

describe("evidence registry", () => {
  test("the repository registry is consistent with the scenario catalog", async () => {
    const [assumptions, catalog] = await runBun(Effect.all([loadEvidence(REGISTRY), loadCatalog]))
    expect(checkEvidence(assumptions, catalog)).toEqual([])
    expect(unverifiedCitations(assumptions).length).toBeGreaterThan(0)
  })

  test("flags missing citations, unknown parameters, and unregistered benchmark assumptions", async () => {
    const catalog = await runBun(loadCatalog)
    const issues = checkEvidence(
      [
        {
          id: "A9-broken",
          module: "pattern",
          statement: "s",
          status: "supported",
          params: ["model.cells.nope"],
          citations: [{ ref: "r", verified: true }],
        },
        {
          id: "A10-uncited",
          module: "trigger",
          statement: "s",
          status: "supported",
          params: [],
          citations: [],
        },
      ],
      catalog,
    )
    const problems = issues.map((issue) => issue.problem).join("\n")
    expect(problems).toContain("needs at least one citation")
    expect(problems).toContain("DOI or PMID")
    expect(problems).toContain("unknown parameter model.cells.nope")
    expect(problems).toContain("not registered")
  })

  test("lists parameter paths", () => {
    expect(parameterPathsOf({ model: { cells: { a: 1, b: { c: 2 } } } })).toEqual([
      "model.cells.a",
      "model.cells.b.c",
    ])
  })
})

describe("tracked runs", () => {
  test("ids sort by time and name the scenario and seed", () => {
    expect(runIdOf(new Date("2026-11-22T10:11:12.345Z"), "baseline", 3)).toBe(
      "20261122T101112Z-baseline-s3",
    )
  })

  test("trackRun records provenance through swappable services", async () => {
    const scenario = await runBun(loadScenario("denervated"))
    const trajectory = simulate(scenario.model)
    const saved: TrackedRun[] = []
    const services = Layer.mergeAll(
      Layer.succeed(ProvenanceSource, {
        current: Effect.succeed({ gitCommit: "abc", codeVersion: "test", runtime: "test" }),
      }),
      Layer.succeed(Clock, { now: Effect.succeed(new Date("2026-01-01T00:00:00Z")) }),
      Layer.succeed(RunStore, {
        save: (run) => Effect.sync(() => saved.push(run)).pipe(Effect.as(`memory/${run.id}`)),
        list: Effect.succeed([]),
        load: () => Effect.die("unused"),
      }),
    )
    const { location } = await Effect.runPromise(
      trackRun(scenario, summarize(scenario.model, trajectory), trajectory.observations).pipe(
        Effect.provide(services),
      ),
    )
    expect(location).toBe("memory/20260101T000000Z-denervated-s0")
    expect(saved[0]?.provenance.gitCommit).toBe("abc")
    expect(saved[0]?.summary.outcome).toBe("no-regeneration")
  })
})

describe("sweeps", () => {
  test("sweeping proximal excess moves the outcome from faithful to duplication", async () => {
    const scenario = await runBun(loadScenario("baseline"))
    const result = sweep(scenario, "model.treatment.exogenousProximal", [0, 0.2], seedsFrom(0, 2))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.points.map((point) => point.summary.outcome)).toEqual([
      "faithful-regeneration",
      "faithful-regeneration",
      "duplication",
      "duplication",
    ])
  })

  test("rejects invalid sweep values before running anything", async () => {
    const scenario = await runBun(loadScenario("baseline"))
    expect(sweep(scenario, "model.amputation.level", [0.5, 3], [0]).ok).toBe(false)
  })
})
