import type { ReactNode } from 'react'
import { AuthLoadedImage } from './AuthLoadedImage'

type Props = {
  children: ReactNode
}

/** Form column with soft holistic / faith graphics behind the content. */
export function AuthFormPanel({ children }: Props) {
  return (
    <div className="relative flex min-h-0 w-full flex-1 basis-1/2 items-center justify-center overflow-hidden px-6 py-10 sm:px-10 lg:py-16">
      {/* Holistic background graphics */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#D4AF37]/[0.07] blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-[#1f2f3d]/[0.05] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D4AF37]/10" />
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1f2f3d]/[0.06]" />

        <img
          src="/signin/cross.svg"
          alt=""
          className="absolute left-1/2 top-[46%] h-56 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.04] sm:h-72"
        />

        <img
          src="/article/left_armour_imagehero.svg"
          alt=""
          className="absolute -left-6 bottom-0 h-[42%] max-h-72 w-auto opacity-[0.07] sm:-left-2 sm:opacity-[0.09]"
        />
        <img
          src="/article/right_armour_imagehero.svg"
          alt=""
          className="absolute -right-6 top-16 h-[38%] max-h-64 w-auto opacity-[0.07] sm:-right-2 sm:top-20 sm:opacity-[0.09]"
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1f2f3d]/10 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}

export function AuthFormLogo() {
  return (
    <AuthLoadedImage
      src="/signin/cross.svg"
      alt="Christian Armour"
      className="mx-auto flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20"
      imgClassName="mx-auto h-16 w-auto sm:h-20"
      spinnerSize="sm"
    />
  )
}
