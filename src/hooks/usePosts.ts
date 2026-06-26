import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Comment, Like, Post } from '../types/database'

export type PostWithMeta = Post & {
  likes: Like[]
  comments: Comment[]
}

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<PostWithMeta[]> => {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      const { data: likes, error: likesError } = await supabase.from('likes').select('*')
      if (likesError) throw likesError

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      return (posts ?? []).map((post) => ({
        ...post,
        likes: (likes ?? []).filter((l) => l.post_id === post.id),
        comments: (comments ?? []).filter((c) => c.post_id === post.id),
      }))
    },
  })
}
