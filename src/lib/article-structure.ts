import { getPlainTextFromContent } from './article-content'

export const ARTICLE_CONTENT_PREFIX = '<!--ca-article-v2-->'
export const ARTICLE_CONTENT_VERSION = 2 as const

export type BiblePassage = {
  id: string
  reference: string
  text: string
  translation?: string
}

export type ArticleFootnote = {
  id: string
  text: string
}

export type ArticlePage = {
  id: string
  label: string
  description: string
  body: string
  biblePassages: BiblePassage[]
  footnotes: ArticleFootnote[]
}

export type StructuredArticleContent = {
  version: typeof ARTICLE_CONTENT_VERSION
  pages: ArticlePage[]
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createBiblePassage(): BiblePassage {
  return { id: newId(), reference: '', text: '', translation: '' }
}

export function createArticleFootnote(text = ''): ArticleFootnote {
  return { id: newId(), text }
}

export function createArticlePage(pageNumber: number): ArticlePage {
  return {
    id: newId(),
    label: `Page ${pageNumber}`,
    description: '',
    body: '<p></p>',
    biblePassages: [],
    footnotes: [],
  }
}

export function createDefaultArticleContent(): StructuredArticleContent {
  return {
    version: ARTICLE_CONTENT_VERSION,
    pages: [createArticlePage(1)],
  }
}

export function serializeArticleContent(content: StructuredArticleContent): string {
  return `${ARTICLE_CONTENT_PREFIX}${JSON.stringify(content)}`
}

export function isStructuredArticleContent(raw: string): boolean {
  return raw.startsWith(ARTICLE_CONTENT_PREFIX)
}

export function parseArticleContent(raw: string): StructuredArticleContent {
  if (!raw?.trim()) {
    return createDefaultArticleContent()
  }

  if (isStructuredArticleContent(raw)) {
    try {
      const parsed = JSON.parse(raw.slice(ARTICLE_CONTENT_PREFIX.length)) as StructuredArticleContent
      if (parsed?.version === ARTICLE_CONTENT_VERSION && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return {
          version: ARTICLE_CONTENT_VERSION,
          pages: parsed.pages.map((page, index) => ({
            id: page.id || newId(),
            label: page.label?.trim() || `Page ${index + 1}`,
            description: page.description ?? '',
            body: page.body || '<p></p>',
            biblePassages: (page.biblePassages ?? []).map((passage) => ({
              id: passage.id || newId(),
              reference: passage.reference ?? '',
              text: passage.text ?? '',
              translation: passage.translation ?? '',
            })),
            footnotes: (page.footnotes ?? []).map((footnote) => ({
              id: footnote.id || newId(),
              text: footnote.text ?? '',
            })),
          })),
        }
      }
    } catch {
      // Fall through to legacy wrapper below.
    }
  }

  return {
    version: ARTICLE_CONTENT_VERSION,
    pages: [
      {
        id: newId(),
        label: 'Page 1',
        description: '',
        body: raw,
        biblePassages: [],
        footnotes: [],
      },
    ],
  }
}

export function getStructuredPlainText(content: StructuredArticleContent): string {
  return content.pages
    .map((page) => {
      const passageText = page.biblePassages
        .map((passage) => [passage.reference, passage.text, passage.translation].filter(Boolean).join(' '))
        .join(' ')
      const footnoteText = page.footnotes.map((footnote) => footnote.text).filter(Boolean).join(' ')

      return [page.label, page.description, getPlainTextFromContent(page.body), passageText, footnoteText]
        .filter(Boolean)
        .join(' ')
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasArticleBody(raw: string): boolean {
  const structured = parseArticleContent(raw)
  return structured.pages.some(
    (page) =>
      getPlainTextFromContent(page.body).trim().length > 0 ||
      page.biblePassages.some((passage) => passage.reference.trim() || passage.text.trim()) ||
      page.footnotes.some((footnote) => footnote.text.trim())
  )
}

/** Keep superscript numbers in sync with the footnotes list order. */
export function renumberFootnoteRefsInHtml(html: string, footnotes: ArticleFootnote[]): string {
  if (!html?.trim() || typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const byId = new Map(footnotes.map((footnote, index) => [footnote.id, index + 1]))

  doc.querySelectorAll('[data-footnote-id]').forEach((element) => {
    const id = element.getAttribute('data-footnote-id')
    if (!id) return
    const number = byId.get(id)
    if (!number) {
      // Unwrap linked text; remove legacy bare <sup> markers.
      if (element.tagName === 'SUP') {
        element.remove()
        return
      }
      const parent = element.parentNode
      if (!parent) return
      while (element.firstChild) parent.insertBefore(element.firstChild, element)
      parent.removeChild(element)
      return
    }
    element.setAttribute('data-footnote-number', String(number))
    element.id = `fnref-${id}`
    element.classList.add('footnote-ref')
    if (element.tagName === 'SUP') {
      element.textContent = String(number)
    }
  })

  return doc.body.innerHTML
}

export function stripFootnoteRefFromHtml(html: string, footnoteId: string): string {
  if (!html?.trim() || typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll(`[data-footnote-id="${footnoteId}"]`).forEach((element) => {
    if (element.tagName === 'SUP') {
      element.remove()
      return
    }
    const parent = element.parentNode
    if (!parent) return
    while (element.firstChild) parent.insertBefore(element.firstChild, element)
    parent.removeChild(element)
  })
  return doc.body.innerHTML
}

export function reindexPageLabels(pages: ArticlePage[]): ArticlePage[] {
  return pages.map((page, index) => ({
    ...page,
    label: page.label.trim() || `Page ${index + 1}`,
  }))
}
