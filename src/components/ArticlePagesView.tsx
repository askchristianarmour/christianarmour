import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRefTagger } from '../hooks/useRefTagger'
import {
  buildArticlesSearchUrl,
  isHtmlContent,
  sanitizeArticleHtml,
} from '../lib/article-content'
import { parseArticleContent, type ArticlePage } from '../lib/article-structure'

type Props = {
  content: string
  className?: string
  showPageNav?: boolean
}

function PageBody({ body, onKeywordClick }: { body: string; onKeywordClick: (keyword: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[data-keyword]')
      if (!target) return

      if ((event.target as HTMLElement).closest('.rtBibleRef')) return

      event.preventDefault()
      const keyword = target.getAttribute('data-keyword')
      if (!keyword) return

      onKeywordClick(keyword)
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [body, onKeywordClick])

  if (!isHtmlContent(body)) {
    return (
      <div className="whitespace-pre-line text-base leading-8 text-slate-600">{body}</div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="article-content text-base leading-8 text-slate-600"
      dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(body) }}
    />
  )
}

function ArticlePagePanel({
  page,
  index,
  onKeywordClick,
  inert = false,
}: {
  page: ArticlePage
  index: number
  onKeywordClick: (keyword: string) => void
  inert?: boolean
}) {
  return (
    <section
      id={inert ? undefined : `article-page-${page.id}`}
      className="article-page-section"
      aria-hidden={inert || undefined}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#1f2f3d] px-2 text-xs font-bold text-white">
          {index + 1}
        </span>
        <h2 className="font-serif text-2xl text-slate-900">{page.label || `Page ${index + 1}`}</h2>
      </div>

      {page.description.trim() && (
        <p className="article-page-description mt-3 text-base leading-7 text-slate-500">
          {page.description}
        </p>
      )}

      {getPlainBody(page.body) && (
        <div className="mt-5">
          <PageBody body={page.body} onKeywordClick={onKeywordClick} />
        </div>
      )}

      {page.biblePassages.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a8863d]">
            <BookOpen size={14} />
            Scripture
          </div>
          {page.biblePassages.map((passage) => {
            if (!passage.reference.trim() && !passage.text.trim()) return null

            return (
              <blockquote
                key={passage.id}
                className="article-bible-passage rounded-2xl border border-[#e8dfc8] bg-[#faf8f4] py-4 pl-6 pr-5"
              >
                {passage.text.trim() && (
                  <p className="font-serif text-lg italic leading-8 text-slate-700">
                    &ldquo;{passage.text.trim()}&rdquo;
                  </p>
                )}
                {(passage.reference.trim() || passage.translation?.trim()) && (
                  <cite className="mt-3 block text-sm font-semibold not-italic text-[#8a6d2b]">
                    {passage.reference.trim()}
                    {passage.translation?.trim() ? ` (${passage.translation.trim()})` : ''}
                  </cite>
                )}
              </blockquote>
            )
          })}
        </div>
      )}
    </section>
  )
}

function BookPageSkeleton() {
  return (
    <div className="book-page-skeleton pointer-events-none absolute inset-0 overflow-hidden rounded-[4px] border border-[#e8dfc8]/70 bg-[#f7f3ea] px-6 py-7 sm:px-8 sm:py-8" aria-hidden>
      <div className="mb-6 h-3 w-28 rounded-full bg-[#e4d9c4]" />
      <div className="space-y-3">
        {Array.from({ length: 11 }).map((_, index) => (
          <div
            key={index}
            className="h-2.5 rounded-full bg-[#e8dfc8]/90"
            style={{ width: `${72 + ((index * 17) % 28)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function pageIndexFromHash(pages: ArticlePage[]) {
  if (typeof window === 'undefined') return 0
  const hash = window.location.hash
  const match = hash.match(/^#article-page-(.+)$/)
  if (!match) return 0
  const index = pages.findIndex((page) => page.id === match[1])
  return index >= 0 ? index : 0
}

export function ArticlePagesView({ content, className = '', showPageNav = true }: Props) {
  const navigate = useNavigate()
  const structured = parseArticleContent(content)
  const pages = structured.pages
  const [pageIndex, setPageIndex] = useState(() => pageIndexFromHash(pages))
  const [turningLeaf, setTurningLeaf] = useState<{
    page: ArticlePage
    index: number
    direction: 'next' | 'prev'
  } | null>(null)
  const [isTurning, setIsTurning] = useState(false)
  const bookRef = useRef<HTMLDivElement>(null)
  const turnTimerRef = useRef<number | null>(null)
  const swipeRef = useRef<{ x: number; y: number; pointerId: number } | null>(null)

  useRefTagger([content, pageIndex, turningLeaf?.page.id])

  useEffect(() => {
    setPageIndex(pageIndexFromHash(parseArticleContent(content).pages))
  }, [content])

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) window.clearTimeout(turnTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const nextPages = parseArticleContent(content).pages
      setPageIndex(pageIndexFromHash(nextPages))
      setTurningLeaf(null)
      setIsTurning(false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [content])

  const handleKeywordClick = (keyword: string) => {
    navigate(buildArticlesSearchUrl(keyword))
  }

  const goToPage = (nextIndex: number, direction: 'next' | 'prev') => {
    if (nextIndex < 0 || nextIndex >= pages.length || nextIndex === pageIndex || isTurning) return

    const outgoing = pages[pageIndex]
    if (!outgoing) return

    setTurningLeaf({ page: outgoing, index: pageIndex, direction })
    setIsTurning(true)
    setPageIndex(nextIndex)

    const page = pages[nextIndex]
    if (page) {
      window.history.replaceState(null, '', `#article-page-${page.id}`)
    }

    if (turnTimerRef.current) window.clearTimeout(turnTimerRef.current)
    turnTimerRef.current = window.setTimeout(() => {
      setTurningLeaf(null)
      setIsTurning(false)
    }, 1100)

    window.requestAnimationFrame(() => {
      bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSwipeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pages.length <= 1 || isTurning) return
    if ((event.target as HTMLElement).closest('button, a, input, textarea, [contenteditable="true"]')) {
      return
    }

    swipeRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
  }

  const handleSwipeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || start.pointerId !== event.pointerId) return
    if (pages.length <= 1 || isTurning) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    // Long horizontal swipe only (ignore mostly-vertical scrolls)
    if (absX < 96 || absX < absY * 1.35) return

    if (dx < 0) {
      goToPage(pageIndex + 1, 'next')
      return
    }
    goToPage(pageIndex - 1, 'prev')
  }

  const handleSwipeCancel = () => {
    swipeRef.current = null
  }

  const currentPage = pages[pageIndex] ?? pages[0]
  const hasMultiplePages = pages.length > 1
  const isFirst = pageIndex <= 0
  const isLast = pageIndex >= pages.length - 1

  if (!currentPage) return null

  return (
    <div
      className={`${className} touch-pan-y`}
      onPointerDown={handleSwipeStart}
      onPointerUp={handleSwipeEnd}
      onPointerCancel={handleSwipeCancel}
    >      {showPageNav && hasMultiplePages && (
        <nav
          aria-label="Article pages"
          className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-[#e8dfc8] bg-[#faf5e8]/70 p-3"
        >
          {pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              onClick={() => goToPage(index, index > pageIndex ? 'next' : 'prev')}
              disabled={isTurning}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                index === pageIndex
                  ? 'border-[#c6a14d] bg-[#1f2f3d] text-white'
                  : 'border-[#d9c48a]/60 bg-white text-[#8a6d2b] hover:border-[#c6a14d] hover:text-[#5c4718]'
              }`}
            >
              {page.label || `Page ${index + 1}`}
            </button>
          ))}
        </nav>
      )}

      <div
        ref={bookRef}
        className="book-spread scroll-mt-28 [perspective:2600px]"
      >
        <div className="book-shell relative px-1 sm:px-2">
          <div className="pointer-events-none absolute inset-y-2 -left-0.5 w-3.5 rounded-l-sm bg-gradient-to-b from-[#d4af37]/45 via-[#8a6d2b]/65 to-[#d4af37]/45 shadow-[2px_0_8px_rgba(28,43,58,0.15)]" aria-hidden />
          <div
            className="pointer-events-none absolute inset-x-2 bottom-0 top-1 -z-10 translate-y-1.5 rounded-[4px] border border-[#e8dfc8]/80 bg-[#f5f0e6] shadow-[0_16px_32px_rgba(28,43,58,0.12)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-4 bottom-0 top-2 -z-20 translate-y-3 rounded-[4px] border border-[#e8dfc8]/60 bg-[#efe8da]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-6 bottom-0 top-3 -z-30 translate-y-4.5 rounded-[4px] bg-[#e8dfc8]/70"
            aria-hidden
          />

          <div className="book-stage relative min-h-[280px]">
            <BookPageSkeleton />

            <div
              key={currentPage.id}
              className={`book-page relative z-10 rounded-[4px] border border-[#e8dfc8] bg-[#fdfbf7] px-6 py-7 shadow-[0_10px_30px_rgba(28,43,58,0.08)] sm:px-8 sm:py-8 ${
                turningLeaf ? 'book-page-reveal' : ''
              }`}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/[0.07] via-black/[0.02] to-transparent"
                aria-hidden
              />
              <ArticlePagePanel
                page={currentPage}
                index={pageIndex}
                onKeywordClick={handleKeywordClick}
              />
            </div>

            {turningLeaf && (
              <div
                className={`book-page book-page-leaf absolute inset-0 z-20 overflow-hidden rounded-[4px] border border-[#e8dfc8] bg-[#fdfbf7] px-6 py-7 shadow-[0_10px_30px_rgba(28,43,58,0.08)] sm:px-8 sm:py-8 [transform-style:preserve-3d] ${
                  turningLeaf.direction === 'next'
                    ? 'origin-left book-page-flip-away-next'
                    : 'origin-right book-page-flip-away-prev'
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/[0.07] via-black/[0.02] to-transparent"
                  aria-hidden
                />
                <div className="book-page-sheen pointer-events-none absolute inset-0" aria-hidden />
                <div className="book-page-backface pointer-events-none absolute inset-0" aria-hidden />
                <ArticlePagePanel
                  page={turningLeaf.page}
                  index={turningLeaf.index}
                  onKeywordClick={handleKeywordClick}
                  inert
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {hasMultiplePages && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToPage(pageIndex - 1, 'prev')}
            disabled={isFirst || isTurning}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <p className="text-sm font-medium text-slate-500">
            Page {pageIndex + 1} of {pages.length}
          </p>

          <button
            type="button"
            onClick={() => goToPage(pageIndex + 1, 'next')}
            disabled={isLast || isTurning}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#182633] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next page
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function getPlainBody(body: string) {
  if (!body?.trim() || body === '<p></p>') return false
  if (!isHtmlContent(body)) return body.trim().length > 0
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 0
}
