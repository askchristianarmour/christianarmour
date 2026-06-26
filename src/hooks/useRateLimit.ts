import { useSyncExternalStore } from 'react'
import { peekRateLimit, type RateLimitAction } from '../lib/rate-limiter'

function subscribe(onStoreChange: () => void) {
  const interval = setInterval(onStoreChange, 1000)
  return () => clearInterval(interval)
}

export function useRateLimit(action: RateLimitAction, key: string) {
  const check = useSyncExternalStore(
    subscribe,
    () => peekRateLimit(action, key),
    () => peekRateLimit(action, key),
  )

  return {
    isBlocked: !check.allowed,
    retryAfterMs: check.retryAfterMs,
    retryAfterSeconds: Math.ceil(check.retryAfterMs / 1000),
    message: check.message,
  }
}
