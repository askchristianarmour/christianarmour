import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildArticlesSearchUrl,
  isHtmlContent,
  sanitizeArticleHtml,
} from '../lib/article-content'

type Props = {
  content: string
  className?: string
}

export function ArticleContent({ content, className = '' }: Props) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[data-keyword]')
      if (!target) return

      event.preventDefault()
      const keyword = target.getAttribute('data-keyword')
      if (!keyword) return

      navigate(buildArticlesSearchUrl(keyword))
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [navigate, content])

  if (!isHtmlContent(content)) {
    return (
      <div className={`whitespace-pre-line text-base leading-8 text-slate-600 ${className}`}>
        {content}
      </div>
    )
  }

  const safeHtml = sanitizeArticleHtml(content)

  return (
    <div
      ref={containerRef}
      className={`article-content text-base leading-8 text-slate-600 ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
