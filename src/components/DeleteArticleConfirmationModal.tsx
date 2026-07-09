import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  postTitle: string
  isDeleting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteArticleConfirmationModal({
  open,
  postTitle,
  isDeleting = false,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isDeleting, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      onClick={isDeleting ? undefined : onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-article-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 id="delete-article-title" className="text-xl font-semibold text-slate-900">
              Delete this article?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to delete &ldquo;{postTitle}&rdquo;? This will permanently remove
              the article, its comments, and likes. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete article'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
