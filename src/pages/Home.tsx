import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArticlesPagination } from '../components/ArticlesPagination'
import { PostCard } from '../components/PostCard'
import { HomePageSkeleton } from '../components/Skeleton'
import { SiteFooter } from '../components/SiteFooter'
import { usePosts } from '../hooks/usePosts'
import { useAuth } from '../hooks/useAuth'
import { useReplyNotificationToasts } from '../hooks/useReplyNotificationToasts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTagCounts } from '../lib/posts'
import { supabase } from '../lib/supabase'
import { HomeSearchPanel } from '../components/HomeSearchPanel'
import { ARTICLE_TAGS } from '../lib/tags'
import {
  buildArticlesBookPath,
  NEW_TESTAMENT_BOOKS,
  OLD_TESTAMENT_BOOKS,
} from '../lib/bible-books'

const HERO_CONTENT = {
  label: 'Latest Article',
  titleLine1: 'Dating The Crucifixion',
  titleLine2: 'Of Jesus Christ',
  description:
    'A Comprehensive Examination Of Historical Evidence, Roman Records, And Jewish Sources To Determine The Most Probable Date Of Jesus\' Crucifixion.',
  author: 'Author Name',
  date: 'June 28, 2026',
  readMins: 12,
}

const MOBILE_BOOK_PREVIEW = 9
const MOBILE_ARTICLE_PREVIEW = 5

export function Home() {
  const [testament, setTestament] = useState<'old' | 'new'>('old')
  const [booksExpanded, setBooksExpanded] = useState(false)
  const [mobileArticlesExpanded, setMobileArticlesExpanded] = useState(false)
  const browseBooks = testament === 'old' ? OLD_TESTAMENT_BOOKS : NEW_TESTAMENT_BOOKS
  const hasMoreBooks = browseBooks.length > MOBILE_BOOK_PREVIEW
  const { user } = useAuth()
  useReplyNotificationToasts({ enabled: true, userId: user?.id })
  const queryClient = useQueryClient()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = usePosts()

  const { data: tagCounts } = useQuery({
    queryKey: ['tag-counts'],
    queryFn: fetchTagCounts,
  })

  // Fetch current user permissions
  const { data: userPermission } = useQuery({
    queryKey: ['user-permissions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) {
        return {
          email: user.email,
          can_post: user.email === 'ask@christianarmour.com',
          is_admin: user.email === 'ask@christianarmour.com',
        }
      }
      return data
    },
  })

  const isAdmin = user?.email === 'ask@christianarmour.com' || !!userPermission?.is_admin
  const canPost = user?.email === 'ask@christianarmour.com' || !!userPermission?.can_post
  const canManage = isAdmin || canPost

  // Subscribe to real-time changes for posts, likes, and comments to keep the home feed updated
  useEffect(() => {
    const channel = supabase
      .channel('realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] })
          queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
          queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] })
          queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
          queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] })
          queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
          queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const posts = data?.pages.flatMap((page) => page.posts) ?? []

  if (isLoading) {
    return <HomePageSkeleton />
  }

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
      <div className="relative">
        <section className="relative overflow-hidden bg-white">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative z-10 flex flex-col justify-start px-4 pb-16 pt-5 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32 lg:pt-10 lg:pl-[max(2rem,calc((100vw-1440px)/2+2rem))]">
              <p className="font-sans text-[13px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] sm:text-[18px]">
                {HERO_CONTENT.label}
              </p>
              <h1 className="mt-2.5 max-w-xl font-serif text-[1.75rem] leading-[1.15] text-slate-900 sm:mt-3 sm:text-5xl sm:leading-tight lg:text-[4rem]">
                <span className="block sm:whitespace-nowrap">{HERO_CONTENT.titleLine1}</span>
                <span className="relative mt-1 inline-block pb-2 sm:whitespace-nowrap sm:pb-3">
                  {HERO_CONTENT.titleLine2}
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-2/12 min-w-6 bg-[#D4AF37] sm:min-w-8"
                    aria-hidden
                  />
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                {HERO_CONTENT.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:mt-4 sm:gap-x-6 sm:gap-y-3 sm:text-sm">
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <img src="/home/account.svg" alt="" className="h-4 w-4 sm:h-5 sm:w-5" />
                  {HERO_CONTENT.author}
                </span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <img src="/home/Calendar,Schedule.svg" alt="" className="h-4 w-4 sm:h-5 sm:w-5" />
                  {HERO_CONTENT.date}
                </span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-4 w-4 sm:h-5 sm:w-5" />
                  {HERO_CONTENT.readMins} mins read
                </span>
              </div>
              <div className="mt-4 sm:mt-4">
                <Link
                  to="/articles"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1f2f3d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#182633] sm:rounded-xl sm:px-5 sm:py-3"
                >
                  Read Article
                  <img src="/home/Arrow.svg" alt="" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </div>
            </div>

            <div className="relative order-first min-h-[180px] bg-slate-100 sm:order-none sm:min-h-[220px] lg:absolute lg:inset-y-0 lg:right-0 lg:w-[52%] lg:min-h-0">
              <img
                src="/home/background.svg"
                alt="Christian Armour hero banner"
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/70 to-transparent sm:h-28 lg:h-32"
                aria-hidden
              />
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <section className="-mt-8 grid grid-cols-2 gap-2.5 sm:-mt-16 sm:grid-cols-2 sm:gap-5 lg:-mt-20 xl:grid-cols-4">
            {ARTICLE_TAGS.map((category) => {
              const count = tagCounts?.[category.slug] ?? 0

              return (
                <Link
                  key={category.slug}
                  to={`/articles?tag=${category.slug}`}
                  className="group flex flex-col rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-0.5 hover:border-[#c6a14d]/40 hover:shadow-[0_14px_36px_rgba(15,23,42,0.14)] sm:rounded-[26px] sm:p-6"
                >
                  <img src={category.icon} alt="" className="h-8 w-8 sm:h-12 sm:w-12" />
                  <h2 className="mt-2.5 font-serif text-lg leading-tight text-slate-900 sm:mt-5 sm:text-[2rem]">
                    {category.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-4 text-slate-500 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-7">
                    {category.description}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-1 sm:mt-5">
                    <span className="text-[11px] font-medium text-slate-700 sm:text-sm">
                      {count} {count === 1 ? 'Article' : 'Articles'}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-[#c6a14d]/40 sm:h-9 sm:w-9">
                      <img
                        src="/home/noverticalhorizontalarrowiconyellow.svg"
                        alt=""
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </span>
                  </div>
                </Link>
              )
            })}
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load posts. Make sure you have run the Supabase migration in{' '}
            <code className="rounded bg-red-100 px-1">supabase/migrations/001_blog_auth.sql</code>.
          </div>
        )}

        <section id="recent-articles" className="mt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-serif text-4xl text-slate-900">Recent Articles</h2>
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#c6a14d]"
            >
              View all articles
              <img src="/home/noverticalhorizontalarrowiconyellow.svg" alt="" className="h-5 w-5" />
            </Link>
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-slate-500">No posts yet.</p>
          ) : (
            <>
              <div
                className={`grid gap-3 sm:gap-6 md:gap-8 xl:grid-cols-3 ${
                  mobileArticlesExpanded ? 'grid-cols-2' : 'grid-cols-1'
                } sm:grid-cols-2`}
              >
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className={
                      index >= MOBILE_ARTICLE_PREVIEW && !mobileArticlesExpanded
                        ? 'hidden sm:block'
                        : undefined
                    }
                  >
                    <PostCard post={post} canToggleComments={canManage} />
                  </div>
                ))}
              </div>

              {!mobileArticlesExpanded &&
                (posts.length > MOBILE_ARTICLE_PREVIEW || hasNextPage) && (
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
                  loadedCount={posts.length}
                  hasNextPage={Boolean(hasNextPage)}
                  isFetchingNextPage={isFetchingNextPage}
                  onLoadMore={() => void fetchNextPage()}
                />
              </div>
            </>
          )}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <HomeSearchPanel />

          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08),0_16px_40px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_32px_rgba(15,23,42,0.1),0_20px_48px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="max-w-xs font-serif text-4xl leading-tight text-slate-900">
                  Have A Theological Question?
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">We&apos;d love to hear from you.</p>
                <Link
                  to="/ask"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#182633]"
                >
                  Ask a Question
                  <img src="/home/Arrow.svg" alt="" className="h-4 w-4" />
                </Link>
              </div>

              <img
                src="/home/questionmark.svg"
                alt=""
                className="h-24 w-auto shrink-0 sm:h-28 lg:h-[7.5rem]"
                aria-hidden
              />
            </div>
          </div>
        </section>
      </div>

      <section className="mt-14 bg-[#1D2B34] py-8 text-white sm:py-12 lg:py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c6a14d] sm:text-sm">
            Browse By Book
          </p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-white sm:mt-4 sm:text-5xl">
            Exegesis, Organized Like A Concordance
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:mt-4 sm:leading-7">
            Choose a testament, then a book. Every article tagged to that book appears on its
            page, exactly the way you&apos;d look something up in a print concordance.
          </p>

          <div className="mt-6 flex items-center gap-6 border-b border-white/15 text-sm sm:mt-10 sm:gap-10">
            <button
              type="button"
              onClick={() => {
                setTestament('old')
                setBooksExpanded(false)
              }}
              className={
                testament === 'old'
                  ? 'border-b-2 border-[#c6a14d] pb-2.5 font-semibold text-[#c6a14d] sm:pb-3'
                  : 'pb-2.5 font-semibold text-white/70 transition-colors hover:text-white sm:pb-3'
              }
            >
              Old Testament
            </button>
            <button
              type="button"
              onClick={() => {
                setTestament('new')
                setBooksExpanded(false)
              }}
              className={
                testament === 'new'
                  ? 'border-b-2 border-[#c6a14d] pb-2.5 font-semibold text-[#c6a14d] sm:pb-3'
                  : 'pb-2.5 font-semibold text-white/70 transition-colors hover:text-white sm:pb-3'
              }
            >
              New Testament
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-5">
            {browseBooks.map((book, index) => (
              <Link
                key={book.name}
                to={buildArticlesBookPath(book.name)}
                className={`h-[64px] w-full flex-col items-center justify-center gap-1 rounded-md border border-[#B9C1CA] bg-white/10 px-2 py-2 text-center transition-colors hover:bg-white/[0.14] sm:h-[88px] sm:w-[236px] sm:shrink-0 sm:gap-2 sm:rounded-lg sm:border-2 sm:p-4 ${
                  index >= MOBILE_BOOK_PREVIEW && !booksExpanded
                    ? 'hidden sm:flex'
                    : 'flex'
                }`}
              >
                <p className="font-serif text-[15px] leading-tight text-white sm:text-2xl sm:leading-none">
                  {book.name}
                </p>
                <p className="text-[11px] leading-none text-white/60 sm:text-sm">{book.code}</p>
              </Link>
            ))}
          </div>

          {hasMoreBooks && !booksExpanded && (
            <div className="mt-4 flex justify-center sm:hidden">
              <button
                type="button"
                onClick={() => setBooksExpanded(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.16]"
              >
                More books
                <span className="text-white/60">({browseBooks.length - MOBILE_BOOK_PREVIEW})</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 lg:pb-10">
        <SiteFooter />
      </div>
    </div>
  )
}
