import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Heading2,
  Unlink,
  Table as TableIcon,
  BetweenHorizonalStart,
  BetweenVerticalStart,
  Trash2,
  Rows3,
  Columns3,
  Superscript,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { ArticleLinkPickerModal } from './ArticleLinkPickerModal'
import { KeywordLink, parseArticleIdsAttr } from './KeywordLinkExtension'
import { FootnoteRef } from './FootnoteRefExtension'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeightClassName?: string
  excludePostId?: string | null
  /** Create a footnote entry and return its id + display number for the citation. */
  onCreateFootnote?: () => { id: string; number: number }
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your article...',
  minHeightClassName = 'min-h-[280px]',
  excludePostId = null,
  onCreateFootnote,
}: Props) {
  const { info: toastInfo } = useToast()
  const [selectedText, setSelectedText] = useState('')
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([])
  const [showArticlePicker, setShowArticlePicker] = useState(false)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      KeywordLink,
      FootnoteRef,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'article-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: `prose-editor px-4 py-3 text-sm leading-7 text-slate-700 outline-none ${minHeightClassName}`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [editor, value])

  const openArticlePicker = () => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selected = editor.state.doc.textBetween(from, to, ' ')
    if (!selected.trim()) {
      toastInfo('Select the word or phrase you want to link to articles.')
      return
    }

    const attrs = editor.getAttributes('keywordLink')
    savedSelectionRef.current = { from, to }
    setSelectedText(selected.trim())
    setInitialSelectedIds(parseArticleIdsAttr(attrs.articleIds))
    setShowArticlePicker(true)
  }

  const applyArticleLink = (articleIds: string[]) => {
    if (!editor || articleIds.length === 0) return
    const selection = savedSelectionRef.current
    const chain = editor.chain().focus()
    if (selection) {
      chain.setTextSelection(selection)
    }
    chain
      .setKeywordLink({
        articleIds,
        keyword: selectedText || null,
      })
      .run()
    savedSelectionRef.current = null
    setShowArticlePicker(false)
    setSelectedText('')
    setInitialSelectedIds([])
  }

  const insertFootnote = () => {
    if (!editor) return

    const { empty } = editor.state.selection
    if (empty) {
      toastInfo('Select the word or phrase that should become the footnote link.')
      return
    }

    let created = onCreateFootnote?.()
    if (!created?.id) {
      created = {
        id: crypto.randomUUID(),
        number: (editor.getHTML().match(/data-footnote-id/g)?.length ?? 0) + 1,
      }
    }

    const ok = editor
      .chain()
      .focus()
      .setFootnoteRef({ footnoteId: created.id, number: created.number })
      .run()

    if (!ok) {
      toastInfo('Could not add the footnote link. Select some text and try again.')
    }
  }

  if (!editor) return null

  const inTable = editor.isActive('table')

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 px-2 py-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Italic"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="Heading"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="Bullet list"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="Numbered list"
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={insertFootnote}
          active={false}
          label="Insert footnote"
          className="gap-1.5 px-3 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50"
        >
          <Superscript size={15} />
          Footnote
        </ToolbarButton>

        <span className="mx-1 h-6 w-px bg-slate-200" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          active={inTable}
          label="Insert table"
          className="gap-1.5 px-3 text-xs font-semibold"
        >
          <TableIcon size={15} />
          Table
        </ToolbarButton>

        {inTable && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              active={false}
              label="Add column"
            >
              <BetweenVerticalStart size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              active={false}
              label="Add row"
            >
              <BetweenHorizonalStart size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              active={false}
              label="Delete column"
            >
              <Columns3 size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              active={false}
              label="Delete row"
            >
              <Rows3 size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              active={false}
              label="Delete table"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </ToolbarButton>
          </>
        )}

        <span className="mx-1 h-6 w-px bg-slate-200" />

        <ToolbarButton
          onClick={openArticlePicker}
          active={editor.isActive('keywordLink')}
          label="Link to articles"
          className="gap-1.5 px-3 text-xs font-semibold text-[#a8863d]"
        >
          <Link2 size={15} />
          Link articles
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetKeywordLink().run()}
          active={false}
          label="Remove article link"
        >
          <Unlink size={16} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} data-placeholder={placeholder} />

      <ArticleLinkPickerModal
        open={showArticlePicker}
        selectedText={selectedText}
        initialSelectedIds={initialSelectedIds}
        excludePostId={excludePostId}
        onClose={() => {
          setShowArticlePicker(false)
          savedSelectionRef.current = null
        }}
        onApply={applyArticleLink}
      />
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex items-center rounded-lg px-2.5 py-2 transition-colors ${
        active ? 'bg-[#1f2f3d] text-white' : 'text-slate-600 hover:bg-white'
      } ${className}`}
    >
      {children}
    </button>
  )
}
