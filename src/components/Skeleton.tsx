type SkeletonProps = {
  className?: string
}

/** Thin professional shimmer bar. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-200/70 ${className}`}
      aria-hidden
    >
      <div className="skeleton-shimmer absolute inset-0" />
    </div>
  )
}

export function HomePageSkeleton() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-white" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading home page…</span>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="px-4 pb-10 pt-5 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8 lg:pb-20">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-8 w-11/12 max-w-md sm:h-12" />
            <Skeleton className="mt-2 h-8 w-9/12 max-w-sm sm:h-12" />
            <Skeleton className="mt-5 h-3 w-full max-w-xl" />
            <Skeleton className="mt-2 h-3 w-10/12 max-w-lg" />
            <div className="mt-5 flex gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="mt-5 h-10 w-32 rounded-lg" />
          </div>
          <div className="order-first min-h-[180px] sm:order-none sm:min-h-[220px] lg:min-h-[320px]">
            <Skeleton className="h-full min-h-[180px] w-full rounded-none sm:min-h-[220px]" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Category cards */}
        <div className="-mt-6 grid grid-cols-2 gap-2.5 sm:-mt-10 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[14px] border border-slate-100 bg-white p-3 sm:rounded-[26px] sm:p-6"
            >
              <Skeleton className="h-8 w-8 rounded-lg sm:h-12 sm:w-12" />
              <Skeleton className="mt-3 h-5 w-24 sm:mt-5 sm:h-7 sm:w-32" />
              <Skeleton className="mt-2 h-2.5 w-full" />
              <Skeleton className="mt-1.5 h-2.5 w-4/5" />
              <div className="mt-3 flex items-center justify-between sm:mt-5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-7 w-7 rounded-full sm:h-9 sm:w-9" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent articles */}
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Browse by book strip */}
        <div className="mt-14 rounded-none bg-[#1D2B34] px-4 py-8 sm:px-6 sm:py-12">
          <Skeleton className="h-2.5 w-28 bg-white/15" />
          <Skeleton className="mt-4 h-8 w-72 max-w-full bg-white/15" />
          <Skeleton className="mt-3 h-2.5 w-full max-w-md bg-white/10" />
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md bg-white/10 sm:h-[88px] sm:w-[180px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-slate-100 bg-white sm:rounded-[24px]">
      <Skeleton className="aspect-[16/10] w-full rounded-none sm:aspect-[16/9]" />
      <div className="p-3 sm:p-6">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="mt-3 h-5 w-11/12 sm:h-7" />
        <Skeleton className="mt-2 hidden h-2.5 w-full sm:block" />
        <Skeleton className="mt-1.5 hidden h-2.5 w-4/5 sm:block" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <div className="mt-4 flex gap-2 border-t border-slate-50 pt-4">
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ArticlesPageSkeleton() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-white" aria-busy="true">
      <span className="sr-only">Loading articles…</span>

      <section className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[#1f2f3d] sm:h-[300px]">
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Skeleton className="mx-auto h-10 w-40 bg-white/15 sm:h-12 sm:w-52" />
          <Skeleton className="mx-auto mt-4 h-2.5 w-full max-w-md bg-white/10" />
          <Skeleton className="mx-auto mt-2 h-2.5 w-4/5 max-w-sm bg-white/10" />
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid items-start gap-4 sm:gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="hidden rounded-[20px] border border-slate-100 bg-white p-5 lg:block">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
            <Skeleton className="mt-6 h-3 w-20" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="mt-6 h-3 w-28" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
            <Skeleton className="mt-4 h-14 w-full rounded-[20px]" />
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[12.21px] xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArticleDetailSkeleton() {
  return (
    <div className="w-full bg-white" aria-busy="true">
      <span className="sr-only">Loading article…</span>
      <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 aspect-[16/10] w-full rounded-[14px] sm:aspect-[16/9] sm:min-h-[340px] sm:rounded-[20px]" />
        <div className="mt-5 max-w-3xl sm:mt-8">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-3 h-8 w-11/12 sm:h-12" />
          <Skeleton className="mt-2 h-8 w-8/12 sm:h-12" />
          <div className="mt-4 flex gap-4">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <div className="mt-8 space-y-3 rounded-[4px] border border-[#e8dfc8]/80 bg-[#fdfbf7] p-6 sm:p-8">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={`h-2.5 ${i % 3 === 2 ? 'w-4/5' : 'w-full'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
