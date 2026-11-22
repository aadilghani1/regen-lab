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
