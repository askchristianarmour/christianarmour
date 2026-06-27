import { useToast } from '../contexts/ToastContext'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, remove } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let IconEl = Info
        let iconColor = 'text-blue-400'

        if (toast.type === 'success') {
          IconEl = CheckCircle2
          iconColor = 'text-emerald-400'
        } else if (toast.type === 'error') {
          IconEl = AlertCircle
          iconColor = 'text-rose-400'
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 text-zinc-100 rounded-xl p-3.5 shadow-xl animate-in slide-in-from-right duration-300"
            role="alert"
          >
            <IconEl className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium leading-5">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg p-0.5 shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
