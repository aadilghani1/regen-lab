import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import ts from "typescript"

const ROOT = join(import.meta.dir, "..")
const SOURCE_EXTENSIONS = [".ts", ".tsx"]
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", ".git"])
const STRICT_PREFIXES = ["packages/core/"]
const DIRECTIVE =
  /^\/\/\s*(@ts-expect-error|biome-ignore)\b.*https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/

interface Violation {
  readonly file: string
  readonly line: number
  readonly text: string
}

const sourceFilesUnder = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry) ? [] : sourceFilesUnder(path)
    }
    return SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension)) ? [path] : []
  })

const COMMENT_KINDS = new Set([
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.ShebangTrivia,
])

const commentsIn = (text: string, isTsx: boolean) => {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    isTsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    text,
  )
  const comments: { start: number; text: string; kind: ts.SyntaxKind }[] = []
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (COMMENT_KINDS.has(token)) {
      comments.push({ start: scanner.getTokenStart(), text: scanner.getTokenText(), kind: token })
    }
  }
  return comments
}

const isAllowed = (file: string, comment: { text: string; kind: ts.SyntaxKind }): boolean => {
  if (STRICT_PREFIXES.some((prefix) => file.startsWith(prefix))) return false
  return comment.kind === ts.SyntaxKind.ShebangTrivia || DIRECTIVE.test(comment.text)
}

const violationsIn = (path: string): Violation[] => {
  const file = relative(ROOT, path)
  const text = readFileSync(path, "utf8")
  return commentsIn(text, path.endsWith(".tsx"))
    .filter((comment) => !isAllowed(file, comment))
    .map((comment) => ({
      file,
      line: text.slice(0, comment.start).split("\n").length,
      text: comment.text.split("\n")[0] ?? "",
    }))
}

const violations = sourceFilesUnder(ROOT).flatMap(violationsIn)

for (const violation of violations) {
  console.error(`${violation.file}:${violation.line}  ${violation.text}`)
}
console.log(
  violations.length === 0
    ? "no comments found"
    : `${violations.length} comment(s) found: express the intent through names, or move the why into docs/`,
)
process.exit(violations.length === 0 ? 0 : 1)
