type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_MAP: Record<Size, { box: string; cross: string }> = {
  xs: { box: 'h-4 w-4', cross: 'h-2.5 w-2.5' },
  sm: { box: 'h-8 w-8', cross: 'h-4 w-4' },
  md: { box: 'h-12 w-12', cross: 'h-6 w-6' },
  lg: { box: 'h-16 w-16', cross: 'h-8 w-8' },
  xl: { box: 'h-24 w-24', cross: 'h-12 w-12' },
}

type CrossSpinnerProps = {
  size?: Size
  className?: string
}

export function CrossSpinner({ size = 'sm', className = '' }: CrossSpinnerProps) {
  const dimensions = SIZE_MAP[size]

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${dimensions.box} ${className}`}
      aria-hidden
    >
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#c6a14d]/20 border-t-[#c6a14d]" />
      <img src="/signin/cross.svg" alt="" className={`${dimensions.cross} relative z-10`} />
    </span>
  )
}

type CrossLoaderProps = {
  size?: Size
  label?: string
  className?: string
}

export function CrossLoader({ size = 'lg', label, className = '' }: CrossLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-center ${className}`}>
      <CrossSpinner size={size} />
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
    </div>
  )
}

type PageLoaderProps = {
  label?: string
  minHeightClassName?: string
}

export function PageLoader({
  label = 'Loading...',
  minHeightClassName = 'min-h-[50vh]',
}: PageLoaderProps) {
  return (
    <div className={`flex w-full items-center justify-center ${minHeightClassName}`}>
      <CrossLoader size="xl" label={label} />
    </div>
  )
}

type LoadingGridProps = {
  count?: number
  className?: string
}

export function LoadingGrid({ count = 3, className = '' }: LoadingGridProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="h-[380px] animate-pulse rounded-[28px] bg-slate-200/80" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <CrossLoader size="lg" />
      </div>
    </div>
  )
}
