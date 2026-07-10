import { useEffect, useRef, useState } from 'react'
import { CrossSpinner } from '../CrossLoader'

type Props = {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
  spinnerSize?: 'xs' | 'sm' | 'md'
  /** Spinner overlay background (use dark for hero panels). */
  overlayClassName?: string
}

/** Shows a spinner until the image finishes loading (or errors). */
export function AuthLoadedImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  spinnerSize = 'sm',
  overlayClassName = 'bg-slate-100/70',
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    // Cached images may not fire onLoad again; SVGs can report 0×0 natural size.
    if (img.complete) {
      setStatus('ready')
    } else {
      setStatus('loading')
    }
  }, [src])

  return (
    <div className={`relative ${className}`}>
      {status === 'loading' && (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center ${overlayClassName}`}
        >
          <CrossSpinner size={spinnerSize} />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('ready')}
        className={`${imgClassName} transition-opacity duration-500 ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
