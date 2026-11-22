export interface Document {
  readonly attributes: Readonly<Record<string, string>>
  readonly body: string
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/

const attributeOf = (line: string): readonly [string, string] | null => {
  const separator = line.indexOf(":")
  if (separator <= 0) return null
  const value = line
    .slice(separator + 1)
    .trim()
    .replace(/^"(.*)"$/, "$1")
  return [line.slice(0, separator).trim(), value]
}

export const parseFrontmatter = (text: string): Document => {
  const match = FRONTMATTER.exec(text)
  if (match === null) return { attributes: {}, body: text }
  const entries = (match[1] ?? "")
    .split("\n")
    .map(attributeOf)
    .filter((entry): entry is readonly [string, string] => entry !== null)
  return { attributes: Object.fromEntries(entries), body: text.slice(match[0].length) }
}
