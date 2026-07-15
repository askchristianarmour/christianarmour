import { SEO_TOPIC_PHRASES } from './keywords'

const CORE_SEARCHES = [
  'Genesis',
  'Romans',
  'Trinity',
  'Christology',
  'Grace',
  'Resurrection',
  'Faith',
  'Church',
  'Covenant',
  'Exodus',
  'Revelation',
  'Holy Spirit',
] as const

/** Popular / SEO topic chips for search UI and article keyword suggestions. */
export const POPULAR_ARTICLE_SEARCHES = [
  ...CORE_SEARCHES,
  ...SEO_TOPIC_PHRASES,
] as const

export function buildArticlesSearchPath(keyword: string) {
  const term = keyword.trim()
  if (!term) return '/articles'
  return `/articles?search=${encodeURIComponent(term)}`
}

export function getRelatedSearchKeywords(activeSearch: string, limit = 10): string[] {
  const term = activeSearch.trim().toLowerCase()
  if (!term) return [...POPULAR_ARTICLE_SEARCHES].slice(0, limit)

  const scored = POPULAR_ARTICLE_SEARCHES.map((keyword) => {
    const lower = keyword.toLowerCase()
    let score = 0

    if (lower === term) return { keyword, score: -1 }
    if (lower.startsWith(term) || term.startsWith(lower)) score += 3
    if (lower.includes(term) || term.includes(lower)) score += 2
    if (lower.split(' ').some((word) => word.startsWith(term) || term.startsWith(word))) score += 1

    return { keyword, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const related = scored.map((item) => item.keyword)

  if (related.length < limit) {
    for (const keyword of POPULAR_ARTICLE_SEARCHES) {
      if (related.length >= limit) break
      if (keyword.toLowerCase() !== term && !related.includes(keyword)) {
        related.push(keyword)
      }
    }
  }

  return related.slice(0, limit)
}
