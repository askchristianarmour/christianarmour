import { useEffect, useRef, useState } from 'react'
import { CrossSpinner } from '../CrossLoader'

export function AuthHeroPanel() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) setReady(true)
  }, [])

  return (
    <aside className="relative hidden min-h-0 w-full flex-1 basis-1/2 overflow-hidden bg-[#1c2b3a] lg:block">
      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1c2b3a]">
          <CrossSpinner size="md" />
        </div>
      )}

      <img
        ref={imgRef}
        src="/signin/backroundleft.svg"
        alt=""
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
        aria-hidden
      />

      {/* Bottom-left copy — Figma alignment */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-12 pt-28 xl:px-12 xl:pb-14">
        <div className="max-w-lg text-left">
          <h2 className="font-serif text-[2rem] font-bold leading-[1.15] tracking-tight text-white xl:text-[2.5rem]">
            Equipping Believers.
            <br />
            Standing for Truth.
          </h2>

          <div className="mt-4 h-1 w-20 bg-[#D4AF37]" aria-hidden />

          <p className="mt-4 max-w-md font-sans text-[15px] font-normal leading-6 text-white/90 xl:text-base">
            Strength in faith. Armour for life. Truth that endures.
          </p>
        </div>
      </div>
    </aside>
  )
}
