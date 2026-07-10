import { ChevronDown } from 'lucide-react'
import { CrossSpinner } from './CrossLoader'

type Props = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  loadedCount: number
}

export function ArticlesPagination({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  loadedCount,
}: Props) {
  if (!hasNextPage) return null

  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10">
      <p className="text-xs text-slate-500 sm:text-sm">
        Showing {loadedCount} article{loadedCount === 1 ? '' : 's'}
      </p>
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isFetchingNextPage}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFetchingNextPage ? (
          <>
            <CrossSpinner size="xs" />
            Loading...
          </>
        ) : (
          <>
            Load more articles
            <ChevronDown size={16} className="text-slate-500" />
          </>
        )}
      </button>
    </div>
  )
}
