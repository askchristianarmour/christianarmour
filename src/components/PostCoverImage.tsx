import { useEffect, useMemo, useState } from 'react'
import { getFallbackCoverImage, resolvePostCoverImage } from '../lib/cover-images'

type Props = {
  imageUrl?: string | null
  title: string
  /** Stable seed (usually post id) so the same article keeps the same fallback. */
  seed?: string | null
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
      className={`flex w-full items-center justify-center bg-[linear-gradient(135deg,#f7f2e8_0%,#f4efe7_45%,#e8e3d8_100%)] px-8 text-center ${className}`}
    >
      <h3 className={`line-clamp-3 ${titleClassName}`}>{title}</h3>
    </div>
  )
}

export function PostCoverImage({
  imageUrl,
  title,
  seed = null,
  className = '',
  titleClassName,
}: Props) {
  const primaryUrl = useMemo(
    () => resolvePostCoverImage(imageUrl, seed),
    [imageUrl, seed]
  )
  const [src, setSrc] = useState(primaryUrl)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [usedFallback, setUsedFallback] = useState(!imageUrl?.trim())

  useEffect(() => {
    const next = resolvePostCoverImage(imageUrl, seed)
    setSrc(next)
    setStatus('loading')
    setUsedFallback(!imageUrl?.trim())
  }, [imageUrl, seed])

  if (status === 'error') {
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
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (!usedFallback) {
            setUsedFallback(true)
            setSrc(getFallbackCoverImage(seed ?? title))
            setStatus('loading')
            return
          }
          setStatus('error')
        }}
        className={`h-full w-full object-cover transition-all duration-300 ${
          status === 'loaded' ? 'opacity-100 hover:scale-105' : 'opacity-0'
        }`}
      />
    </div>
  )
}
