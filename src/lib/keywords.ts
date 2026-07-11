/** Normalize author-entered search keywords for storage and matching. */
export function normalizeKeywords(raw: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const item of raw) {
    const keyword = item.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!keyword || seen.has(keyword)) continue
    seen.add(keyword)
    out.push(keyword)
  }

  return out
}

export function parseKeywordInput(value: string): string[] {
  return normalizeKeywords(
    value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  )
}

/** PostgREST `cs` (contains) filter fragment for a single keyword. */
export function keywordsContainsFilter(term: string): string | null {
  const keyword = term.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!keyword) return null

  const escaped = keyword.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const needsQuotes = /[\s,{}()]/.test(escaped)
  const literal = needsQuotes ? `"${escaped}"` : escaped
  return `keywords.cs.{${literal}}`
}
