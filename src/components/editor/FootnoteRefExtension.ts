import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnoteRef: {
      setFootnoteRef: (attrs: { footnoteId: string; number: number }) => ReturnType
      unsetFootnoteRef: () => ReturnType
    }
  }
}

/**
 * Wraps the selected word/phrase as the footnote link.
 * A blue superscript number is shown after the text via CSS (::after).
 */
export const FootnoteRef = Mark.create({
  name: 'footnoteRef',
  inclusive: false,
  excludes: '',

  addAttributes() {
    return {
      footnoteId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-footnote-id'),
        renderHTML: (attributes) => {
          if (!attributes.footnoteId) return {}
          return { 'data-footnote-id': attributes.footnoteId }
        },
      },
      number: {
        default: 1,
        parseHTML: (element) => {
          const raw =
            element.getAttribute('data-footnote-number') ||
            element.querySelector?.('sup')?.textContent ||
            '1'
          const parsed = Number.parseInt(String(raw).trim(), 10)
          return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
        },
        renderHTML: (attributes) => ({
          'data-footnote-number': String(attributes.number ?? 1),
        }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'span.footnote-ref' },
      { tag: 'span[data-footnote-id]' },
      // Legacy: bare superscript citations from the earlier implementation
      {
        tag: 'sup.footnote-ref',
        getAttrs: (el) => {
          const element = el as HTMLElement
          return {
            footnoteId: element.getAttribute('data-footnote-id'),
            number: Number.parseInt(
              element.getAttribute('data-footnote-number') || element.textContent || '1',
              10
            ) || 1,
          }
        },
      },
    ]
  },

  renderHTML({ mark, HTMLAttributes }) {
    const footnoteId = mark.attrs.footnoteId as string | null
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'footnote-ref footnote-ref-text',
        id: footnoteId ? `fnref-${footnoteId}` : undefined,
        title: 'Go to footnote',
        role: 'link',
        tabindex: '0',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setFootnoteRef:
        (attrs) =>
        ({ state, commands }) => {
          if (!attrs.footnoteId) return false
          const { empty } = state.selection
          if (empty) return false
          return commands.setMark(this.name, {
            footnoteId: attrs.footnoteId,
            number: attrs.number,
          })
        },
      unsetFootnoteRef:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
