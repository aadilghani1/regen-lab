import type { ModelParameters } from "@regen-lab/core"
import { z } from "zod"

export const explorationSearch = z.object({
  seed: z.number().int().min(0).max(1_000_000).optional(),
  level: z.number().min(0.1).max(0.9).optional(),
  denervate: z.boolean().optional(),
  proximal: z.number().min(0).max(0.5).optional(),
  termination: z.boolean().optional(),
  speed: z.number().int().min(1).max(50).optional(),
})

export type ExplorationSearch = z.infer<typeof explorationSearch>

export const explorationParameters = (
  base: ModelParameters,
  search: ExplorationSearch,
): ModelParameters => ({
  ...base,
  amputation: { level: search.level ?? base.amputation.level },
  treatment: {
    ...base.treatment,
    denervate: search.denervate ?? base.treatment.denervate,
    exogenousProximal: search.proximal ?? base.treatment.exogenousProximal,
  },
  cells: { ...base.cells, termination: search.termination ?? base.cells.termination },
  run: { ...base.run, seed: search.seed ?? base.run.seed },
})

export const DEFAULT_SPEED = 4
