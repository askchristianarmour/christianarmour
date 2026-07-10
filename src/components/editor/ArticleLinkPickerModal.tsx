import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CrossSpinner } from '../CrossLoader'
import { getTagBySlug } from '../../lib/tags'
import { fetchPostSummaries, type PostSummary } from '../../lib/posts'

type Props = {
  open: boolean
  selectedText: string
  initialSelectedIds: string[]
  excludePostId?: string | null
  onClose: () => void
  onApply: (articleIds: string[]) => void
}

export function ArticleLinkPickerModal({
  open,
  selectedText,
  initialSelectedIds,
  excludePostId,
  onClose,
  onApply,
}: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)

  useEffect(() => {
    if (!open) return
    setSelectedIds(initialSelectedIds)
    setSearch('')
    setDebouncedSearch('')
  }, [open, initialSelectedIds])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data: articles = [], isLoading, isFetching } = useQuery({
    queryKey: ['post-summaries-picker', debouncedSearch, excludePostId ?? null],
    queryFn: () =>
      fetchPostSummaries(debouncedSearch, {
        limit: 40,
        excludeId: excludePostId,
      }),
    enabled: open,
  })

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const toggleArticle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close article picker"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Link to articles</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select one or more existing articles. Readers who click{' '}
              <span className="font-medium text-[#a8863d]">“{selectedText}”</span> will open only
              these linked articles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c6a14d]/50"
              autoFocus
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {selectedIds.length} article{selectedIds.length === 1 ? '' : 's'} selected
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <CrossSpinner size="xs" />
              Loading articles...
            </div>
          ) : articles.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-slate-500">
              No articles found{debouncedSearch ? ` for “${debouncedSearch}”` : ''}.
            </p>
          ) : (
            <ul className="space-y-1">
              {articles.map((article) => (
                <ArticlePickerRow
                  key={article.id}
                  article={article}
                  checked={selectedSet.has(article.id)}
                  onToggle={() => toggleArticle(article.id)}
                />
              ))}
            </ul>
          )}
          {isFetching && !isLoading && (
            <p className="px-3 py-2 text-center text-xs text-slate-400">Updating…</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => onApply(selectedIds)}
            className="rounded-lg bg-[#1f2f3d] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply link
          </button>
        </div>
      </div>
    </div>
  )
}

function ArticlePickerRow({
  article,
  checked,
  onToggle,
}: {
  article: PostSummary
  checked: boolean
  onToggle: () => void
}) {
  const tag = article.tag ? getTagBySlug(article.tag) : null
  const date = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-900">{article.title}</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {tag ? `${tag.title} · ` : ''}
            {date}
          </span>
        </span>
      </label>
    </li>
  )
}
