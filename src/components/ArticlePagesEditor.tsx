import { BookOpen, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { RichTextEditor } from './editor/RichTextEditor'
import {
  createArticlePage,
  createBiblePassage,
  createDefaultArticleContent,
  parseArticleContent,
  reindexPageLabels,
  serializeArticleContent,
  type ArticlePage,
  type BiblePassage,
  type StructuredArticleContent,
} from '../lib/article-structure'

type Props = {
  value: string
  onChange: (serialized: string) => void
}

export function ArticlePagesEditor({ value, onChange }: Props) {
  const [structured, setStructured] = useState<StructuredArticleContent>(() =>
    value ? parseArticleContent(value) : createDefaultArticleContent()
  )
  const [expandedPageId, setExpandedPageId] = useState<string | null>(
    () => structured.pages[0]?.id ?? null
  )
  const lastEmittedRef = useRef(value)

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    lastEmittedRef.current = value
    const parsed = value ? parseArticleContent(value) : createDefaultArticleContent()
    setStructured(parsed)
    setExpandedPageId((current) => current ?? parsed.pages[0]?.id ?? null)
  }, [value])

  const commit = (next: StructuredArticleContent) => {
    const normalized = {
      ...next,
      pages: reindexPageLabels(next.pages),
    }
    const serialized = serializeArticleContent(normalized)
    lastEmittedRef.current = serialized
    setStructured(normalized)
    onChange(serialized)
  }

  const updatePage = (pageId: string, patch: Partial<ArticlePage>) => {
    commit({
      ...structured,
      pages: structured.pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)),
    })
  }

  const addPage = () => {
    const nextPage = createArticlePage(structured.pages.length + 1)
    commit({
      ...structured,
      pages: [...structured.pages, nextPage],
    })
    setExpandedPageId(nextPage.id)
  }

  const removePage = (pageId: string) => {
    if (structured.pages.length === 1) return
    const nextPages = structured.pages.filter((page) => page.id !== pageId)
    commit({ ...structured, pages: nextPages })
    if (expandedPageId === pageId) {
      setExpandedPageId(nextPages[0]?.id ?? null)
    }
  }

  const movePage = (pageId: string, direction: -1 | 1) => {
    const index = structured.pages.findIndex((page) => page.id === pageId)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= structured.pages.length) return

    const nextPages = [...structured.pages]
    const [moved] = nextPages.splice(index, 1)
    nextPages.splice(targetIndex, 0, moved)
    commit({ ...structured, pages: nextPages })
  }

  const updatePassage = (pageId: string, passageId: string, patch: Partial<BiblePassage>) => {
    const page = structured.pages.find((item) => item.id === pageId)
    if (!page) return

    updatePage(pageId, {
      biblePassages: page.biblePassages.map((passage) =>
        passage.id === passageId ? { ...passage, ...patch } : passage
      ),
    })
  }

  const addPassage = (pageId: string) => {
    const page = structured.pages.find((item) => item.id === pageId)
    if (!page) return

    updatePage(pageId, {
      biblePassages: [...page.biblePassages, createBiblePassage()],
    })
  }

  const removePassage = (pageId: string, passageId: string) => {
    const page = structured.pages.find((item) => item.id === pageId)
    if (!page) return

    updatePage(pageId, {
      biblePassages: page.biblePassages.filter((passage) => passage.id !== passageId),
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8dfc8] bg-[#faf8f4] px-4 py-3 text-sm text-slate-600">
        Build your article in pages. Each page can include a short description, rich text, and
        Bible passages with references and verse text.
      </div>

      {structured.pages.map((page, index) => {
        const isExpanded = expandedPageId === page.id

        return (
          <div
            key={page.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedPageId(isExpanded ? null : page.id)}
              className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-left"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1f2f3d] text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {page.label || `Page ${index + 1}`}
                </p>
                {page.description.trim() && (
                  <p className="truncate text-xs text-slate-500">{page.description}</p>
                )}
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="space-y-5 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Page title</label>
                    <input
                      type="text"
                      value={page.label}
                      onChange={(e) => updatePage(page.id, { label: e.target.value })}
                      placeholder={`Page ${index + 1}`}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="flex items-end gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => movePage(page.id, -1)}
                      disabled={index === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                    >
                      <ChevronUp size={14} />
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => movePage(page.id, 1)}
                      disabled={index === structured.pages.length - 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                    >
                      <ChevronDown size={14} />
                      Down
                    </button>
                    {structured.pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePage(page.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Remove page
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Page description
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    A short intro for this section — what this page covers before the main content.
                  </p>
                  <textarea
                    value={page.description}
                    onChange={(e) => updatePage(page.id, { description: e.target.value })}
                    rows={3}
                    placeholder="Describe what readers will find on this page..."
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Page content</label>
                  <p className="mt-1 text-xs text-slate-500">
                    Select text and use <strong>Link articles</strong> to connect words to related
                    articles. Add Bible references at the end of a line (e.g. John 3:16 or Matt
                    21:34) — they appear in red and open a Scripture preview when readers click
                    them.
                  </p>
                  <div className="mt-2">
                    <RichTextEditor
                      value={page.body}
                      onChange={(html) => updatePage(page.id, { body: html })}
                      minHeightClassName="min-h-[220px]"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e8dfc8] bg-[#faf8f4] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#8a6d2b]">
                      <BookOpen size={16} />
                      Bible passages &amp; verses
                    </div>
                    <button
                      type="button"
                      onClick={() => addPassage(page.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1f2f3d] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Plus size={14} />
                      Add passage
                    </button>
                  </div>

                  {page.biblePassages.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Add scripture references and verse text for this page.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {page.biblePassages.map((passage, passageIndex) => (
                        <div
                          key={passage.id}
                          className="rounded-xl border border-white bg-white p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Passage {passageIndex + 1}
                            </p>
                            <button
                              type="button"
                              onClick={() => removePassage(page.id, passage.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600">
                                Reference
                              </label>
                              <input
                                type="text"
                                value={passage.reference}
                                onChange={(e) =>
                                  updatePassage(page.id, passage.id, { reference: e.target.value })
                                }
                                placeholder="e.g. John 3:16"
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600">
                                Translation (optional)
                              </label>
                              <input
                                type="text"
                                value={passage.translation ?? ''}
                                onChange={(e) =>
                                  updatePassage(page.id, passage.id, {
                                    translation: e.target.value,
                                  })
                                }
                                placeholder="e.g. KJV, NIV"
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-slate-600">
                              Verse text
                            </label>
                            <textarea
                              value={passage.text}
                              onChange={(e) =>
                                updatePassage(page.id, passage.id, { text: e.target.value })
                              }
                              rows={4}
                              placeholder="Enter the Bible verse or passage text..."
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-slate-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addPage}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus size={16} />
        Add another page
      </button>
    </div>
  )
}
