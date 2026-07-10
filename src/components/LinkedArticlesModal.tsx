import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, BookOpen, Link2, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CrossSpinner } from './CrossLoader'
import { buildArticlePath } from '../lib/article-content'
import { fetchPostSummariesByIds, type PostSummary } from '../lib/posts'
import { getTagBySlug } from '../lib/tags'

type Props = {
  articleIds: string[]
  onClose: () => void
}

export function LinkedArticlesModal({ articleIds, onClose }: Props) {
  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ['linked-article-summaries', articleIds.join(',')],
    queryFn: () => fetchPostSummariesByIds(articleIds),
    enabled: articleIds.length > 0,
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#1D2B34]/55 backdrop-blur-[2px] transition-opacity"
        aria-label="Close linked articles"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="linked-articles-title"
        className="linked-articles-sheet relative flex max-h-[88vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[28px] bg-[#fdfbf7] shadow-[0_24px_80px_rgba(29,43,52,0.28)] sm:rounded-[28px]"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300/80 sm:hidden" aria-hidden />

        <div className="relative overflow-hidden border-b border-[#e8dfc8]/80 px-5 pb-5 pt-4 sm:px-6 sm:pt-6">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#D4AF37]/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-[#1f2f3d]/[0.04]"
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8dfc8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a6d2b]">
                <Link2 size={12} />
                Cross references
              </div>
              <h2
                id="linked-articles-title"
                className="mt-3 font-serif text-[1.65rem] leading-none text-[#1D2B34]"
              >
                Linked articles
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Continue reading with the articles connected to this passage.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-800"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {!isLoading && !error && articles.length > 0 && (
            <p className="relative mt-4 text-xs font-medium text-slate-400">
              {articles.length} article{articles.length === 1 ? '' : 's'} available
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-sm text-slate-500">
              <CrossSpinner size="sm" />
              Gathering linked articles…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-red-700">Could not load linked articles.</p>
              <p className="mt-1 text-xs text-red-500">Please try again in a moment.</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e8dfc8] bg-white/70 px-4 py-10 text-center">
              <BookOpen className="mx-auto text-[#c6a14d]" size={28} strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-slate-700">No articles available</p>
              <p className="mt-1 text-xs text-slate-500">
                Those linked articles may have been removed.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {articles.map((article, index) => (
                <li key={article.id}>
                  <LinkedArticleRow article={article} index={index} onNavigate={onClose} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function LinkedArticleRow({
  article,
  index,
  onNavigate,
}: {
  article: PostSummary
  index: number
  onNavigate: () => void
}) {
  const tag = article.tag ? getTagBySlug(article.tag) : null
  const date = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      to={buildArticlePath(article.id)}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-2xl border border-[#e8dfc8]/90 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(29,43,52,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-[0_10px_28px_rgba(29,43,52,0.08)]"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1f2f3d] font-serif text-sm font-semibold text-[#D4AF37] transition-colors group-hover:bg-[#182633]">
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="min-w-0 flex-1">
        {tag && (
          <span className="font-sans text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">
            {tag.title}
          </span>
        )}
        <span className="mt-1 block font-serif text-[1.05rem] leading-snug text-[#1D2B34] transition-colors group-hover:text-[#15222a]">
          {article.title}
        </span>
        <span className="mt-1.5 block text-xs text-slate-500">{date}</span>
      </span>

      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#faf8f4] text-slate-500 transition-all group-hover:border-[#D4AF37]/40 group-hover:bg-[#faf5e8] group-hover:text-[#8a6d2b]">
        <ArrowUpRight size={15} />
      </span>
    </Link>
  )
}
