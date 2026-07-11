import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteArticleConfirmationModal } from './DeleteArticleConfirmationModal'
import { useToast } from '../contexts/ToastContext'
import { deletePost } from '../lib/posts'

type Props = {
  postId: string
  postTitle: string
  canDelete?: boolean
}

export function ArticleAdminActions({ postId, postTitle, canDelete = true }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      setConfirmOpen(false)
      toastSuccess('Article deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
      queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
      navigate('/articles')
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to delete article')
    },
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200/80 bg-[#faf5e8]/60 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a8863d]">
          {canDelete ? 'Admin' : 'Editor'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            to={`/add-post/edit/${postId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pencil size={15} />
            Edit article
          </Link>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setConfirmOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
        </div>
      </div>

      {canDelete && (
        <DeleteArticleConfirmationModal
          open={confirmOpen}
          postTitle={postTitle}
          isDeleting={deleteMutation.isPending}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </>
  )
}
