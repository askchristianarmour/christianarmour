import { useEffect, useMemo, useRef, useState } from 'react'
import { getFallbackCoverImage, resolvePostCoverImage } from '../lib/cover-images'
import { useFallbackCoverPool } from '../hooks/useFallbackCoverPool'

type Props = {
  imageUrl?: string | null
  title: string
  /** Stable seed (usually post id) so the same article keeps the same fallback. */
  seed?: string | null
  className?: string
  titleClassName?: string
  /** 'eager' preloads immediately (heroes / near-viewport cards); default 'lazy'. */
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
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
  loading = 'lazy',
  fetchPriority = 'auto',
}: Props) {
  const { data: coverPool } = useFallbackCoverPool()
  const imgRef = useRef<HTMLImageElement>(null)
  const primaryUrl = useMemo(
    () => resolvePostCoverImage(imageUrl, seed, [], coverPool),
    [imageUrl, seed, coverPool]
  )
  const [src, setSrc] = useState(primaryUrl)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [usedFallback, setUsedFallback] = useState(!imageUrl?.trim())

  useEffect(() => {
    const next = resolvePostCoverImage(imageUrl, seed, [], coverPool)
    setSrc(next)
    setStatus('loading')
    setUsedFallback(!imageUrl?.trim())
  }, [imageUrl, seed, coverPool])

  // Browser-cached images can finish before React attaches onLoad (e.g. when
  // navigating back to a page), which left covers stuck invisible. Detect the
  // already-complete state and mark them loaded.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setStatus('loaded')
    }
  }, [src])

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
        ref={imgRef}
        src={src}
        alt={title}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (!usedFallback) {
            setUsedFallback(true)
            setSrc(getFallbackCoverImage(seed ?? title, [], coverPool))
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
