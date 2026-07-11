import { Ban, ShieldAlert } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import {
  banUser,
  fetchActiveBans,
  isProtectedFromBan,
  unbanUser,
} from '../lib/user-bans'
import { BanUserModal } from './BanUserModal'
import { UnbanUserConfirmationModal } from './UnbanUserConfirmationModal'

export function AdminBannedUsersManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const [banEmail, setBanEmail] = useState('')
  const [banReason, setBanReason] = useState('')
  const [confirmBan, setConfirmBan] = useState<{ email: string; reason: string } | null>(
    null
  )
  const [unbanEmail, setUnbanEmail] = useState<string | null>(null)

  const {
    data: bans,
    error: bansError,
    isLoading,
  } = useQuery({
    queryKey: ['user-bans'],
    queryFn: fetchActiveBans,
  })

  const banMutation = useMutation({
    mutationFn: async (payload: { email: string; reason: string }) => {
      if (!user?.email) throw new Error('You must be signed in')
      await banUser({
        email: payload.email,
        reason: payload.reason,
        bannedBy: user.email,
      })
    },
    onSuccess: () => {
      toastSuccess('User banned successfully')
      setBanEmail('')
      setBanReason('')
      setConfirmBan(null)
      queryClient.invalidateQueries({ queryKey: ['user-bans'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to ban user')
    },
  })

  const unbanMutation = useMutation({
    mutationFn: async (email: string) => {
      await unbanUser(email)
    },
    onSuccess: () => {
      toastSuccess('User unbanned')
      setUnbanEmail(null)
      queryClient.invalidateQueries({ queryKey: ['user-bans'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to unban user')
    },
  })

  const handleBanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const email = banEmail.trim()
    const reason = banReason.trim()
    if (!email) {
      toastError('Email address is required')
      return
    }
    if (!reason) {
      toastError('Please provide a reason for the ban')
      return
    }
    if (isProtectedFromBan(email, user?.email)) {
      toastError('This account cannot be banned')
      return
    }
    setConfirmBan({ email, reason })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Banned Users</h2>
        <p className="mt-1 text-xs text-slate-500">
          Ban a signed-in user by email. They will be signed out and blocked from commenting,
          liking, posting, and asking questions while signed in.
        </p>
      </div>

      {bansError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-start gap-2">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Database Setup Required:</span> Run{' '}
            <code className="rounded bg-amber-100 px-1 font-mono">
              supabase/migrations/018_user_bans.sql
            </code>{' '}
            in your Supabase SQL editor.
          </div>
        </div>
      )}

      {!bansError && (
        <>
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900">
            <span className="font-bold">Important:</span> Enter the registered email of the user
            you want to ban, and include a clear reason.
          </p>

          <form onSubmit={handleBanSubmit} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={banEmail}
                onChange={(e) => setBanEmail(e.target.value)}
                placeholder="User email address"
                className="w-full flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                required
              />
            </div>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban (required)"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 resize-y"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={banMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Ban size={16} />
                Ban user
              </button>
            </div>
          </form>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Banned
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                      Loading bans...
                    </td>
                  </tr>
                ) : !bans || bans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                      No banned users.
                    </td>
                  </tr>
                ) : (
                  bans.map((ban) => (
                    <tr key={ban.email}>
                      <td
                        className="max-w-[180px] truncate px-4 py-3 font-medium text-slate-900"
                        title={ban.email}
                      >
                        {ban.email}
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-slate-600" title={ban.reason ?? ''}>
                        <span className="line-clamp-2">{ban.reason || '—'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(ban.banned_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {ban.banned_by ? (
                          <span className="mt-0.5 block text-[11px] text-slate-400">
                            by {ban.banned_by}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setUnbanEmail(ban.email)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BanUserModal
        open={!!confirmBan}
        email={confirmBan?.email ?? ''}
        reason={confirmBan?.reason ?? ''}
        isBanning={banMutation.isPending}
        onClose={() => {
          if (!banMutation.isPending) setConfirmBan(null)
        }}
        onConfirm={() => {
          if (confirmBan) banMutation.mutate(confirmBan)
        }}
      />

      <UnbanUserConfirmationModal
        open={!!unbanEmail}
        email={unbanEmail ?? ''}
        isUnbanning={unbanMutation.isPending}
        onClose={() => {
          if (!unbanMutation.isPending) setUnbanEmail(null)
        }}
        onConfirm={() => {
          if (unbanEmail) unbanMutation.mutate(unbanEmail)
        }}
      />
    </div>
  )
}
