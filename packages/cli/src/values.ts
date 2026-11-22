export const parseValue = (raw: string): unknown => {
  const trimmed = raw.trim()
  if (trimmed === "true" || trimmed === "false") return trimmed === "true"
  if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed)
  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }
  return trimmed
}

export const parseValueList = (raw: string): readonly unknown[] =>
  raw
    .split(",")
    .filter((part) => part.trim() !== "")
    .map(parseValue)
