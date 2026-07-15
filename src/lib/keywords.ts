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

/**
 * Brand-name spellings / spacing people may search. Helps site search and
 * meta keywords; Google mostly matches these automatically once the brand
 * is indexed strongly under the real name.
 */
export const BRAND_NAME_VARIATIONS = [
  'Christian Armour',
  'Christian Armor',
  'christian armour',
  'christian armor',
  'christianarmour',
  'christianarmor',
  'chris tian armour',
  'chris tian armor',
  'christ ian armour',
  'christain armour',
  'christan armour',
  'christian arm our',
  'christianarmour.com',
  'www.christianarmour.com',
  'Christian Armour Bible',
  'Christian Armour theology',
  'Christian Armour articles',
] as const

/**
 * Priority theological topics / phrases for SEO, site search chips,
 * and article keyword suggestions. Pair these with real articles that
 * discuss the topic — Google ranks content, not keyword lists alone.
 */
export const SEO_TOPIC_PHRASES = [
  'Calvinism',
  'Gnosticism',
  'Manichaeism',
  'Original sin',
  'Total depravity',
  'Sin nature',
  'Fallen nature',
  'Corruption',
  'Depravity',
  'Ancestral sin',
  'Athanasius',
  'Irenaeus',
  'Ante-Nicene writers',
  'Ante-Nicene fathers',
  'Salvation',
  'Saved',
  'Saving',
  'Hardened',
  'Nestorius',
  'Pelagius',
  'Julian of Eclanum',
  'Cyril of Alexandria',
  'Nestorianism',
  'Pelagianism',
  'Augustine',
  'Church councils',
  'Nicaea',
  "Adam's guilt",
  'Culpa',
  'Reatus',
  'Predestination',
  'Election',
  'Atonement',
  'Free will',
  'Baptism',
  "Lord's Table",
  'Justification',
  'Holiness',
  'Prayer',
] as const

export function formatSeoKeywordsMeta(extra: string[] = []): string {
  const base = [
    ...BRAND_NAME_VARIATIONS,
    'Bible study',
    'exegesis',
    'theology',
    'church history',
    'apologetics',
    'Scripture',
    ...SEO_TOPIC_PHRASES,
    ...extra,
  ]
  return normalizeKeywords(base).join(', ')
}
