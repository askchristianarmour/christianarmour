import { supabase } from './supabase'
import type { LockStatus } from '../types/database'

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

async function signInViaEdgeFunction(email: string, password: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-sign-in`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })

  if (res.status === 404 || res.status === 502 || res.status === 503) {
    throw new Error('EDGE_FUNCTION_UNAVAILABLE')
  }

  const result = await res.json()

  if (!res.ok) {
    return { error: result.error ?? 'Sign in failed.' }
  }

  const { error } = await supabase.auth.setSession({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

async function signInViaRpc(email: string, password: string) {
  const normalized = normalizeEmail(email)

  const { data: lockStatus, error: lockError } = await supabase.rpc(
    'get_login_lock_status',
    { p_email: normalized },
  )

  if (lockError) {
    return { error: lockError.message }
  }

  const status = lockStatus as LockStatus
  if (status.locked) {
    return { error: 'Account locked. Try again after 24 hours.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })

  if (error) {
    const { data: failResult } = await supabase.rpc('record_failed_login', {
      p_email: normalized,
    })

    const fail = failResult as LockStatus
    return { error: fail?.message ?? error.message }
  }

  await supabase.rpc('reset_login_attempts', { p_email: normalized })
  return { error: null }
}

export async function secureSignIn(email: string, password: string) {
  try {
    return await signInViaEdgeFunction(email, password)
  } catch {
    return signInViaRpc(email, password)
  }
}
