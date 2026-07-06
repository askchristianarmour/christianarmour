import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ArticleFilterSidebar } from '../components/ArticleFilterSidebar'
import { ArticleListCard } from '../components/ArticleListCard'
import { CrossSpinner, LoadingGrid } from '../components/CrossLoader'
import { SiteFooter } from '../components/SiteFooter'
import { useToast } from '../contexts/ToastContext'
import { useFilteredPosts } from '../hooks/useFilteredPosts'
import { fetchTagCounts, fetchTotalPostCount } from '../lib/posts'
import { supabase } from '../lib/supabase'
import { isArticleTagSlug, type ArticleTagSlug } from '../lib/tags'

import { getReadingMinutes, getPlainTextFromContent } from '../lib/article-content'

export function Articles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { error: toastError } = useToast()

  const tagParam = searchParams.get('tag')
  const urlSearch = searchParams.get('search') ?? ''
  const selectedTag = tagParam && isArticleTagSlug(tagParam) ? tagParam : null
  const activeSearch = urlSearch.trim() || null

  const [keyword, setKeyword] = useState(urlSearch)
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [readTimeMax, setReadTimeMax] = useState(60)

  useEffect(() => {
    setKeyword(urlSearch)
  }, [urlSearch])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFilteredPosts({
    tag: activeSearch ? null : selectedTag,
    search: activeSearch,
  })

  useEffect(() => {
    if (error) {
      toastError('Failed to load articles')
    }
  }, [error, toastError])

  const { data: tagCounts } = useQuery({
    queryKey: ['tag-counts'],
    queryFn: fetchTagCounts,
  })

  const { data: totalPostCount } = useQuery({
    queryKey: ['total-post-count'],
    queryFn: fetchTotalPostCount,
  })

  const handleTagChange = (tag: ArticleTagSlug | null) => {
    const params: Record<string, string> = {}
    if (tag) params.tag = tag
    if (activeSearch) params.search = activeSearch
    setSearchParams(params)
  }

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    const params: Record<string, string> = {}
    if (selectedTag) params.tag = selectedTag
    if (value.trim()) params.search = value.trim()
    setSearchParams(params)
  }

  const handleReset = () => {
    setKeyword('')
    setSelectedBooks([])
    setReadTimeMax(60)
    setSearchParams({})
  }

  useEffect(() => {
    const channel = supabase
      .channel('realtime-articles-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] })
        queryClient.invalidateQueries({ queryKey: ['posts-by-tag'] })
        queryClient.invalidateQueries({ queryKey: ['posts-by-search'] })
        queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
        queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) observer.observe(currentSentinel)

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, selectedTag, activeSearch])

  const posts = data?.pages.flatMap((page) => page.posts) ?? []

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const readMins = getReadingMinutes(post.content)
      if (readMins > readTimeMax) return false

      if (!activeSearch && keyword.trim()) {
        const haystack = `${post.title} ${getPlainTextFromContent(post.content)}`.toLowerCase()
        if (!haystack.includes(keyword.trim().toLowerCase())) return false
      }

      if (selectedBooks.length > 0) {
        const haystack = `${post.title} ${getPlainTextFromContent(post.content)}`.toLowerCase()
        const matchesBook = selectedBooks.some((book) => haystack.includes(book.toLowerCase()))
        if (!matchesBook) return false
      }

      return true
    })
  }, [posts, keyword, readTimeMax, selectedBooks, activeSearch])

  const resultCount = filteredPosts.length
  const totalCount = selectedTag ? tagCounts?.[selectedTag] ?? resultCount : totalPostCount ?? resultCount

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f3f1ec]">
      <section className="relative overflow-hidden bg-[#1f2f3d] px-4 py-14 text-center text-white sm:px-6 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <p className="absolute left-[-2%] top-1/2 -translate-y-1/2 font-serif text-[5rem] font-semibold uppercase tracking-[0.2em] text-white/[0.04] sm:text-[7rem] lg:text-[9rem]">
            Christian Armour
          </p>
          <img
            src="/signin/cross.svg"
            alt=""
            className="absolute right-[8%] top-1/2 h-28 w-auto -translate-y-1/2 opacity-[0.08] sm:h-36 lg:h-44"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl lg:text-7xl">Articles</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {activeSearch
              ? `Showing articles related to “${activeSearch}”.`
              : 'Engage with academically grounded, biblically faithful articles exploring Scripture, theology, church history, and Christian life—designed to help readers grow in knowledge, wisdom, and faith.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <ArticleFilterSidebar
            keyword={keyword}
            onKeywordChange={handleKeywordChange}
            selectedTag={selectedTag}
            onTagChange={handleTagChange}
            selectedBooks={selectedBooks}
            onBooksChange={setSelectedBooks}
            readTimeMax={readTimeMax}
            onReadTimeMaxChange={setReadTimeMax}
            tagCounts={tagCounts}
            onReset={handleReset}
          />

          <div>
            <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-lg text-slate-700">
                <span className="font-semibold text-slate-900">{resultCount}</span> Articles Found
                {!selectedTag && !keyword && selectedBooks.length === 0 && readTimeMax === 60 && (
                  <span className="text-sm text-slate-400"> / {totalCount} total</span>
                )}
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Failed to load articles.
              </div>
            )}

            <section className="mt-6">
              {isLoading ? (
                <LoadingGrid count={10} />
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                  <p className="font-serif text-3xl text-slate-800">No articles found</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Try adjusting your filters or search keywords.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPosts.map((post) => (
                    <ArticleListCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="h-10" />
              {isFetchingNextPage && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <CrossSpinner size="xs" />
                  Loading more articles...
                </div>
              )}
            </section>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
