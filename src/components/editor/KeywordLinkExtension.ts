import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    keywordLink: {
      setKeywordLink: (keyword: string) => ReturnType
      unsetKeywordLink: () => ReturnType
    }
  }
}

export const KeywordLink = Mark.create({
  name: 'keywordLink',
  inclusive: false,
  addAttributes() {
    return {
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
    return [{ tag: 'span[data-keyword]' }]
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
        (keyword: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { keyword }),
      unsetKeywordLink:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
