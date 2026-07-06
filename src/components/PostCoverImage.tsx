import { useEffect, useState } from 'react'

type Props = {
  imageUrl?: string | null
  title: string
  className?: string
  titleClassName?: string
}

function CoverPlaceholder({
  title,
  className = '',
  titleClassName = 'font-serif text-3xl leading-tight text-slate-700',
}: {
  title: string
  className?: string
  titleClassName?: string
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f7f2e8_0%,#f4efe7_45%,#e8e3d8_100%)] px-8 text-center ${className}`}
    >
      <h3 className={titleClassName}>{title}</h3>
    </div>
  )
}

export function PostCoverImage({ imageUrl, title, className = '', titleClassName }: Props) {
  const normalizedUrl = imageUrl?.trim() || null
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(() =>
    normalizedUrl ? 'loading' : 'error'
  )

  useEffect(() => {
    setStatus(normalizedUrl ? 'loading' : 'error')
  }, [normalizedUrl])

  if (!normalizedUrl || status === 'error') {
    return (
      <CoverPlaceholder title={title} className={className} titleClassName={titleClassName} />
    )
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden />
      )}
      <img
        src={normalizedUrl}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`h-full w-full object-cover transition-all duration-300 ${
          status === 'loaded'
            ? 'opacity-100 hover:scale-105'
            : 'opacity-0'
        }`}
      />
    </div>
  )
}
