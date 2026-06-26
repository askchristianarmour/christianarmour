import { supabase } from './supabase'
import { formatAuthError } from './auth'
import { withRateLimit } from './rate-limiter'

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export function getResetPasswordRedirectUrl() {
  return `${window.location.origin}/reset-password`
}

export async function sendPasswordResetLink(email: string) {
  const normalized = normalizeEmail(email)

  return withRateLimit('forgotPassword', normalized, async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: getResetPasswordRedirectUrl(),
    })

    if (error) {
      return { error: formatAuthError(error) }
    }

    return { error: null }
  })
}

export async function updatePassword(newPassword: string, email?: string) {
  const key = email ? normalizeEmail(email) : 'session'

  return withRateLimit('resetPassword', key, async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      return { error: formatAuthError(error) }
    }

    await supabase.auth.signOut()
    return { error: null }
  })
}
