import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ArticleFilterSidebar } from '../components/ArticleFilterSidebar'
import { ArticleListCard } from '../components/ArticleListCard'
import { ArticleSearchKeywords } from '../components/ArticleSearchKeywords'
import { ArticlesPagination } from '../components/ArticlesPagination'
import { ArticlesPageSkeleton } from '../components/Skeleton'
import { SiteFooter } from '../components/SiteFooter'
import { useToast } from '../contexts/ToastContext'
import { useFilteredPosts } from '../hooks/useFilteredPosts'
import { fetchTagCounts, fetchTotalPostCount } from '../lib/posts'
import { supabase } from '../lib/supabase'
import { isArticleTagSlug, type ArticleTagSlug } from '../lib/tags'

import { getReadingMinutes, getPlainTextFromContent } from '../lib/article-content'
import { buildArticlesBooksParam, parseBookParam } from '../lib/bible-books'
import { assignAdjacentCoverImages } from '../lib/cover-images'

const MOBILE_ARTICLE_PREVIEW = 5

export function Articles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { error: toastError } = useToast()

  const tagParam = searchParams.get('tag')
  const urlSearch = searchParams.get('search') ?? ''
  const urlBooks = searchParams.get('book') ?? ''
  const selectedTag = tagParam && isArticleTagSlug(tagParam) ? tagParam : null
  const activeSearch = urlSearch.trim() || null

  const [keyword, setKeyword] = useState(urlSearch)
  const [selectedBooks, setSelectedBooks] = useState<string[]>(() => parseBookParam(urlBooks))
  const [readTimeMax, setReadTimeMax] = useState(60)
  const [mobileArticlesExpanded, setMobileArticlesExpanded] = useState(false)

  useEffect(() => {
    setKeyword(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    setSelectedBooks(parseBookParam(urlBooks))
  }, [urlBooks])

  useEffect(() => {
    setMobileArticlesExpanded(false)
  }, [selectedTag, activeSearch, urlBooks, readTimeMax])

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

  const syncParams = (next: {
    tag?: ArticleTagSlug | null
    search?: string | null
    books?: string[]
  }) => {
    const params: Record<string, string> = {}
    const tag = next.tag === undefined ? selectedTag : next.tag
    const search = next.search === undefined ? activeSearch : next.search
    const books = next.books === undefined ? selectedBooks : next.books
    if (tag) params.tag = tag
    if (search) params.search = search
    const bookParam = buildArticlesBooksParam(books)
    if (bookParam) params.book = bookParam
    setSearchParams(params)
  }

  const handleKeywordSelect = (value: string) => {
    setKeyword(value)
    syncParams({ search: value.trim(), tag: null })
  }

  const handleClearSearch = () => {
    setKeyword('')
    syncParams({ search: null })
  }

  const handleTagChange = (tag: ArticleTagSlug | null) => {
    syncParams({ tag, search: activeSearch })
  }

  const handleKeywordSubmit = (value: string) => {
    const trimmed = value.trim()
    setKeyword(trimmed)
    if (!trimmed) {
      handleClearSearch()
      return
    }
    syncParams({ search: trimmed, tag: null })
  }

  const handleBooksChange = (books: string[]) => {
    setSelectedBooks(books)
    syncParams({ books })
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
  const coverById = useMemo(
    () => assignAdjacentCoverImages(filteredPosts),
    [filteredPosts]
  )

  if (isLoading) {
    return <ArticlesPageSkeleton />
  }

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
      <section className="relative flex h-[300px] items-center justify-center overflow-hidden bg-[#1f2f3d] px-4 text-center text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/article/left_armour_imagehero.svg"
            alt=""
            aria-hidden
            className="absolute left-0 top-1/2 h-[70%] w-auto max-w-[28%] -translate-y-1/2 object-contain object-left opacity-90 sm:max-w-[32%] lg:max-w-[36%]"
          />
          <img
            src="/article/right_armour_imagehero.svg"
            alt=""
            aria-hidden
            className="absolute right-0 top-1/2 h-[70%] w-auto max-w-[28%] -translate-y-1/2 object-contain object-right opacity-90 sm:max-w-[32%] lg:max-w-[36%]"
          />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <h1 className="font-serif text-[48px] font-bold leading-none tracking-normal text-center">
            Articles
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center font-sans text-[16px] font-normal leading-6 tracking-normal text-white/75">
            {activeSearch
              ? `Showing articles related to “${activeSearch}”.`
              : 'Engage with academically grounded, biblically faithful articles exploring Scripture, theology, church history, and Christian life—designed to help readers grow in knowledge, wisdom, and faith.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid items-start gap-4 sm:gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <ArticleFilterSidebar
            keyword={keyword}
            onKeywordChange={setKeyword}
            onKeywordSubmit={handleKeywordSubmit}
            selectedTag={selectedTag}
            onTagChange={handleTagChange}
            selectedBooks={selectedBooks}
            onBooksChange={handleBooksChange}
            readTimeMax={readTimeMax}
            onReadTimeMaxChange={setReadTimeMax}
            tagCounts={tagCounts}
            onReset={handleReset}
          />

          <div>
            <ArticleSearchKeywords
              activeSearch={activeSearch}
              onSelect={handleKeywordSelect}
              onClear={activeSearch ? handleClearSearch : undefined}
            />

            <div className="mt-4 rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
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
              {filteredPosts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                  <p className="font-serif text-3xl text-slate-800">No articles found</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Try adjusting your filters or search keywords.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={`grid justify-items-stretch gap-3 sm:justify-items-start sm:gap-[12.21px] xl:grid-cols-3 ${
                      mobileArticlesExpanded ? 'grid-cols-2' : 'grid-cols-1'
                    } sm:grid-cols-2`}
                  >
                    {filteredPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className={
                          index >= MOBILE_ARTICLE_PREVIEW && !mobileArticlesExpanded
                            ? 'hidden w-full sm:block'
                            : 'w-full'
                        }
                      >
                        <ArticleListCard post={post} coverImageUrl={coverById[post.id]} />
                      </div>
                    ))}
                  </div>

                  {!mobileArticlesExpanded &&
                    (filteredPosts.length > MOBILE_ARTICLE_PREVIEW || hasNextPage) && (
                      <div className="mt-8 flex justify-center sm:hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileArticlesExpanded(true)
                            if (hasNextPage) void fetchNextPage()
                          }}
                          disabled={isFetchingNextPage}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          View more
                        </button>
                      </div>
                    )}

                  <div className={mobileArticlesExpanded ? 'block' : 'hidden sm:block'}>
                    <ArticlesPagination
                      loadedCount={filteredPosts.length}
                      hasNextPage={Boolean(hasNextPage)}
                      isFetchingNextPage={isFetchingNextPage}
                      onLoadMore={() => void fetchNextPage()}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
