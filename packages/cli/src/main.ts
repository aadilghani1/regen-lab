#!/usr/bin/env bun
import { BunRuntime, BunServices } from "@effect/platform-bun"
import {
  describeResearchError,
  europePmcLiterature,
  gitProvenance,
  isResearchError,
  systemClock,
} from "@regen-lab/research"
import { Console, Effect, Layer } from "effect"
import { Command } from "effect/cli"
import { FetchHttpClient } from "effect/http"
import packageJson from "../package.json" with { type: "json" }
import { regen } from "./commands.ts"

const services = Layer.mergeAll(
  BunServices.layer,
  europePmcLiterature.pipe(Layer.provide(FetchHttpClient.layer)),
  gitProvenance(packageJson.version),
  systemClock,
)

const reportResearchErrors = <A, E, R>(program: Effect.Effect<A, E, R>) =>
  program.pipe(
    Effect.catch((error: E) =>
      isResearchError(error)
        ? Console.error(describeResearchError(error)).pipe(
            Effect.andThen(Effect.sync(() => process.exit(1))),
          )
        : Effect.fail(error),
    ),
  )

Command.run(regen, { version: packageJson.version }).pipe(
  reportResearchErrors,
  Effect.provide(services),
  BunRuntime.runMain,
)
