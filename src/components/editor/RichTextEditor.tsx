import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Heading2,
  Unlink,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { KeywordLink } from './KeywordLinkExtension'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeightClassName?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your article...',
  minHeightClassName = 'min-h-[280px]',
}: Props) {
  const { info: toastInfo } = useToast()
  const [keywordInput, setKeywordInput] = useState('')
  const [showKeywordModal, setShowKeywordModal] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit, KeywordLink],
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

  const openKeywordModal = () => {
    if (!editor) return
    const selected = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    )
    if (!selected.trim()) {
      toastInfo('Select the word or phrase you want to link to related articles.')
      return
    }
    setKeywordInput(selected.trim())
    setShowKeywordModal(true)
  }

  const applyKeywordLink = () => {
    if (!editor || !keywordInput.trim()) return
    editor.chain().focus().setKeywordLink(keywordInput.trim()).run()
    setShowKeywordModal(false)
    setKeywordInput('')
  }

  if (!editor) return null

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

        <span className="mx-1 h-6 w-px bg-slate-200" />

        <ToolbarButton
          onClick={openKeywordModal}
          active={editor.isActive('keywordLink')}
          label="Link to related articles"
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

      {showKeywordModal && (
        <div className="border-t border-slate-100 bg-[#faf8f4] px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">Link to related articles</p>
          <p className="mt-1 text-xs text-slate-500">
            Readers who click this text will see all articles containing this keyword.
          </p>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c6a14d]/50"
            placeholder="Search keyword, e.g. covenant"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowKeywordModal(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyKeywordLink}
              className="rounded-lg bg-[#1f2f3d] px-3 py-1.5 text-sm font-medium text-white"
            >
              Apply link
            </button>
          </div>
        </div>
      )}
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
      className={`inline-flex items-center rounded-lg px-2.5 py-2 transition-colors ${
        active ? 'bg-[#1f2f3d] text-white' : 'text-slate-600 hover:bg-white'
      } ${className}`}
    >
      {children}
    </button>
  )
}
