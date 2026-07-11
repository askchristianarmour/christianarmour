import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/** Mobile-only top + left breathing room for page back controls */
export const pageBackControlClass =
  'mt-3 ml-1 sm:mt-0 sm:ml-0'

const defaultLinkClass =
  `${pageBackControlClass} inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900`

type Props = {
  to: string
  children: ReactNode
  className?: string
}

export function PageBackLink({ to, children, className = '' }: Props) {
  return (
    <div className="mb-6">
      <Link to={to} className={`${defaultLinkClass} ${className}`.trim()}>
        <ChevronLeft size={16} />
        {children}
      </Link>
    </div>
  )
}
