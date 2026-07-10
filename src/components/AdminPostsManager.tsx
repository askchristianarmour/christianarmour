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

export function AdminPostsManager() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['admin-posts-list'],
    queryFn: fetchAdminPostList,
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return posts
    return posts.filter((post) => {
      const tag = post.tag ? getTagBySlug(post.tag)?.title ?? post.tag : ''
      return (
        post.title.toLowerCase().includes(term) ||
        tag.toLowerCase().includes(term)
      )
    })
  }, [posts, search])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((post) => selectedIds.includes(post.id))

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

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filtered.map((post) => post.id))
      setSelectedIds((current) => current.filter((id) => !filteredSet.has(id)))
      return
    }
    setSelectedIds((current) => {
      const next = new Set(current)
      filtered.forEach((post) => next.add(post.id))
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
            Select articles to delete, edit, or control comments across the site.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {posts.length} total
        </p>
      </div>

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
          <button
            type="button"
            onClick={toggleAllFiltered}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {allFilteredSelected ? <CheckSquare size={15} /> : <Square size={15} />}
            {allFilteredSelected ? 'Clear selection' : 'Select all'}
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

      {selectedIds.length > 0 && (
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
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {search.trim() ? 'No articles match your search.' : 'No articles published yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((post) => (
              <AdminPostRowItem
                key={post.id}
                post={post}
                selected={selectedIds.includes(post.id)}
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

      <DeleteArticleConfirmationModal
        open={confirmOpen}
        postTitle={confirmLabel}
        bulkCount={selectedPosts.length}
        isDeleting={deleteMutation.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}

function AdminPostRowItem({
  post,
  selected,
  onToggle,
  onToggleComments,
  commentsPending,
}: {
  post: AdminPostRow
  selected: boolean
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
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
        />
        <span className="min-w-0 flex-1">
          {tag && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">
              {tag.title}
            </span>
          )}
          <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">
            {post.title}
          </span>
          <span className="mt-1 block text-xs text-slate-500">{date}</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-1.5 pl-7 sm:pl-0">
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
