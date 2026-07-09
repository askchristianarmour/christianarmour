import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buildArticlesSearchPath } from '../lib/article-search'

const POPULAR_TOPICS = [
  'Genesis',
  'Romans',
  'Trinity',
  'Salvation',
  'Christology',
  'Grace',
  'Resurrection',
  'Faith',
  'Church',
] as const

export function HomeSearchPanel() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(buildArticlesSearchPath(trimmed))
  }

  return (
    <div className="rounded-[28px] bg-[#eeece7] p-5 sm:p-6">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center rounded-2xl border border-white/80 bg-white py-1.5 pl-1.5 pr-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
          <div className="relative min-w-0 flex-1">
            <img
              src="/signin/serachlogo.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 brightness-0 opacity-40"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Scripture, Theology, History, or Articles..."
              className="w-full border-0 bg-transparent py-2.5 pl-11 pr-3 font-serif text-sm text-slate-800 outline-none placeholder:font-serif placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-[#1f2f3d] px-12 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#182633] sm:px-14"
          >
            Search
          </button>
        </div>
      </form>

      <h3 className="mt-6 text-base font-bold text-slate-900">Popular Topics</h3>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {POPULAR_TOPICS.map((topic) => (
          <Link
            key={topic}
            to={buildArticlesSearchPath(topic)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#c6a14d] shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:text-[#a8863d] hover:shadow-[0_4px_16px_rgba(15,23,42,0.12)]"
          >
            {topic}
          </Link>
        ))}
      </div>
    </div>
  )
}
