import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ExternalLink, FileText, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CrossLoader } from './CrossLoader'
import { useAuth } from '../hooks/useAuth'
import { useIsAdmin } from '../hooks/useUserPermissions'
import { useToast } from '../contexts/ToastContext'
import {
  fetchAdminPostList,
  fetchMySubmissions,
  setPostApprovalStatus,
  type AdminPostRow,
} from '../lib/posts'
import { getTagBySlug } from '../lib/tags'

function StatusPill({ status }: { status: AdminPostRow['status'] }) {
  const styles =
    status === 'approved'
      ? 'border-green-200 bg-green-50 text-green-700'
      : status === 'pending'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-red-200 bg-red-50 text-red-700'
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles}`}>
      {status}
    </span>
  )
}

export function MySubmissionsPanel() {
  const { user } = useAuth()
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['my-submissions', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchMySubmissions(user!.id),
  })

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Submissions need migration{' '}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs">019_post_approval.sql</code>.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-slate-500" />
        <h2 className="text-xl font-bold text-slate-900">My article submissions</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Articles you submit are reviewed before they appear on the site.
      </p>

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <CrossLoader />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No submissions yet.{' '}
          <Link to="/add-post" className="font-semibold text-slate-800 underline">
            Write an article
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{row.title}</p>
                <p className="text-xs text-slate-500">
                  {new Date(row.created_at).toLocaleDateString()}
                  {row.tag ? ` · ${getTagBySlug(row.tag)?.title ?? row.tag}` : ''}
                </p>
                {row.status === 'rejected' && row.rejection_reason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {row.rejection_reason}</p>
                )}
              </div>
              <StatusPill status={row.status} />
              {(row.status === 'pending' || row.status === 'rejected') && (
                <Link
                  to={`/add-post/edit/${row.id}`}
                  className="text-xs font-semibold text-slate-600 underline"
                >
                  Edit
                </Link>
              )}
              {row.status === 'approved' && (
                <Link
                  to={`/articles/${row.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 underline"
                >
                  View <ExternalLink size={12} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Admin queue controls for pending community submissions */
export function useAdminApprovalActions() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-posts-list'] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
    queryClient.invalidateQueries({ queryKey: ['posts-by-search'] })
    queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
    queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
    queryClient.invalidateQueries({ queryKey: ['my-submissions'] })
  }

  const approveMutation = useMutation({
    mutationFn: (postId: string) => setPostApprovalStatus(postId, 'approved'),
    onSuccess: () => {
      invalidate()
      toastSuccess('Article approved and listed')
    },
    onError: (err: Error) => toastError(err.message || 'Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
      setPostApprovalStatus(postId, 'rejected', reason),
    onSuccess: () => {
      invalidate()
      toastSuccess('Article rejected')
    },
    onError: (err: Error) => toastError(err.message || 'Failed to reject'),
  })

  return { approveMutation, rejectMutation }
}

export function AdminPendingApprovalsBanner() {
  const { isAdmin } = useIsAdmin()
  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts-list'],
    queryFn: fetchAdminPostList,
    enabled: isAdmin,
  })
  const pending = posts.filter((p) => p.status === 'pending').length
  if (!isAdmin || pending === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>
        <strong>{pending}</strong> article{pending === 1 ? '' : 's'} waiting for approval.
      </span>
      <Link to="/manage-articles" className="font-semibold underline">
        Review now
      </Link>
    </div>
  )
}

export function ApprovalButtons({
  postId,
  status,
}: {
  postId: string
  status: AdminPostRow['status']
}) {
  const { approveMutation, rejectMutation } = useAdminApprovalActions()
  if (status !== 'pending') return null

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title="Approve"
        disabled={approveMutation.isPending || rejectMutation.isPending}
        onClick={() => approveMutation.mutate(postId)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        title="Reject"
        disabled={approveMutation.isPending || rejectMutation.isPending}
        onClick={() => {
          const reason = window.prompt('Optional rejection reason:') ?? undefined
          rejectMutation.mutate({ postId, reason })
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <X size={16} />
      </button>
    </div>
  )
}
