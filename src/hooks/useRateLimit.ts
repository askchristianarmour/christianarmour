import { useEffect, useState } from 'react'
import { peekRateLimit, type RateLimitAction } from '../lib/rate-limiter'

export function useRateLimit(action: RateLimitAction, key: string) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!key.trim()) return

    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [action, key])

  void tick
  const check = peekRateLimit(action, key)

  return {
    isBlocked: !check.allowed,
    retryAfterMs: check.retryAfterMs,
    retryAfterSeconds: Math.ceil(check.retryAfterMs / 1000),
    message: check.message,
  }
}
