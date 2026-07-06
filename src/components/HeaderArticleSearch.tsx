import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { buildArticlesSearchPath } from '../lib/article-search'

type Props = {
  variant?: 'header' | 'inline'
  className?: string
  autoFocus?: boolean
  onSearched?: () => void
}

export function HeaderArticleSearch({
  variant = 'header',
  className = '',
  autoFocus = false,
  onSearched,
}: Props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') ?? ''
  const [query, setQuery] = useState(urlSearch)

  useEffect(() => {
    setQuery(urlSearch)
  }, [urlSearch])

  const submitSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    navigate(buildArticlesSearchPath(trimmed))
    onSearched?.()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitSearch(query)
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col gap-3 sm:flex-row ${className}`}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Scripture, Theology, History, or Articles..."
          autoFocus={autoFocus}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1c2f3d]"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[#1f2f3d] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#182633]"
        >
          Search
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <img
        src="/signin/serachlogo.svg"
        alt=""
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        autoFocus={autoFocus}
        aria-label="Search articles"
        className="w-full rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/40 sm:w-44 xl:w-52"
      />
    </form>
  )
}
