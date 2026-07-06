import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

export function AuthRequiredModal({ open, onClose }: Props) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-slate-900">Sign in to comment</h2>
        <p className="mt-2 text-sm text-slate-600">
          Comments require an account. Create one or sign in if you already have one.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/signup')
            }}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/signin')
            }}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
