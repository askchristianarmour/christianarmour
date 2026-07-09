import { Check, Copy, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  url: string
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.09 16.06 2 14.89 2 12.3 2 10.5 3.7 10.5 6.61V9.5H8v4h2.5V22h3.5v-8.5z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.18.28-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.43-2.25-1.39-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.1-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.28-.96.94-.96 2.3s.98 2.67 1.12 2.85c.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
      <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.95.57 3.76 1.55 5.3L2 22l4.95-1.63a9.86 9.86 0 0 0 5.09 1.4c5.46 0 9.89-4.43 9.89-9.89C21.93 6.43 17.5 2 12.04 2zm0 17.93c-1.66 0-3.2-.5-4.48-1.35l-.32-.2-3.3 1.09 1.11-3.22-.21-.33a8.07 8.07 0 0 1-1.24-4.33c0-4.47 3.64-8.11 8.11-8.11s8.11 3.64 8.11 8.11-3.64 8.11-8.11 8.11z" />
    </svg>
  )
}

function XTwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L4.9 22H1.64l8.02-9.16L1.5 2h6.75l4.66 6.16L18.244 2zm-1.16 18.1h1.82L7.01 3.8H5.06l12.02 16.3z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.94 8.5H3.5V21h3.44V8.5zM5.22 3C4.05 3 3.1 3.96 3.1 5.13c0 1.16.94 2.12 2.12 2.12 1.17 0 2.12-.96 2.12-2.12C7.34 3.96 6.39 3 5.22 3zM20.5 13.28c0-3.5-1.87-5.13-4.36-5.13-2.01 0-2.91 1.11-3.41 1.89V8.5H9.3c.05 1.01 0 12.5 0 12.5h3.43v-7c0-.37.03-.75.14-1.02.3-.75.99-1.52 2.14-1.52 1.51 0 2.11 1.15 2.11 2.84V21H20.5v-7.72z" />
    </svg>
  )
}

export function ShareArticleModal({ open, onClose, title, url }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  if (!open) return null

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks: {
    label: string
    href: string
    icon: ReactNode
    className: string
  }[] = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon />,
      className: 'bg-[#1877F2] text-white hover:bg-[#166fe5]',
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <WhatsAppIcon />,
      className: 'bg-[#25D366] text-white hover:bg-[#1ebe57]',
    },
    {
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <XTwitterIcon />,
      className: 'bg-slate-900 text-white hover:bg-slate-800',
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <LinkedInIcon />,
      className: 'bg-[#0A66C2] text-white hover:bg-[#0958a8]',
    },
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-article-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 id="share-article-title" className="pr-8 font-serif text-2xl text-slate-900">
          Share this article
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share “{title}” with friends and family.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {shareLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${item.className}`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Or copy link
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <p className="min-w-0 flex-1 truncate px-2 text-sm text-slate-600">{url}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1f2f3d] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#182633]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
