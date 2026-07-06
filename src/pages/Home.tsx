import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import { CrossSpinner, LoadingGrid } from '../components/CrossLoader'
import { SiteFooter } from '../components/SiteFooter'
import { usePosts } from '../hooks/usePosts'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTagCounts } from '../lib/posts'
import { supabase } from '../lib/supabase'
import { ARTICLE_TAGS } from '../lib/tags'

const TOPICS = [
  'Genesis',
  'Romans',
  'Trinity',
  'Salvation',
  'Christology',
  'Grace',
  'Resurrection',
  'Faith',
  'Church',
]

const HERO_CONTENT = {
  label: 'Latest Article',
  titleLead: 'Dating',
  titleRest: 'The Crucifixion Of Jesus Christ',
  description:
    'A Comprehensive Examination Of Historical Evidence, Roman Records, And Jewish Sources To Determine The Most Probable Date Of Jesus\' Crucifixion.',
  author: 'Author Name',
  date: 'June 28, 2026',
  readMins: 12,
}

const OLD_TESTAMENT_BOOKS = [
  ['Genesis', 'GEN'],
  ['Exodus', 'EXO'],
  ['Leviticus', 'LEV'],
  ['Numbers', 'NUM'],
  ['Deuteronomy', 'DEU'],
  ['Joshua', 'JOS'],
  ['Judges', 'JDG'],
  ['Ruth', 'RTH'],
  ['1 Samuel', '1SA'],
  ['2 Samuel', '2SA'],
  ['1 Kings', '1KI'],
  ['2 Kings', '2KI'],
  ['Isaiah', 'ISA'],
  ['Jeremiah', 'JER'],
  ['Ezekiel', 'EZE'],
] as const

export function Home() {
  const { user } = useAuth()
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
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#fcfaf7]">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="grid items-stretch gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col justify-center px-8 py-10 sm:px-12 lg:px-14">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c6a14d]">
                {HERO_CONTENT.label}
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-[4rem]">
                <span className="border-b-2 border-[#c6a14d] pb-1">{HERO_CONTENT.titleLead}</span>{' '}
                {HERO_CONTENT.titleRest}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
                {HERO_CONTENT.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
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
              <div className="mt-8">
                <a
                  href="#recent-articles"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#182633]"
                >
                  Read Article
                  <img src="/home/Arrow.svg" alt="" className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="min-h-[360px] bg-slate-100 lg:min-h-[520px]">
              <img
                src="/home/background.svg"
                alt="Christian Armour hero banner"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load posts. Make sure you have run the Supabase migration in{' '}
            <code className="rounded bg-red-100 px-1">supabase/migrations/001_blog_auth.sql</code>.
          </div>
        )}

        <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {ARTICLE_TAGS.map((category) => {
            const count = tagCounts?.[category.slug] ?? 0

            return (
              <Link
                key={category.slug}
                to={`/articles?tag=${category.slug}`}
                className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#c6a14d]/40 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
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
            <LoadingGrid count={3} className="min-h-[420px]" />
          ) : posts.length === 0 ? (
            <p className="text-center text-slate-500">No posts yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} canToggleComments={canManage} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                placeholder="Search Scripture, Theology, History, or Articles..."
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1c2b3a]"
              />
              <button
                type="button"
                className="rounded-2xl bg-[#1f2f3d] px-6 py-3 text-sm font-medium text-white"
              >
                Search
              </button>
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">Popular Topics</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-[#faf5e8] px-3 py-1.5 text-xs font-medium text-[#c6a14d]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <h3 className="max-w-xs font-serif text-4xl leading-tight text-slate-900">
              Have A Theological Question?
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-500">We&apos;d love to hear from you.</p>
            <div className="mt-6 flex items-center justify-between gap-4">
              <Link
                to="/ask"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#182633]"
              >
                Ask a Question
                <img src="/home/Arrow.svg" alt="" className="h-4 w-4" />
              </Link>
              <img src="/home/Lifeicon.svg" alt="" className="h-16 w-16" />
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-[34px] bg-[#1f2f3d] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
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
            <button type="button" className="border-b-2 border-[#c6a14d] pb-3 font-semibold text-[#c6a14d]">
              Old Testament
            </button>
            <button type="button" className="pb-3 font-semibold text-white/70">
              New Testament
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {OLD_TESTAMENT_BOOKS.map(([book, code]) => (
              <button
                key={book}
                type="button"
                className="rounded-2xl border border-white/35 px-5 py-6 text-center transition-colors hover:border-white/60 hover:bg-white/5"
              >
                <p className="font-serif text-2xl text-white">{book}</p>
                <p className="mt-2 text-sm text-white/60">{code}</p>
              </button>
            ))}
            <button
              type="button"
              className="rounded-2xl border border-dashed border-white/35 px-5 py-6 text-left text-2xl font-serif text-white/90"
            >
              + 24 more
            </button>
          </div>
        </section>

        <SiteFooter />

        <div ref={sentinelRef} className="mt-8 flex h-10 items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CrossSpinner size="xs" />
              Loading more posts...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
