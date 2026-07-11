import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnoteRef: {
      insertFootnoteRef: (attrs: { footnoteId: string; number: number }) => ReturnType
    }
  }
}

export const FootnoteRef = Node.create({
  name: 'footnoteRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

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
            element.getAttribute('data-footnote-number') || element.textContent || '1'
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
    return [{ tag: 'sup.footnote-ref' }, { tag: 'sup[data-footnote-id]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const footnoteId = node.attrs.footnoteId as string | null
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        class: 'footnote-ref',
        id: footnoteId ? `fnref-${footnoteId}` : undefined,
        title: 'Go to footnote',
      }),
      String(node.attrs.number ?? 1),
    ]
  },

  addCommands() {
    return {
      insertFootnoteRef:
        (attrs) =>
        ({ commands }) => {
          if (!attrs.footnoteId) return false
          return commands.insertContent({
            type: this.name,
            attrs: {
              footnoteId: attrs.footnoteId,
              number: attrs.number,
            },
          })
        },
    }
  },
})
