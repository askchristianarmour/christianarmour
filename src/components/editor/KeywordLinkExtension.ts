import { Mark, mergeAttributes } from '@tiptap/core'

export type ArticleLinkAttrs = {
  articleIds: string
  keyword: string | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    keywordLink: {
      setKeywordLink: (attrs: { articleIds: string[]; keyword?: string | null }) => ReturnType
      unsetKeywordLink: () => ReturnType
    }
  }
}

function normalizeArticleIds(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(String).map((id) => id.trim()).filter(Boolean).join(',')
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .join(',')
  }
  return ''
}

export function parseArticleIdsAttr(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

export const KeywordLink = Mark.create({
  name: 'keywordLink',
  inclusive: false,
  addAttributes() {
    return {
      articleIds: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-article-ids'),
        renderHTML: (attributes) => {
          const ids = normalizeArticleIds(attributes.articleIds)
          if (!ids) return {}
          return { 'data-article-ids': ids }
        },
      },
      keyword: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-keyword'),
        renderHTML: (attributes) => {
          if (!attributes.keyword) return {}
          return { 'data-keyword': attributes.keyword }
        },
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-article-ids]' }, { tag: 'span[data-keyword]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class:
          'keyword-link text-[#c6a14d] underline decoration-[#c6a14d]/50 underline-offset-[3px] cursor-pointer font-medium',
      }),
      0,
    ]
  },
  addCommands() {
    return {
      setKeywordLink:
        ({ articleIds, keyword = null }) =>
        ({ commands }) => {
          const ids = normalizeArticleIds(articleIds)
          if (!ids) return false
          return commands.setMark(this.name, {
            articleIds: ids,
            keyword: keyword?.trim() || null,
          })
        },
      unsetKeywordLink:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
