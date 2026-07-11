import { supabase } from './supabase'

/** Supabase Storage bucket for default article covers (no uploaded image). */
export const PRANDOM_BUCKET = 'prandom'

/** Local emergency fallbacks if the bucket is empty / unreachable. */
export const LOCAL_FALLBACK_COVER_IMAGES = [
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

/** @deprecated use LOCAL_FALLBACK_COVER_IMAGES — kept for older imports */
export const FALLBACK_COVER_IMAGES = LOCAL_FALLBACK_COVER_IMAGES

const ADJACENT_AVOID_WINDOW = 3

function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getPrandomPublicUrl(path: string) {
  const { data } = supabase.storage.from(PRANDOM_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function extractPrandomObjectPath(urlOrPath: string) {
  const trimmed = urlOrPath.trim()
  if (!trimmed.includes('://')) return trimmed.replace(/^\//, '')

  const marker = `/object/public/${PRANDOM_BUCKET}/`
  const idx = trimmed.indexOf(marker)
  if (idx >= 0) return decodeURIComponent(trimmed.slice(idx + marker.length).split('?')[0])

  return trimmed
}

export function isPoolCover(url: string, pool: string[] = []) {
  if (pool.includes(url)) return true
  return url.includes(`/object/public/${PRANDOM_BUCKET}/`)
}

/** List public URLs from the prandom bucket (falls back to local /rprofile if empty). */
export async function fetchPrandomCoverPool(): Promise<string[]> {
  const { data, error } = await supabase.storage.from(PRANDOM_BUCKET).list('', {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error) {
    console.warn('prandom pool unavailable, using local fallbacks', error.message)
    return [...LOCAL_FALLBACK_COVER_IMAGES]
  }

  const files = (data ?? []).filter(
    (file) =>
      Boolean(file.name) &&
      !file.name.startsWith('.') &&
      /\.(png|jpe?g|webp|gif)$/i.test(file.name)
  )

  if (files.length === 0) return [...LOCAL_FALLBACK_COVER_IMAGES]

  return files.map((file) => getPrandomPublicUrl(file.name))
}

export async function uploadPrandomCover(file: File) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `r-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error } = await supabase.storage.from(PRANDOM_BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: false,
  })

  if (error) throw error
  return getPrandomPublicUrl(path)
}

export async function deletePrandomCover(publicUrlOrPath: string) {
  await deletePrandomCovers([publicUrlOrPath])
}

export async function deletePrandomCovers(publicUrlsOrPaths: string[]) {
  const paths = publicUrlsOrPaths.map(extractPrandomObjectPath).filter(Boolean)
  if (paths.length === 0) return

  const { error } = await supabase.storage.from(PRANDOM_BUCKET).remove(paths)
  if (error) throw error
}

export function getFallbackCoverImage(
  seed?: string | null,
  avoidUrls: Array<string | null | undefined> = [],
  pool: string[] = [...LOCAL_FALLBACK_COVER_IMAGES]
) {
  const images = pool.length > 0 ? pool : [...LOCAL_FALLBACK_COVER_IMAGES]
  const blocked = new Set(
    avoidUrls.filter((url): url is string => Boolean(url && isPoolCover(url, images)))
  )

  let index = seed?.trim()
    ? hashSeed(seed.trim()) % images.length
    : Math.floor(Math.random() * images.length)

  for (let attempt = 0; attempt < images.length; attempt += 1) {
    const candidate = images[(index + attempt) % images.length]
    if (!blocked.has(candidate)) return candidate
  }

  return images[index]
}

export function resolvePostCoverImage(
  imageUrl?: string | null,
  seed?: string | null,
  avoidUrls: Array<string | null | undefined> = [],
  pool: string[] = [...LOCAL_FALLBACK_COVER_IMAGES]
) {
  const trimmed = imageUrl?.trim()
  if (trimmed) return trimmed
  return getFallbackCoverImage(seed, avoidUrls, pool)
}

type CoverPost = {
  id: string
  image_url?: string | null
}

export function assignAdjacentCoverImages(
  posts: CoverPost[],
  pool: string[] = [...LOCAL_FALLBACK_COVER_IMAGES]
): Record<string, string> {
  const covers: Record<string, string> = {}
  const recentPool: string[] = []
  const images = pool.length > 0 ? pool : [...LOCAL_FALLBACK_COVER_IMAGES]

  for (const post of posts) {
    const custom = post.image_url?.trim()
    if (custom) {
      covers[post.id] = custom
      if (isPoolCover(custom, images)) {
        recentPool.push(custom)
        if (recentPool.length > ADJACENT_AVOID_WINDOW) recentPool.shift()
      }
      continue
    }

    const fallback = getFallbackCoverImage(post.id, recentPool, images)
    covers[post.id] = fallback
    recentPool.push(fallback)
    if (recentPool.length > ADJACENT_AVOID_WINDOW) recentPool.shift()
  }

  return covers
}
