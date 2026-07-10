import { ChevronDown, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from '../lib/bible-books'
import { ARTICLE_TAGS, type ArticleTagSlug } from '../lib/tags'

type Props = {
  keyword: string
  onKeywordChange: (value: string) => void
  onKeywordSubmit: (value: string) => void
  selectedTag: ArticleTagSlug | null
  onTagChange: (tag: ArticleTagSlug | null) => void
  selectedBooks: string[]
  onBooksChange: (books: string[]) => void
  readTimeMax: number
  onReadTimeMaxChange: (value: number) => void
  tagCounts?: Partial<Record<ArticleTagSlug, number>>
  onReset: () => void
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
      >
        {title}
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

function BookChecklist({
  books,
  selectedBooks,
  onBooksChange,
  previewCount = 4,
}: {
  books: readonly { name: string }[]
  selectedBooks: string[]
  onBooksChange: (books: string[]) => void
  previewCount?: number
}) {
  const bookNames = books.map((book) => book.name)
  const hasHiddenSelection = selectedBooks.some(
    (book) => bookNames.includes(book) && bookNames.indexOf(book) >= previewCount,
  )
  const [expanded, setExpanded] = useState(hasHiddenSelection)
  const remaining = books.length - previewCount
  const visibleBooks = expanded ? books : books.slice(0, previewCount)

  useEffect(() => {
    if (hasHiddenSelection) setExpanded(true)
  }, [hasHiddenSelection])

  const toggleBook = (book: string) => {
    if (selectedBooks.includes(book)) {
      onBooksChange(selectedBooks.filter((item) => item !== book))
      return
    }
    onBooksChange([...selectedBooks, book])
  }

  return (
    <>
      <div className={expanded ? 'max-h-56 space-y-2 overflow-y-auto pr-1' : 'space-y-2'}>
        {visibleBooks.map((book) => (
          <label
            key={book.name}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"
          >
            <input
              type="checkbox"
              checked={selectedBooks.includes(book.name)}
              onChange={() => toggleBook(book.name)}
              className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
            />
            {book.name}
          </label>
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm font-medium text-[#c6a14d] hover:text-[#a8863d]"
        >
          {expanded ? 'Show less' : `+ ${remaining} more`}
        </button>
      )}
    </>
  )
}

export function ArticleFilterSidebar({
  keyword,
  onKeywordChange,
  onKeywordSubmit,
  selectedTag,
  onTagChange,
  selectedBooks,
  onBooksChange,
  readTimeMax,
  onReadTimeMaxChange,
  tagCounts,
  onReset,
}: Props) {
  return (
    <aside className="h-fit self-start rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#c6a14d]" />
          <h2 className="text-lg font-semibold text-slate-900">Filter Article</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-[#c6a14d] transition-colors hover:text-[#a8863d]"
        >
          Reset
        </button>
      </div>

      <div className="mt-6">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Keyword Search
        </label>
        <div className="relative mt-2">
          <img
            src="/signin/serachlogo.svg"
            alt=""
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onKeywordSubmit(keyword)
              }
            }}
            placeholder="Search for keywords..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#c6a14d]/50"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <FilterSection title="Old Testament">
          <BookChecklist
            books={OLD_TESTAMENT_BOOKS}
            selectedBooks={selectedBooks}
            onBooksChange={onBooksChange}
          />
        </FilterSection>

        <FilterSection title="New Testament">
          <BookChecklist
            books={NEW_TESTAMENT_BOOKS}
            selectedBooks={selectedBooks}
            onBooksChange={onBooksChange}
          />
        </FilterSection>

        <FilterSection title="Categories">
          {ARTICLE_TAGS.map((tag) => {
            const checked = selectedTag === tag.slug

            return (
              <label
                key={tag.slug}
                className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-600"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onTagChange(checked ? null : tag.slug)}
                    className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
                  />
                  {tag.title}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {tagCounts?.[tag.slug] ?? 0}
                </span>
              </label>
            )
          })}
        </FilterSection>

        <FilterSection title="Read Time">
          <div className="px-1 pt-1">
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={readTimeMax}
              onChange={(e) => onReadTimeMaxChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-[#c6a14d]"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>5 mins</span>
              <span className="font-medium text-slate-700">Up to {readTimeMax} mins</span>
              <span>60 mins</span>
            </div>
          </div>
        </FilterSection>
      </div>
    </aside>
  )
}
