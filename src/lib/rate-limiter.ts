export type RateLimitAction = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword'

type RateLimitConfig = {
  minIntervalMs: number
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
  serverCooldownMs: number
}

type RateLimitEntry = {
  attempts: number[]
  blockedUntil: number | null
  lastAttempt: number | null
}

const STORAGE_KEY = 'christianarmour_rate_limits'

const CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  signIn: {
    minIntervalMs: 2_000,
    maxAttempts: 12,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 60 * 1000,
    serverCooldownMs: 5 * 60 * 1000,
  },
  signUp: {
    minIntervalMs: 60 * 1000,
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
    serverCooldownMs: 10 * 60 * 1000,
  },
  forgotPassword: {
    minIntervalMs: 60 * 1000,
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
    serverCooldownMs: 10 * 60 * 1000,
  },
  resetPassword: {
    minIntervalMs: 2_000,
    maxAttempts: 8,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 60 * 1000,
    serverCooldownMs: 5 * 60 * 1000,
  },
}

export type RateLimitCheck = {
  allowed: boolean
  retryAfterMs: number
  message: string | null
}

function storageKey(action: RateLimitAction, key: string) {
  return `${action}:${key.toLowerCase().trim()}`
}

function readStore(): Record<string, RateLimitEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, RateLimitEntry>) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, RateLimitEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function pruneAttempts(attempts: number[], windowMs: number, now: number) {
  return attempts.filter((ts) => now - ts < windowMs)
}

function formatWait(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`
  const minutes = Math.ceil(totalSeconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

export function formatRateLimitMessage(action: RateLimitAction, retryAfterMs: number) {
  const wait = formatWait(retryAfterMs)
  switch (action) {
    case 'signUp':
    case 'forgotPassword':
      return `Email rate limit reached. Please wait ${wait} before trying again.`
    case 'signIn':
      return `Too many sign-in attempts. Please wait ${wait} before trying again.`
    case 'resetPassword':
      return `Too many password update attempts. Please wait ${wait} before trying again.`
  }
}

export function isApiRateLimitError(
  error: { status?: number; code?: string; message?: string } | string | null | undefined,
): boolean {
  if (!error) return false
  if (typeof error === 'string') {
    const lower = error.toLowerCase()
    return (
      lower.includes('rate limit') ||
      lower.includes('too many requests') ||
      lower.includes('email rate')
    )
  }
  return (
    error.status === 429 ||
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit' ||
    (error.message?.toLowerCase().includes('rate limit') ?? false)
  )
}

export function peekRateLimit(action: RateLimitAction, key: string): RateLimitCheck {
  if (!key.trim()) {
    return { allowed: true, retryAfterMs: 0, message: null }
  }

  const config = CONFIGS[action]
  const now = Date.now()
  const store = readStore()
  const entry = store[storageKey(action, key)] ?? {
    attempts: [],
    blockedUntil: null,
    lastAttempt: null,
  }

  const attempts = pruneAttempts(entry.attempts, config.windowMs, now)

  if (entry.blockedUntil && entry.blockedUntil > now) {
    const retryAfterMs = entry.blockedUntil - now
    return {
      allowed: false,
      retryAfterMs,
      message: formatRateLimitMessage(action, retryAfterMs),
    }
  }

  if (entry.lastAttempt && now - entry.lastAttempt < config.minIntervalMs) {
    const retryAfterMs = config.minIntervalMs - (now - entry.lastAttempt)
    return {
      allowed: false,
      retryAfterMs,
      message: formatRateLimitMessage(action, retryAfterMs),
    }
  }

  if (attempts.length >= config.maxAttempts) {
    const oldest = attempts[0] ?? now
    const windowEnds = oldest + config.windowMs
    const retryAfterMs = Math.max(windowEnds - now, config.blockDurationMs)
    return {
      allowed: false,
      retryAfterMs,
      message: formatRateLimitMessage(action, retryAfterMs),
    }
  }

  return { allowed: true, retryAfterMs: 0, message: null }
}

export function recordRateLimitAttempt(action: RateLimitAction, key: string) {
  if (!key.trim()) return

  const config = CONFIGS[action]
  const now = Date.now()
  const store = readStore()
  const id = storageKey(action, key)
  const entry = store[id] ?? { attempts: [], blockedUntil: null, lastAttempt: null }

  const attempts = [...pruneAttempts(entry.attempts, config.windowMs, now), now]

  let blockedUntil = entry.blockedUntil
  if (attempts.length >= config.maxAttempts) {
    blockedUntil = now + config.blockDurationMs
  }

  store[id] = {
    attempts,
    blockedUntil: blockedUntil && blockedUntil > now ? blockedUntil : null,
    lastAttempt: now,
  }
  writeStore(store)
}

export function setServerRateLimitCooldown(action: RateLimitAction, key: string) {
  if (!key.trim()) return

  const config = CONFIGS[action]
  const now = Date.now()
  const store = readStore()
  const id = storageKey(action, key)

  store[id] = {
    attempts: store[id]?.attempts ?? [],
    blockedUntil: now + config.serverCooldownMs,
    lastAttempt: store[id]?.lastAttempt ?? now,
  }
  writeStore(store)
}

export function clearRateLimit(action: RateLimitAction, key: string) {
  if (!key.trim()) return

  const store = readStore()
  delete store[storageKey(action, key)]
  writeStore(store)
}

export async function withRateLimit<T extends { error: string | null }>(
  action: RateLimitAction,
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const check = peekRateLimit(action, key)
  if (!check.allowed) {
    return { error: check.message ?? 'Too many requests. Please try again later.' } as T
  }

  try {
    const result = await fn()

    if (result.error) {
      recordRateLimitAttempt(action, key)

      if (isApiRateLimitError(result.error)) {
        setServerRateLimitCooldown(action, key)
        const afterCooldown = peekRateLimit(action, key)
        return {
          ...result,
          error: afterCooldown.message ?? result.error,
        }
      }
    } else {
      clearRateLimit(action, key)
    }

    return result
  } catch {
    recordRateLimitAttempt(action, key)
    return {
      error: 'Cannot connect to server. Check your internet connection and try again.',
    } as T
  }
}
