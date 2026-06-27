import { supabase } from './supabase'
import type { LockStatus } from '../types/database'
import { formatAuthError } from './auth-errors'
import { withRateLimit } from './rate-limiter'

const MAX_ATTEMPTS = 5

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function isWrongCredentials(error: { message?: string; code?: string }) {
  return (
    error.message === 'Invalid login credentials' ||
    error.code === 'invalid_credentials'
  )
}

export { formatAuthError } from './auth-errors'

async function signInRequest(email: string, password: string) {
  try {
    const normalized = normalizeEmail(email)

    const { data: lockStatus, error: lockError } = await supabase.rpc(
      'get_login_lock_status',
      { p_email: normalized },
    )

    if (!lockError) {
      const status = lockStatus as LockStatus
      if (status.locked) {
        return { error: 'Account locked after too many wrong passwords. Try again after 24 hours.' }
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })

    if (error) {
      if (isWrongCredentials(error)) {
        const { data: failResult } = await supabase.rpc('record_failed_login', {
          p_email: normalized,
        })

        const fail = failResult as LockStatus
        if (fail?.message) {
          return { error: fail.message }
        }

        const remaining = fail?.remaining ?? MAX_ATTEMPTS - 1
        return {
          error: `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`,
        }
      }

      return { error: formatAuthError(error) }
    }

    await supabase.rpc('reset_login_attempts', { p_email: normalized })
    return { error: null }
  } catch (err) {
    return { error: formatAuthError(err instanceof Error ? err : new Error('Sign in failed')) }
  }
}

export async function secureSignIn(email: string, password: string) {
  const normalized = normalizeEmail(email)
  return withRateLimit('signIn', normalized, () => signInRequest(normalized, password))
}
