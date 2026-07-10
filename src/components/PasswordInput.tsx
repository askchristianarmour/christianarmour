import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState } from 'react'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { label, error, id, className = '', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`has-password-toggle w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-slate-400 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})
