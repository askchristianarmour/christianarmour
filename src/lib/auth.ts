import { supabase } from './supabase'
import type { LockStatus } from '../types/database'
import { formatAuthError } from './auth-errors'
import { withRateLimit } from './rate-limiter'
import { fetchUserBanStatus, storeBanNotice } from './user-bans'

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

function isEmailNotConfirmed(error: { message?: string; code?: string }) {
  const message = (error.message ?? '').toLowerCase()
  return (
    message.includes('email not confirmed') ||
    message.includes('email not verified') ||
    error.code === 'email_not_confirmed'
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

    const banStatus = await fetchUserBanStatus(normalized)
    if (banStatus.banned) {
      const reason = banStatus.reason || 'Your account has been banned.'
      return { error: `This account has been banned. ${reason}` }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })

    if (error) {
      if (isEmailNotConfirmed(error)) {
        return {
          error: `Your account is not verified yet. Please check ${normalized} for the confirmation link we sent when you signed up.`,
          needsEmailVerification: true,
        }
      }

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

    // Re-check after auth in case ban was applied mid-login
    const postBan = await fetchUserBanStatus(normalized)
    if (postBan.banned) {
      const reason = postBan.reason || 'Your account has been banned.'
      storeBanNotice(reason)
      await supabase.auth.signOut()
      return { error: `This account has been banned. ${reason}` }
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
