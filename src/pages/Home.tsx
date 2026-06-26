import { PostCard } from '../components/PostCard'
import { usePosts } from '../hooks/usePosts'

export function Home() {
  const { data: posts, isLoading, error } = usePosts()

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

      {posts && posts.length === 0 && (
        <p className="text-center text-slate-500">No posts yet.</p>
      )}

      <div className="space-y-6">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
