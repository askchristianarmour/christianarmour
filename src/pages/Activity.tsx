import { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CrossLoader, CrossSpinner, PageLoader } from '../components/CrossLoader'
import { PageBackLink } from '../components/PageBackLink'
import { useToast } from '../contexts/ToastContext'
import { Heart, MessageSquare } from 'lucide-react'

interface ActivityLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
  posts: {
    title: string
  } | null
}

interface ActivityComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  posts: {
    title: string
  } | null
}

type ActivityItem =
  | (ActivityLike & { type: 'like' })
  | (ActivityComment & { type: 'comment' })

interface PaginatedActivityResponse {
  items: ActivityItem[]
  nextCursor: number | null
}

export function Activity() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { error: toastError } = useToast()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Redirect to signin if not loaded and no user
  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin')
    }
  }, [user, loading, navigate])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<PaginatedActivityResponse, Error>({
    queryKey: ['user-activity-paginated', user?.id],
    enabled: !!user?.id,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<PaginatedActivityResponse> => {
      if (!user?.id) return { items: [], nextCursor: null }

      const page = pageParam as number
      const PAGE_SIZE = 5

      // Fetch all likes
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('id, post_id, user_id, created_at, posts(title)')
        .eq('user_id', user.id)

      if (likesError) throw likesError

      // Fetch all comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, post_id, user_id, body, created_at, posts(title)')
        .eq('user_id', user.id)

      if (commentsError) throw commentsError

      // Merge and sort in memory
      const merged: ActivityItem[] = [
        ...(likes || []).map((l: any) => ({ ...l, type: 'like' as const })),
        ...(comments || []).map((c: any) => ({ ...c, type: 'comment' as const })),
      ]

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE
      const pageItems = merged.slice(start, end)

      return {
        items: pageItems,
        nextCursor: end < merged.length ? page + 1 : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

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

  useEffect(() => {
    if (error) {
      toastError('Failed to load activity log')
    }
  }, [error, toastError])

  const activities = data?.pages.flatMap((page) => page.items) ?? []

  if (loading || !user) {
    return <PageLoader label="Loading activity..." minHeightClassName="min-h-[40vh]" />
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 sm:px-6">
      <PageBackLink to="/profile">Back to Profile</PageBackLink>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Your Activity History</h1>
        <p className="mt-2 text-slate-600">
          A full timeline of your comments and likes across Christian Armour.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <CrossLoader size="lg" label="Loading activity..." />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load activity log: {error.message}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium">No activity logged yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Once you like or comment on posts, they will appear here.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Explore Posts
          </Link>
        </div>
      )}

      {activities.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="space-y-6 border-l border-slate-100 pl-6">
            {activities.map((item) => (
              <li key={`${item.type}-${item.id}`} className="relative group">
                <div className="absolute -left-[28.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300 group-hover:bg-slate-500 transition-colors shadow-sm" />
                {item.type === 'comment' ? (
                  <div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <MessageSquare size={12} className="text-slate-400 shrink-0" />
                      Commented on <span className="text-slate-700 font-semibold">{item.posts?.title || 'Unknown post'}</span> • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                      &ldquo;{item.body}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" />
                      Liked <span className="text-slate-700 font-semibold">{item.posts?.title || 'Unknown post'}</span> • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-10 mt-6 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CrossSpinner size="xs" />
            Loading more activity…
          </div>
        )}
      </div>
    </div>
  )
}
