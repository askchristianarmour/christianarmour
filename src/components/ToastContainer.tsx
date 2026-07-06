import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

export function ToastContainer() {
  const { toasts, remove } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => {
        let IconEl = Info
        let iconWrapClass = 'bg-slate-200 text-slate-600'
        let borderClass = 'border-slate-200'

        if (toast.type === 'success') {
          IconEl = CheckCircle2
          iconWrapClass = 'bg-[#faf5e8] text-[#a8863d]'
          borderClass = 'border-[#e8d5a8]'
        } else if (toast.type === 'error') {
          IconEl = AlertCircle
          iconWrapClass = 'bg-rose-50 text-rose-600'
          borderClass = 'border-rose-200'
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${borderClass} bg-[#f4f4f5]/95 p-4 text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300`}
            role="alert"
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
            >
              <IconEl className="h-4 w-4" />
            </span>
            <div className="flex-1 pt-0.5 text-sm leading-6 text-slate-700">{toast.message}</div>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700"
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
