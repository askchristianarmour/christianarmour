/** Default cover pool when an article has no uploaded image. */
export const FALLBACK_COVER_IMAGES = [
  '/rprofile/r1.png',
  '/rprofile/r2.png',
  '/rprofile/r3.png',
  '/rprofile/r4.png',
  '/rprofile/r5.png',
  '/rprofile/r6.png',
  '/rprofile/r7.png',
  '/rprofile/r8.png',
  '/rprofile/r9.png',
  '/rprofile/r10.png',
] as const

/** How many recent pool images to avoid (covers neighbors in up to 3-column grids). */
const ADJACENT_AVOID_WINDOW = 3

function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

function isPoolCover(url: string) {
  return FALLBACK_COVER_IMAGES.includes(url as (typeof FALLBACK_COVER_IMAGES)[number])
}

/** Stable pick from the fallback pool (same seed → same image), optionally avoiding recent URLs. */
export function getFallbackCoverImage(
  seed?: string | null,
  avoidUrls: Array<string | null | undefined> = []
) {
  const pool = FALLBACK_COVER_IMAGES
  const blocked = new Set(
    avoidUrls.filter((url): url is string => Boolean(url && isPoolCover(url)))
  )

  let index = seed?.trim()
    ? hashSeed(seed.trim()) % pool.length
    : Math.floor(Math.random() * pool.length)

  for (let attempt = 0; attempt < pool.length; attempt += 1) {
    const candidate = pool[(index + attempt) % pool.length]
    if (!blocked.has(candidate)) return candidate
  }

  return pool[index]
}

/** Prefer the uploaded cover; otherwise a seeded fallback from /rprofile. */
export function resolvePostCoverImage(
  imageUrl?: string | null,
  seed?: string | null,
  avoidUrls: Array<string | null | undefined> = []
) {
  const trimmed = imageUrl?.trim()
  if (trimmed) return trimmed
  return getFallbackCoverImage(seed, avoidUrls)
}

type CoverPost = {
  id: string
  image_url?: string | null
}

/**
 * Assign cover URLs for a list so neighboring articles (within a small window)
 * never share the same fallback pool image.
 */
export function assignAdjacentCoverImages(posts: CoverPost[]): Record<string, string> {
  const covers: Record<string, string> = {}
  const recentPool: string[] = []

  for (const post of posts) {
    const custom = post.image_url?.trim()
    if (custom) {
      covers[post.id] = custom
      if (isPoolCover(custom)) {
        recentPool.push(custom)
        if (recentPool.length > ADJACENT_AVOID_WINDOW) recentPool.shift()
      } else {
        // Custom upload breaks the pool streak visually enough; keep window for next fallbacks.
      }
      continue
    }

    const fallback = getFallbackCoverImage(post.id, recentPool)
    covers[post.id] = fallback
    recentPool.push(fallback)
    if (recentPool.length > ADJACENT_AVOID_WINDOW) recentPool.shift()
  }

  return covers
}
