import type { AuthError } from '@supabase/supabase-js'

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: string }).message)
    return (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('ERR_INTERNET_DISCONNECTED')
    )
  }

  return false
}

export function formatAuthError(error: AuthError | Error) {
  if (isNetworkError(error)) {
    return 'Cannot reach Supabase. Check your internet connection, then verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (and on Vercel for production).'
  }

  if ('status' in error && error.status === 429) {
    return 'API rate limit reached. Please wait a few minutes before trying again.'
  }

  const message = error.message.toLowerCase()

  if (message.includes('rate limit') || message.includes('email rate')) {
    return 'Email rate limit reached. Please wait a few minutes before trying again.'
  }

  if (message.includes('invalid api key') || message.includes('jwt')) {
    return 'Invalid Supabase API key. Copy the anon/public key from Supabase → Project Settings → API.'
  }

  if (message.includes('email not confirmed') || message.includes('email not verified')) {
    return 'Your account is not verified yet. Please check your email for the confirmation link we sent when you signed up.'
  }

  return error.message
}
