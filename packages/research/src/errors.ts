import { Data } from "effect"

export class LiteratureUnavailable extends Data.TaggedError("LiteratureUnavailable")<{
  readonly query: string
  readonly reason: string
}> {}

export class FileUnreadable extends Data.TaggedError("FileUnreadable")<{
  readonly path: string
  readonly issues: readonly string[]
}> {}

export class RunStoreFailure extends Data.TaggedError("RunStoreFailure")<{
  readonly operation: string
  readonly reason: string
}> {}

const RESEARCH_ERROR_TAGS: ReadonlySet<string> = new Set([
  "LiteratureUnavailable",
  "FileUnreadable",
  "RunStoreFailure",
])

export const isResearchError = (error: unknown): error is ResearchError =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  RESEARCH_ERROR_TAGS.has(String(error._tag))

export type ResearchError = LiteratureUnavailable | FileUnreadable | RunStoreFailure

export const describeResearchError = (error: ResearchError): string => {
  switch (error._tag) {
    case "LiteratureUnavailable":
      return `literature search for "${error.query}" failed: ${error.reason}`
    case "FileUnreadable":
      return `cannot read ${error.path}:\n${error.issues.map((issue) => `  ${issue}`).join("\n")}`
    case "RunStoreFailure":
      return `run store could not ${error.operation}: ${error.reason}`
  }
}
