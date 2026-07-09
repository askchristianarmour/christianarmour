import { BookOpen } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRefTagger } from '../hooks/useRefTagger'
import {
  buildArticlesSearchUrl,
  isHtmlContent,
  sanitizeArticleHtml,
} from '../lib/article-content'
import { parseArticleContent } from '../lib/article-structure'

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

      // Don't intercept Reftagger Bible reference clicks
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

export function ArticlePagesView({ content, className = '', showPageNav = true }: Props) {
  const navigate = useNavigate()
  const structured = parseArticleContent(content)
  const pages = structured.pages

  useRefTagger([content])

  const handleKeywordClick = (keyword: string) => {
    navigate(buildArticlesSearchUrl(keyword))
  }

  return (
    <div className={className}>
      {showPageNav && pages.length > 1 && (
        <nav
          aria-label="Article pages"
          className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-[#e8dfc8] bg-[#faf5e8]/70 p-3"
        >
          {pages.map((page, index) => (
            <a
              key={page.id}
              href={`#article-page-${page.id}`}
              className="rounded-full border border-[#d9c48a]/60 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#8a6d2b] transition-colors hover:border-[#c6a14d] hover:text-[#5c4718]"
            >
              {page.label || `Page ${index + 1}`}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-10">
        {pages.map((page, index) => (
          <section
            key={page.id}
            id={`article-page-${page.id}`}
            className="article-page-section scroll-mt-28"
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
                <PageBody body={page.body} onKeywordClick={handleKeywordClick} />
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
        ))}
      </div>
    </div>
  )
}

function getPlainBody(body: string) {
  if (!body?.trim() || body === '<p></p>') return false
  if (!isHtmlContent(body)) return body.trim().length > 0
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 0
}
