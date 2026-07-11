import { useState } from 'react'
import { X } from 'lucide-react'
import { POPULAR_ARTICLE_SEARCHES } from '../lib/article-search'
import { normalizeKeywords, parseKeywordInput } from '../lib/keywords'

type Props = {
  value: string[]
  onChange: (keywords: string[]) => void
}

export function KeywordMapper({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const keywords = normalizeKeywords(value)

  const addKeywords = (incoming: string[]) => {
    const next = normalizeKeywords([...keywords, ...incoming])
    onChange(next)
  }

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((item) => item !== keyword))
  }

  const commitDraft = () => {
    const parsed = parseKeywordInput(draft)
    if (parsed.length === 0) return
    addKeywords(parsed)
    setDraft('')
  }

  const suggestions = POPULAR_ARTICLE_SEARCHES.filter(
    (item) => !keywords.includes(item.toLowerCase())
  ).slice(0, 8)

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">Search keywords</p>
      <p className="mt-1 text-xs text-slate-500">
        Map terms so this article appears when someone searches them. Press Enter or comma to add.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e8d9b0] bg-[#faf5e8] px-3 py-1 text-xs font-medium text-slate-800"
          >
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="rounded-full p-0.5 text-slate-500 hover:bg-white/80 hover:text-slate-800"
              aria-label={`Remove ${keyword}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commitDraft()
            }
            if (e.key === 'Backspace' && !draft && keywords.length > 0) {
              removeKeyword(keywords[keywords.length - 1])
            }
          }}
          onBlur={commitDraft}
          placeholder="e.g. trinity, salvation, genesis"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#c6a14d] focus:ring-2 focus:ring-[#c6a14d]/25"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          Add
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Popular searches
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addKeywords([item])}
                className="rounded-full border border-dashed border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-[#c6a14d] hover:bg-[#faf5e8] hover:text-slate-900"
              >
                + {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
