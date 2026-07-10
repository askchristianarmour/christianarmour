import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import { CrossSpinner, LoadingGrid } from '../components/CrossLoader'
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

export function Home() {
  const [testament, setTestament] = useState<'old' | 'new'>('old')
  const browseBooks = testament === 'old' ? OLD_TESTAMENT_BOOKS : NEW_TESTAMENT_BOOKS
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

  const sentinelRef = useRef<HTMLDivElement | null>(null)

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
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((page) => page.posts) ?? []

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
      <div className="relative">
        <section className="relative overflow-hidden bg-white">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative z-10 flex flex-col justify-start px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8 lg:pb-24 lg:pt-10 lg:pl-[max(2rem,calc((100vw-1440px)/2+2rem))]">
              <p className="font-sans text-[18px] font-bold uppercase leading-none tracking-normal text-[#D4AF37]">
                {HERO_CONTENT.label}
              </p>
              <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-[4rem]">
                <span className="block whitespace-nowrap">{HERO_CONTENT.titleLine1}</span>
                <span className="relative mt-1 inline-block whitespace-nowrap pb-3">
                  {HERO_CONTENT.titleLine2}
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-2/12 min-w-8 bg-[#D4AF37]"
                    aria-hidden
                  />
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                {HERO_CONTENT.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <img src="/home/account.svg" alt="" className="h-5 w-5" />
                  {HERO_CONTENT.author}
                </span>
                <span className="inline-flex items-center gap-2">
                  <img src="/home/Calendar,Schedule.svg" alt="" className="h-5 w-5" />
                  {HERO_CONTENT.date}
                </span>
                <span className="inline-flex items-center gap-2">
                  <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-5 w-5" />
                  {HERO_CONTENT.readMins} mins read
                </span>
              </div>
              <div className="mt-4">
                <Link
                  to="/articles"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#182633]"
                >
                  Read Article
                  <img src="/home/Arrow.svg" alt="" className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[220px] bg-slate-100 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[52%] lg:min-h-0">
              <img
                src="/home/background.svg"
                alt="Christian Armour hero banner"
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-white to-transparent lg:block xl:w-36"
                aria-hidden
              />
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <section className="-mt-12 grid gap-5 sm:-mt-16 sm:grid-cols-2 lg:-mt-20 xl:grid-cols-4">
            {ARTICLE_TAGS.map((category) => {
              const count = tagCounts?.[category.slug] ?? 0

              return (
                <Link
                  key={category.slug}
                  to={`/articles?tag=${category.slug}`}
                  className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-0.5 hover:border-[#c6a14d]/40 hover:shadow-[0_14px_36px_rgba(15,23,42,0.14)]"
                >
                  <img src={category.icon} alt="" className="h-12 w-12" />
                  <h2 className="mt-5 font-serif text-[2rem] leading-tight text-slate-900">
                    {category.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{category.description}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {count} {count === 1 ? 'Article' : 'Articles'}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-[#c6a14d]/40">
                      <img src="/home/noverticalhorizontalarrowiconyellow.svg" alt="" className="h-4 w-4" />
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

          {isLoading ? (
            <LoadingGrid count={10} className="min-h-[420px]" />
          ) : posts.length === 0 ? (
            <p className="text-center text-slate-500">No posts yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} canToggleComments={canManage} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="mt-8 flex h-10 items-center justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CrossSpinner size="xs" />
                Loading more articles...
              </div>
            )}
          </div>
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

      <section className="mt-14 bg-[#1D2B34] py-10 text-white sm:py-12 lg:py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c6a14d]">
            Browse By Book
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-5xl">
            Exegesis, Organized Like A Concordance
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Choose a testament, then a book. Every article tagged to that book appears on its
            page, exactly the way you&apos;d look something up in a print concordance.
          </p>

          <div className="mt-10 flex items-center gap-10 border-b border-white/15 text-sm">
            <button
              type="button"
              onClick={() => setTestament('old')}
              className={
                testament === 'old'
                  ? 'border-b-2 border-[#c6a14d] pb-3 font-semibold text-[#c6a14d]'
                  : 'pb-3 font-semibold text-white/70 transition-colors hover:text-white'
              }
            >
              Old Testament
            </button>
            <button
              type="button"
              onClick={() => setTestament('new')}
              className={
                testament === 'new'
                  ? 'border-b-2 border-[#c6a14d] pb-3 font-semibold text-[#c6a14d]'
                  : 'pb-3 font-semibold text-white/70 transition-colors hover:text-white'
              }
            >
              New Testament
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-5">
            {browseBooks.map((book) => (
              <Link
                key={book.name}
                to={buildArticlesBookPath(book.name)}
                className="flex h-[88px] w-[236px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border-2 border-[#B9C1CA] bg-white/10 p-4 text-center transition-colors hover:bg-white/[0.14]"
              >
                <p className="font-serif text-xl leading-none text-white sm:text-2xl">{book.name}</p>
                <p className="text-sm leading-none text-white/60">{book.code}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 lg:pb-10">
        <SiteFooter />
      </div>
    </div>
  )
}
