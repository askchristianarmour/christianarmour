import { ARTICLE_TAGS, type ArticleTagSlug } from '../lib/tags'

export type ArticleFilter = 'all' | ArticleTagSlug

type Props = {
  active: ArticleFilter
  onChange: (filter: ArticleFilter) => void
  counts?: Partial<Record<ArticleFilter, number>>
}

export function ArticleTagTabs({ active, onChange, counts }: Props) {
  const tabs: { id: ArticleFilter; label: string }[] = [
    { id: 'all', label: 'All Articles' },
    ...ARTICLE_TAGS.map((tag) => ({ id: tag.slug, label: tag.title })),
  ]

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 sm:min-w-0">
        {tabs.map((tab) => {
          const selected = active === tab.id
          const count = counts?.[tab.id]

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                selected
                  ? 'bg-[#1f2f3d] text-white shadow-[0_4px_14px_rgba(31,47,61,0.2)]'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              {tab.label}
              {typeof count === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    selected ? 'bg-white/15 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
