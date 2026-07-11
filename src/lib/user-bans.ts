import { supabase } from './supabase'
import type { UserBan } from '../types/database'

export type { UserBan }

export type BanStatus = {
  banned: boolean
  reason?: string
  banned_at?: string
}

const ROOT_ADMIN_EMAIL = 'ask@christianarmour.com'
export const BAN_NOTICE_STORAGE_KEY = 'ca_ban_notice'

export function normalizeBanEmail(email: string) {
  return email.toLowerCase().trim()
}

export function isProtectedFromBan(email: string, actorEmail?: string | null) {
  const normalized = normalizeBanEmail(email)
  if (normalized === ROOT_ADMIN_EMAIL) return true
  if (actorEmail && normalized === normalizeBanEmail(actorEmail)) return true
  return false
}

export async function fetchUserBanStatus(email: string): Promise<BanStatus> {
  const normalized = normalizeBanEmail(email)
  if (!normalized) return { banned: false }

  const { data, error } = await supabase.rpc('get_user_ban_status', {
    p_email: normalized,
  })

  if (error || !data) return { banned: false }

  const status = data as BanStatus
  return {
    banned: !!status.banned,
    reason: status.reason,
    banned_at: status.banned_at,
  }
}

export async function fetchActiveBans(): Promise<UserBan[]> {
  const { data, error } = await supabase
    .from('user_bans')
    .select('*')
    .eq('active', true)
    .order('banned_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as UserBan[]
}

export async function banUser(payload: {
  email: string
  reason: string
  bannedBy: string
}) {
  const email = normalizeBanEmail(payload.email)
  if (!email) throw new Error('Email is required')
  if (isProtectedFromBan(email, payload.bannedBy)) {
    throw new Error('This account cannot be banned')
  }

  const reason = payload.reason.trim()
  if (!reason) throw new Error('Please provide a reason for the ban')

  const { error } = await supabase.from('user_bans').upsert(
    {
      email,
      reason,
      banned_by: normalizeBanEmail(payload.bannedBy),
      banned_at: new Date().toISOString(),
      active: true,
    },
    { onConflict: 'email' }
  )

  if (error) throw error
}

export async function unbanUser(email: string) {
  const normalized = normalizeBanEmail(email)
  const { error } = await supabase
    .from('user_bans')
    .update({ active: false })
    .eq('email', normalized)

  if (error) throw error
}

export function storeBanNotice(reason: string) {
  try {
    sessionStorage.setItem(BAN_NOTICE_STORAGE_KEY, reason)
  } catch {
    // ignore storage failures
  }
}

export function consumeBanNotice(): string | null {
  try {
    const value = sessionStorage.getItem(BAN_NOTICE_STORAGE_KEY)
    if (value) sessionStorage.removeItem(BAN_NOTICE_STORAGE_KEY)
    return value
  } catch {
    return null
  }
}
