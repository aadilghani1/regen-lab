import { describe, expect, test } from "bun:test"
import { mkdtempSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { BunServices } from "@effect/platform-bun"
import { Clock, Literature, ProvenanceSource } from "@regen-lab/research"
import { Effect, Layer } from "effect"
import { Command } from "effect/cli"
import { parseValue, parseValueList, regen, table } from "../src/index.ts"

const REGISTRY = new URL("../../../evidence/assumptions.toml", import.meta.url).pathname

const services = Layer.mergeAll(
  BunServices.layer,
  Layer.succeed(Literature, { search: () => Effect.succeed([]) }),
  Layer.succeed(ProvenanceSource, {
    current: Effect.succeed({ gitCommit: "test", codeVersion: "test", runtime: "test" }),
  }),
  Layer.succeed(Clock, { now: Effect.sync(() => new Date()) }),
)

const regenWith = (args: readonly string[]) =>
  Effect.runPromise(
    Command.runWith(regen, { version: "test" })(args).pipe(Effect.provide(services)),
  )

describe("values", () => {
  test.each([
    ["0.25", 0.25],
    ["12", 12],
    ["true", true],
    ["false", false],
    ["[0, 40]", [0, 40]],
    ["baseline", "baseline"],
  ] as const)("%s parses to %p", (raw, expected) => {
    expect(parseValue(raw)).toEqual(expected)
  })

  test("splits comma-separated lists", () => {
    expect(parseValueList("0, 0.1,0.2,")).toEqual([0, 0.1, 0.2])
  })
})

describe("table", () => {
  test("aligns columns", () => {
    expect(table(["a", "bb"], [["ccc", "d"]]).split("\n")).toEqual(["a    bb", "---  --", "ccc  d"])
  })
})

describe("regen", () => {
  test("run records a tracked run with provenance", async () => {
    const out = mkdtempSync(join(tmpdir(), "regen-runs-"))
    await regenWith(["run", "denervated", "--out", out, "--set", "model.run.steps=40"])
    const [runId] = readdirSync(out)
    expect(runId).toMatch(/-denervated-s0$/)
    const record = JSON.parse(readFileSync(join(out, runId ?? "", "run.json"), "utf8"))
    expect(record.summary.outcome).toBe("no-regeneration")
    expect(record.provenance.gitCommit).toBe("test")
    expect(record.scenario.model.run.steps).toBe(40)
  })

  test("evidence check passes on the repository registry", async () => {
    await regenWith(["evidence", "check", "--registry", REGISTRY])
  })

  test("rejects an unknown override", async () => {
    const out = mkdtempSync(join(tmpdir(), "regen-runs-"))
    expect(
      regenWith(["run", "baseline", "--out", out, "--set", "model.cells.nope=1"]),
    ).rejects.toBeDefined()
  })
})
