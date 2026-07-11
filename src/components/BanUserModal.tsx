import { Ban, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  email: string
  reason: string
  isBanning?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function BanUserModal({
  open,
  email,
  reason,
  isBanning = false,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBanning) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isBanning, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      onClick={isBanning ? undefined : onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ban-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isBanning}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Ban size={20} className="text-red-600" />
          </div>
          <div>
            <h2 id="ban-user-title" className="text-xl font-semibold text-slate-900">
              Ban this user?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ban{' '}
              <span className="font-semibold text-slate-800">{email}</span>? They will be signed
              out and blocked from interacting while signed in.
            </p>
            <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Reason:</span> {reason}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBanning}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBanning ? 'Banning...' : 'Yes, ban user'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isBanning}
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
