import { useEffect, useRef } from 'react'
import { PostCard } from '../components/PostCard'
import { usePosts } from '../hooks/usePosts'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] })
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">All Posts</h1>
        <p className="mt-2 text-slate-600">
          Browse the latest posts. Sign in to like and comment.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load posts. Make sure you have run the Supabase migration in{' '}
          <code className="rounded bg-red-100 px-1">supabase/migrations/001_blog_auth.sql</code>.
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <p className="text-center text-slate-500">No posts yet.</p>
      )}

      <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={post.id}>
              <PostCard post={post} canToggleComments={canManage} />

              {index === posts.length - 1 && (
                <div className="mt-10 text-center">
                  <p className="text-xl font-semibold text-slate-800">
                    The end of earthly life and eternal hope
                  </p>
                  <p className="mt-2 text-slate-500">
                    "For to me, to live is Christ and to die is gain."
                  </p>
                  <p className="mt-1 text-sm italic text-slate-400">
                    Philippians 1:21
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-10 mt-6 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            Loading more posts…
          </div>
        )}
      </div>
    </div>
  )
}
