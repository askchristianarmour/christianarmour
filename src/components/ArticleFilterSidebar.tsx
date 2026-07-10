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
    <div className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 sm:pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
      >
        {title}
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-2.5 space-y-2 sm:mt-3">{children}</div>}
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
      <div
        className={
          expanded
            ? 'grid max-h-44 grid-cols-2 gap-x-2 gap-y-2 overflow-y-auto pr-1 sm:max-h-56 sm:grid-cols-1 sm:gap-y-2'
            : 'grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-1'
        }
      >
        {visibleBooks.map((book) => (
          <label
            key={book.name}
            className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 sm:gap-2.5 sm:text-sm"
          >
            <input
              type="checkbox"
              checked={selectedBooks.includes(book.name)}
              onChange={() => toggleBook(book.name)}
              className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d] sm:h-4 sm:w-4"
            />
            <span className="leading-snug">{book.name}</span>
          </label>
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs font-medium text-[#c6a14d] hover:text-[#a8863d] sm:text-sm"
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeFilterCount =
    selectedBooks.length + (selectedTag ? 1 : 0) + (readTimeMax < 60 ? 1 : 0) + (keyword.trim() ? 1 : 0)

  return (
    <aside className="h-fit self-start rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:rounded-[24px] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left sm:pointer-events-none"
          aria-expanded={mobileOpen}
        >
          <Filter size={16} className="shrink-0 text-[#c6a14d] sm:h-[18px] sm:w-[18px]" />
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Filter Article</h2>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#1f2f3d] px-2 py-0.5 text-[10px] font-semibold text-white sm:hidden">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`ml-auto shrink-0 text-slate-400 transition-transform sm:hidden ${
              mobileOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-xs font-medium text-[#c6a14d] transition-colors hover:text-[#a8863d] sm:text-sm"
        >
          Reset
        </button>
      </div>

      <div className={`${mobileOpen ? 'mt-4 block' : 'hidden'} sm:mt-6 sm:block`}>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
            Keyword Search
          </label>
          <div className="relative mt-1.5 sm:mt-2">
            <img
              src="/signin/serachlogo.svg"
              alt=""
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50 sm:h-4 sm:w-4"
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
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#c6a14d]/50 sm:rounded-xl sm:py-2.5 sm:pl-10"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
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
                  className="flex cursor-pointer items-center justify-between gap-3 text-xs text-slate-600 sm:text-sm"
                >
                  <span className="flex items-center gap-2 sm:gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onTagChange(checked ? null : tag.slug)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d] sm:h-4 sm:w-4"
                    />
                    {tag.title}
                  </span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:px-2 sm:text-xs">
                    {tagCounts?.[tag.slug] ?? 0}
                  </span>
                </label>
              )
            })}
          </FilterSection>

          <FilterSection title="Read Time">
            <div className="px-0.5 pt-1 sm:px-1">
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={readTimeMax}
                onChange={(e) => onReadTimeMaxChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-[#c6a14d]"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 sm:text-xs">
                <span>5 mins</span>
                <span className="font-medium text-slate-700">Up to {readTimeMax} mins</span>
                <span>60 mins</span>
              </div>
            </div>
          </FilterSection>
        </div>
      </div>
    </aside>
  )
}
