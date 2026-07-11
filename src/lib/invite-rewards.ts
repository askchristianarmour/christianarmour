import { supabase } from './supabase'

export type BibleWallet = {
  user_id: string
  referral_code: string
  bible_tokens: number
  created_at: string
  updated_at: string
}

export type UserBadge = {
  user_id: string
  badge_id: string
  earned_at: string
}

export type ReferralRow = {
  id: string
  inviter_id: string
  invitee_id: string
  referral_code: string
  inviter_tokens: number
  invitee_tokens: number
  created_at: string
}

export const INVITE_MILESTONES = [
  {
    id: 'seeker',
    title: 'Seeker',
    tokensRequired: 25,
    description: 'First steps — earn your first Bible Tokens.',
    emoji: '🌱',
  },
  {
    id: 'disciple',
    title: 'Disciple',
    tokensRequired: 100,
    description: 'Growing in community through invites.',
    emoji: '📘',
  },
  {
    id: 'ambassador',
    title: 'Ambassador',
    tokensRequired: 250,
    description: 'Recognized for bringing many friends.',
    emoji: '🏅',
  },
  {
    id: 'evangelist',
    title: 'Evangelist',
    tokensRequired: 500,
    description: 'Top recognition for invite impact.',
    emoji: '🌟',
  },
] as const

export const INVITER_REWARD = 50
export const INVITEE_REWARD = 25

export function buildInvitePath(code: string) {
  return `/signup?ref=${encodeURIComponent(code.trim().toUpperCase())}`
}

export async function ensureBibleWallet(): Promise<BibleWallet> {
  const { data, error } = await supabase.rpc('ensure_bible_wallet')
  if (error) throw error
  return data as BibleWallet
}

export async function fetchMyBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as UserBadge[]
}

export async function fetchMyReferrals(userId: string): Promise<ReferralRow[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('inviter_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ReferralRow[]
}

export async function claimReferralCode(code: string) {
  const { data, error } = await supabase.rpc('claim_referral', {
    p_code: code.trim().toUpperCase(),
  })
  if (error) throw error
  return data as { ok: boolean; error?: string; invitee_tokens?: number; balance?: number }
}

export function getNextMilestone(tokens: number) {
  return INVITE_MILESTONES.find((m) => tokens < m.tokensRequired) ?? null
}
