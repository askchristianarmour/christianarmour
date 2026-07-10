import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
}: {
  page: ArticlePage
  index: number
  onKeywordClick: (keyword: string) => void
}) {
  return (
    <section id={`article-page-${page.id}`} className="article-page-section">
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
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev'>('next')
  const [turnKey, setTurnKey] = useState(0)
  const bookRef = useRef<HTMLDivElement>(null)

  useRefTagger([content, pageIndex])

  useEffect(() => {
    setPageIndex(pageIndexFromHash(parseArticleContent(content).pages))
  }, [content])

  useEffect(() => {
    const onHashChange = () => {
      const nextPages = parseArticleContent(content).pages
      setTurnDirection('next')
      setPageIndex(pageIndexFromHash(nextPages))
      setTurnKey((value) => value + 1)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [content])

  const handleKeywordClick = (keyword: string) => {
    navigate(buildArticlesSearchUrl(keyword))
  }

  const goToPage = (nextIndex: number, direction: 'next' | 'prev') => {
    if (nextIndex < 0 || nextIndex >= pages.length || nextIndex === pageIndex) return

    setTurnDirection(direction)
    setPageIndex(nextIndex)
    setTurnKey((value) => value + 1)

    const page = pages[nextIndex]
    if (page) {
      window.history.replaceState(null, '', `#article-page-${page.id}`)
    }

    window.requestAnimationFrame(() => {
      bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const currentPage = pages[pageIndex] ?? pages[0]
  const hasMultiplePages = pages.length > 1
  const isFirst = pageIndex <= 0
  const isLast = pageIndex >= pages.length - 1

  if (!currentPage) return null

  return (
    <div className={className}>
      {showPageNav && hasMultiplePages && (
        <nav
          aria-label="Article pages"
          className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-[#e8dfc8] bg-[#faf5e8]/70 p-3"
        >
          {pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              onClick={() => goToPage(index, index > pageIndex ? 'next' : 'prev')}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
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
        className="book-spread scroll-mt-28 [perspective:1400px]"
      >
        <div
          key={`${currentPage.id}-${turnKey}`}
          className={`book-page relative origin-left rounded-[4px] border border-[#e8dfc8] bg-[#fdfbf7] px-6 py-7 shadow-[0_10px_30px_rgba(28,43,58,0.08)] sm:px-8 sm:py-8 ${
            turnDirection === 'next' ? 'book-page-turn-next' : 'book-page-turn-prev'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/[0.04] to-transparent"
            aria-hidden
          />
          <ArticlePagePanel
            page={currentPage}
            index={pageIndex}
            onKeywordClick={handleKeywordClick}
          />
        </div>
      </div>

      {hasMultiplePages && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToPage(pageIndex - 1, 'prev')}
            disabled={isFirst}
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
            disabled={isLast}
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
