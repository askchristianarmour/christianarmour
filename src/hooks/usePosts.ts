import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Comment, Like, Post } from '../types/database'

export type PostWithMeta = Post & {
  likes: Like[]
  comments: Comment[]
}

export type InfinitePostsResponse = {
  posts: PostWithMeta[]
  nextCursor: number | null
}

export function usePosts() {
  return useInfiniteQuery<InfinitePostsResponse, Error>({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }): Promise<InfinitePostsResponse> => {
      const page = pageParam as number
      const PAGE_SIZE = 5
      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE - 1

      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)

      if (postsError) throw postsError

      if (!posts || posts.length === 0) {
        return { posts: [], nextCursor: null }
      }

      const postIds = posts.map((p) => p.id)

      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .in('post_id', postIds)
      if (likesError) throw likesError

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      const postsWithMeta = posts.map((post) => ({
        ...post,
        likes: (likes ?? []).filter((l) => l.post_id === post.id),
        comments: (comments ?? []).filter((c) => c.post_id === post.id),
      }))

      return {
        posts: postsWithMeta,
        nextCursor: posts.length === PAGE_SIZE ? page + 1 : null,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

