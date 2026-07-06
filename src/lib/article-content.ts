import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'span']
const ALLOWED_ATTR = ['data-keyword', 'class']

export function isHtmlContent(content: string) {
  return /<[a-z][\s\S]*>/i.test(content)
}

export function getPlainTextFromContent(content: string) {
  if (!content) return ''
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
