import { supabase } from './supabase'

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export function getResetPasswordRedirectUrl() {
  return `${window.location.origin}/reset-password`
}

export async function sendPasswordResetLink(email: string) {
  const normalized = normalizeEmail(email)

  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: getResetPasswordRedirectUrl(),
  })

  return { error: error?.message ?? null }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  return { error: null }
}
