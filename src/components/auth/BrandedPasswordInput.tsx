import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState } from 'react'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  error?: string
}

export const BrandedPasswordInput = forwardRef<HTMLInputElement, Props>(
  function BrandedPasswordInput({ error, className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false)

    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={`w-full border-0 border-b border-slate-300 bg-transparent py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1c2b3a] ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
