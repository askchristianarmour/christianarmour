import { useEffect, useRef, useState } from 'react'
import { CrossSpinner } from '../CrossLoader'

type Props = {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
  spinnerSize?: 'xs' | 'sm' | 'md'
}

/** Shows a spinner until the image finishes loading (or errors). */
export function AuthLoadedImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  spinnerSize = 'sm',
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    setStatus('loading')
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setStatus('loaded')
    }
  }, [src])

  return (
    <div className={`relative ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/70">
          <CrossSpinner size={spinnerSize} />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`${imgClassName} transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
