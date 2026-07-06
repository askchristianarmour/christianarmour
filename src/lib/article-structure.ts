import { getPlainTextFromContent } from './article-content'

export const ARTICLE_CONTENT_PREFIX = '<!--ca-article-v2-->'
export const ARTICLE_CONTENT_VERSION = 2 as const

export type BiblePassage = {
  id: string
  reference: string
  text: string
  translation?: string
}

export type ArticlePage = {
  id: string
  label: string
  description: string
  body: string
  biblePassages: BiblePassage[]
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

export function createArticlePage(pageNumber: number): ArticlePage {
  return {
    id: newId(),
    label: `Page ${pageNumber}`,
    description: '',
    body: '<p></p>',
    biblePassages: [],
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

      return [page.label, page.description, getPlainTextFromContent(page.body), passageText]
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
      page.biblePassages.some((passage) => passage.reference.trim() || passage.text.trim())
  )
}

export function reindexPageLabels(pages: ArticlePage[]): ArticlePage[] {
  return pages.map((page, index) => ({
    ...page,
    label: page.label.trim() || `Page ${index + 1}`,
  }))
}
