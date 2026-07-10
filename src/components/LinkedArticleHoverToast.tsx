import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Link2, Search } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CrossSpinner } from './CrossLoader'
import { fetchPostSummariesByIds } from '../lib/posts'
import { getTagBySlug } from '../lib/tags'

export type LinkedHoverTarget = {
  articleIds: string[]
  keyword: string | null
  rect: DOMRect
}

type Props = {
  target: LinkedHoverTarget | null
}

export function LinkedArticleHoverToast({ target }: Props) {
  const toastRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const articleIds = target?.articleIds ?? []
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['linked-article-hover', articleIds.join(',')],
    queryFn: () => fetchPostSummariesByIds(articleIds),
    enabled: articleIds.length > 0,
    staleTime: 60_000,
  })

  useLayoutEffect(() => {
    if (!target || !toastRef.current) {
      setCoords(null)
      return
    }

    const toast = toastRef.current
    const { width, height } = toast.getBoundingClientRect()
    const gap = 10
    const padding = 12

    let left = target.rect.left + target.rect.width / 2 - width / 2
    left = Math.max(padding, Math.min(left, window.innerWidth - width - padding))

    let top = target.rect.top - height - gap
    if (top < padding) {
      top = target.rect.bottom + gap
    }

    setCoords({ top, left })
  }, [target, articles, isLoading])

  useEffect(() => {
    if (!target) return
    const onScroll = () => setCoords(null)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [target])

  if (!target) return null

  const single = articles[0]
  const tag = single?.tag ? getTagBySlug(single.tag) : null
  const hasArticleIds = articleIds.length > 0

  return (
    <div
      ref={toastRef}
      role="tooltip"
      className={`pointer-events-none fixed z-[90] w-[min(320px,calc(100vw-24px))] rounded-2xl border border-[#e8dfc8] bg-[#1D2B34] px-3.5 py-3 text-white shadow-[0_16px_40px_rgba(29,43,52,0.35)] transition-opacity duration-150 ${
        coords ? 'opacity-100' : 'opacity-0'
      }`}
      style={
        coords
          ? { top: coords.top, left: coords.left }
          : { top: -9999, left: -9999 }
      }
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
        {hasArticleIds ? <Link2 size={11} /> : <Search size={11} />}
        {hasArticleIds
          ? articleIds.length === 1
            ? 'Linked article'
            : `${articleIds.length} linked articles`
          : 'Related search'}
      </div>

      {hasArticleIds ? (
        isLoading ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
            <CrossSpinner size="xs" />
            Loading…
          </div>
        ) : articleIds.length === 1 && single ? (
          <div className="mt-2">
            {tag && (
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]/90">
                {tag.title}
              </p>
            )}
            <p className="mt-1 font-serif text-[1.05rem] leading-snug text-white">
              {single.title}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-white/55">
              Click to open
              <ArrowUpRight size={12} />
            </p>
          </div>
        ) : articles.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {articles.slice(0, 3).map((article) => (
              <p key={article.id} className="truncate font-serif text-sm leading-snug text-white/95">
                {article.title}
              </p>
            ))}
            {articles.length > 3 && (
              <p className="text-[11px] text-white/50">+{articles.length - 3} more</p>
            )}
            <p className="pt-1 text-[11px] font-medium text-white/55">Click to choose</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-white/70">Linked articles unavailable</p>
        )
      ) : (
        <div className="mt-2">
          <p className="font-serif text-[1.05rem] leading-snug text-white">
            {target.keyword?.trim() || 'Related articles'}
          </p>
          <p className="mt-2 text-[11px] font-medium text-white/55">Click to search articles</p>
        </div>
      )}
    </div>
  )
}
