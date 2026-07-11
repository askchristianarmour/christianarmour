import DOMPurify from 'dompurify'
import { getStructuredPlainText, isStructuredArticleContent, parseArticleContent } from './article-structure'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'span',
  'sup',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'colgroup',
  'col',
]
const ALLOWED_ATTR = [
  'data-keyword',
  'data-article-ids',
  'data-footnote-id',
  'data-footnote-number',
  'id',
  'class',
  'title',
  'colspan',
  'rowspan',
  'colwidth',
  'style',
]

export function isHtmlContent(content: string) {
  return /<[a-z][\s\S]*>/i.test(content)
}

export function getPlainTextFromContent(content: string) {
  if (!content) return ''
  if (isStructuredArticleContent(content)) {
    return getStructuredPlainText(parseArticleContent(content))
  }
  if (!isHtmlContent(content)) return content

  if (typeof window === 'undefined') {
    return content.replace(/<[^>]+>/g, ' ')
  }

  const doc = new DOMParser().parseFromString(content, 'text/html')
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

export function getExcerptFromContent(content: string, maxLength = 150) {
  const plain = getPlainTextFromContent(content)
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength - 3).trimEnd()}...`
}

export function getReadingMinutes(content: string) {
  const words = getPlainTextFromContent(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function sanitizeArticleHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

export function buildArticlesSearchUrl(keyword: string) {
  return `/articles?search=${encodeURIComponent(keyword.trim())}`
}

export function buildArticlePath(articleId: string) {
  return `/articles/${articleId}`
}

export function parseLinkedArticleIds(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}
