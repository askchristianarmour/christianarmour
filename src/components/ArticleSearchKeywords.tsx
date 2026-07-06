import { X } from 'lucide-react'
import { useMemo } from 'react'
import { getRelatedSearchKeywords, POPULAR_ARTICLE_SEARCHES } from '../lib/article-search'

type Props = {
  activeSearch?: string | null
  onSelect: (keyword: string) => void
  onClear?: () => void
}

export function ArticleSearchKeywords({ activeSearch, onSelect, onClear }: Props) {
  const keywords = useMemo(() => {
    if (activeSearch?.trim()) {
      return getRelatedSearchKeywords(activeSearch)
    }
    return [...POPULAR_ARTICLE_SEARCHES]
  }, [activeSearch])

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      {activeSearch?.trim() ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Searching for</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1f2f3d] px-3 py-1.5 text-sm font-semibold text-white">
            {activeSearch}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full p-0.5 transition-colors hover:bg-white/15"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </span>
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-800">Popular search topics</p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {activeSearch?.trim()
          ? 'Try a related keyword to find more articles.'
          : 'Select a topic to search articles across Christian Armour.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.map((keyword) => {
          const isActive = keyword.toLowerCase() === activeSearch?.trim().toLowerCase()

          return (
            <button
              key={keyword}
              type="button"
              onClick={() => onSelect(keyword)}
              disabled={isActive}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'cursor-default bg-[#1f2f3d] text-white'
                  : 'bg-[#faf5e8] text-[#a8863d] hover:bg-[#f3e8c8] hover:text-[#8a6d2b]'
              }`}
            >
              {keyword}
            </button>
          )
        })}
      </div>
    </div>
  )
}
