import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Gift, Share2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'
import {
  INVITEE_REWARD,
  INVITE_MILESTONES,
  INVITER_REWARD,
  buildInvitePath,
  ensureBibleWallet,
  fetchMyBadges,
  fetchMyReferrals,
  getNextMilestone,
} from '../lib/invite-rewards'

export function InviteRewardsPanel() {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [copied, setCopied] = useState(false)

  const { data: wallet, isLoading, error } = useQuery({
    queryKey: ['bible-wallet', user?.id],
    enabled: !!user?.id,
    queryFn: ensureBibleWallet,
  })

  const { data: badges = [] } = useQuery({
    queryKey: ['user-badges', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchMyBadges(user!.id),
  })

  const { data: referrals = [] } = useQuery({
    queryKey: ['my-referrals', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchMyReferrals(user!.id),
  })

  const inviteUrl = useMemo(() => {
    if (!wallet?.referral_code || typeof window === 'undefined') return ''
    return `${window.location.origin}${buildInvitePath(wallet.referral_code)}`
  }, [wallet?.referral_code])

  const earnedBadgeIds = new Set(badges.map((b) => b.badge_id))
  const next = wallet ? getNextMilestone(wallet.bible_tokens) : null
  const progress = wallet
    ? next
      ? Math.min(100, Math.round((wallet.bible_tokens / next.tokensRequired) * 100))
      : 100
    : 0

  const copyInvite = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toastSuccess('Invite link copied')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toastError('Could not copy link')
    }
  }

  const shareInvite = async () => {
    if (!inviteUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Christian Armour',
          text: 'Join me on Christian Armour — explore Scripture and earn Bible Tokens.',
          url: inviteUrl,
        })
        return
      } catch {
        // fall through to copy
      }
    }
    await copyInvite()
  }

  if (!user) return null

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:p-5">
        Invite & Earn needs the database migration{' '}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs">020_invite_rewards.sql</code>{' '}
        applied in Supabase.
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf5e8] text-[#8a6d2b]">
            <Gift size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Invite & Earn Rewards</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Share your invite link. When a friend joins, you earn{' '}
              <strong>{INVITER_REWARD} Bible Tokens</strong> and they earn{' '}
              <strong>{INVITEE_REWARD}</strong>. Unlock badges as you grow.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Bible Tokens
            </p>
            <p className="mt-1 font-serif text-2xl text-slate-900 sm:text-3xl">
              {isLoading ? '—' : wallet?.bible_tokens ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Friends invited
            </p>
            <p className="mt-1 font-serif text-2xl text-slate-900 sm:text-3xl">{referrals.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Your code
            </p>
            <p className="mt-1 break-all font-mono text-base font-semibold tracking-wider text-slate-900 sm:text-lg">
              {wallet?.referral_code ?? '••••••••'}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 sm:mt-5">
          <label className="text-xs font-semibold text-slate-600">Your invite link</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={inviteUrl}
              className="min-w-0 w-full flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button
                type="button"
                onClick={copyInvite}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:px-4"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={shareInvite}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:px-4"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>

        {next && (
          <div className="mt-4 sm:mt-5">
            <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Next: {next.emoji} {next.title} ({next.tokensRequired} tokens)
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#c6a14d] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">Badges & recognition</h3>
        <p className="mt-1 text-sm text-slate-500">Milestone rewards unlock as your tokens grow.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {INVITE_MILESTONES.map((milestone) => {
            const earned = earnedBadgeIds.has(milestone.id)
            return (
              <div
                key={milestone.id}
                className={`rounded-xl border p-3 sm:p-4 ${
                  earned
                    ? 'border-[#e8d9b0] bg-[#faf5e8]'
                    : 'border-slate-100 bg-slate-50 opacity-80'
                }`}
              >
                <div className="flex items-start gap-2 sm:items-center">
                  <span className="text-2xl leading-none">{milestone.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{milestone.title}</p>
                    <p className="text-xs text-slate-500">{milestone.tokensRequired} tokens</p>
                  </div>
                  {earned && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                      Earned
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{milestone.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Users size={18} className="shrink-0 text-slate-500" />
          <h3 className="text-base font-bold text-slate-900 sm:text-lg">Successful invites</h3>
        </div>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No friends have joined with your link yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {referrals.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-slate-600">
                  Joined {new Date(row.created_at).toLocaleDateString()}
                </span>
                <span className="font-semibold text-[#8a6d2b]">+{row.inviter_tokens} tokens</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
