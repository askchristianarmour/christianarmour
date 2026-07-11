import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckSquare,
  ExternalLink,
  MessageCircle,
  MessageCircleOff,
  Pencil,
  Search,
  Square,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CrossLoader, CrossSpinner } from './CrossLoader'
import { DeleteArticleConfirmationModal } from './DeleteArticleConfirmationModal'
import { useToast } from '../contexts/ToastContext'
import {
  deletePosts,
  fetchAdminPostList,
  setPostCommentsEnabled,
  type AdminPostRow,
} from '../lib/posts'
import { getTagBySlug } from '../lib/tags'
import { ApprovalButtons } from './MySubmissionsPanel'

const PREVIEW_LIMIT = 10

type Props = {
  /** Preview on Profile settings: first 10 + link to full page. */
  variant?: 'preview' | 'full'
}

export function AdminPostsManager({ variant = 'full' }: Props) {
  const isPreview = variant === 'preview'
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all'
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['admin-posts-list'],
    queryFn: fetchAdminPostList,
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return posts.filter((post) => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false
      if (!term) return true
      const tag = post.tag ? getTagBySlug(post.tag)?.title ?? post.tag : ''
      return (
        post.title.toLowerCase().includes(term) ||
        tag.toLowerCase().includes(term)
      )
    })
  }, [posts, search, statusFilter])

  const pendingCount = posts.filter((p) => p.status === 'pending').length

  const visiblePosts = isPreview ? filtered.slice(0, PREVIEW_LIMIT) : filtered
  const hasMoreThanPreview = posts.length > PREVIEW_LIMIT

  const allVisibleSelected =
    visiblePosts.length > 0 &&
    visiblePosts.every((post) => selectedIds.includes(post.id))

  const selectedPosts = posts.filter((post) => selectedIds.includes(post.id))

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-posts-list'] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
    queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
    queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
  }

  const deleteMutation = useMutation({
    mutationFn: () => deletePosts(selectedIds),
    onSuccess: () => {
      const count = selectedIds.length
      setConfirmOpen(false)
      setSelectedIds([])
      invalidate()
      toastSuccess(
        count === 1 ? 'Article deleted successfully' : `${count} articles deleted successfully`
      )
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to delete articles')
    },
  })

  const commentsMutation = useMutation({
    mutationFn: ({ postId, enabled }: { postId: string; enabled: boolean }) =>
      setPostCommentsEnabled(postId, enabled),
    onSuccess: (_data, vars) => {
      invalidate()
      toastSuccess(vars.enabled ? 'Comments enabled' : 'Comments disabled')
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update comments')
    },
  })

  const toggleOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(visiblePosts.map((post) => post.id))
      setSelectedIds((current) => current.filter((id) => !visibleSet.has(id)))
      return
    }
    setSelectedIds((current) => {
      const next = new Set(current)
      visiblePosts.forEach((post) => next.add(post.id))
      return [...next]
    })
  }

  const confirmLabel =
    selectedPosts.length === 1
      ? selectedPosts[0]?.title ?? 'this article'
      : `${selectedPosts.length} selected articles`

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manage Articles</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPreview
              ? 'Recent articles at a glance. Open the full manager to approve, search, and delete.'
              : 'Approve community submissions, edit, delete, or control comments.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {pendingCount} pending
            </span>
          )}
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {isPreview
              ? `Showing ${Math.min(PREVIEW_LIMIT, posts.length)} of ${posts.length}`
              : `${posts.length} total`}
          </p>
        </div>
      </div>

      {!isPreview && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  statusFilter === key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={toggleAllVisible}
              disabled={visiblePosts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {allVisibleSelected ? <CheckSquare size={15} /> : <Square size={15} />}
              {allVisibleSelected ? 'Clear selection' : 'Select all'}
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || deleteMutation.isPending}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={15} />
              Delete selected
              {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
          </div>
        </div>
      )}

      {!isPreview && selectedIds.length > 0 && (
        <p className="mt-3 text-xs font-medium text-[#8a6d2b]">
          {selectedIds.length} article{selectedIds.length === 1 ? '' : 's'} selected
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <CrossLoader size="md" label="Loading articles..." />
          </div>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-red-600">
            Failed to load articles. Please try again.
          </p>
        ) : visiblePosts.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {search.trim()
              ? 'No articles match your search.'
              : statusFilter !== 'all'
                ? `No ${statusFilter} articles.`
                : 'No articles published yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visiblePosts.map((post) => (
              <AdminPostRowItem
                key={post.id}
                post={post}
                selected={!isPreview && selectedIds.includes(post.id)}
                showCheckbox={!isPreview}
                onToggle={() => toggleOne(post.id)}
                commentsPending={
                  commentsMutation.isPending && commentsMutation.variables?.postId === post.id
                }
                onToggleComments={() =>
                  commentsMutation.mutate({
                    postId: post.id,
                    enabled: !post.comments_enabled,
                  })
                }
              />
            ))}
          </ul>
        )}
      </div>

      {isPreview && (
        <div className="mt-4 flex justify-center">
          <Link
            to="/manage-articles"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Manage Articles
            {hasMoreThanPreview ? ` (${posts.length})` : ''}
          </Link>
        </div>
      )}

      {!isPreview && (
        <DeleteArticleConfirmationModal
          open={confirmOpen}
          postTitle={confirmLabel}
          bulkCount={selectedPosts.length}
          isDeleting={deleteMutation.isPending}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </div>
  )
}

function AdminPostRowItem({
  post,
  selected,
  showCheckbox,
  onToggle,
  onToggleComments,
  commentsPending,
}: {
  post: AdminPostRow
  selected: boolean
  showCheckbox: boolean
  onToggle: () => void
  onToggleComments: () => void
  commentsPending: boolean
}) {
  const tag = post.tag ? getTagBySlug(post.tag) : null
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <li
      className={`flex flex-col gap-3 px-3 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-4 ${
        selected ? 'bg-[#faf8f4]' : 'bg-white hover:bg-slate-50/80'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {showCheckbox && (
          <label className="mt-1 inline-flex cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
            />
            <span className="sr-only">Select {post.title}</span>
          </label>
        )}
        <span className="min-w-0 flex-1">
          {tag && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">
              {tag.title}
            </span>
          )}
          <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">
            {post.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{date}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                post.status === 'approved'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : post.status === 'pending'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {post.status}
            </span>
          </span>
        </span>
      </div>

      <div className={`flex flex-wrap items-center gap-1.5 ${showCheckbox ? 'pl-7 sm:pl-0' : ''}`}>
        <ApprovalButtons postId={post.id} status={post.status} />

        <button
          type="button"
          onClick={onToggleComments}
          disabled={commentsPending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          title={post.comments_enabled ? 'Disable comments' : 'Enable comments'}
        >
          {commentsPending ? (
            <CrossSpinner size="xs" />
          ) : post.comments_enabled ? (
            <MessageCircle size={13} />
          ) : (
            <MessageCircleOff size={13} />
          )}
          {post.comments_enabled ? 'Comments on' : 'Comments off'}
        </button>

        <Link
          to={`/add-post/edit/${post.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Pencil size={13} />
          Edit
        </Link>

        <Link
          to={`/articles/${post.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ExternalLink size={13} />
          View
        </Link>
      </div>
    </li>
  )
}
