import { supabase } from './supabase'
import type { ArticleTagSlug } from './tags'
import type { Comment, Like, Post } from '../types/database'

export type PostWithMeta = Post & {
  likes: Like[]
  comments: Comment[]
}

export type InfinitePostsResponse = {
  posts: PostWithMeta[]
  nextCursor: number | null
}

export const POSTS_PAGE_SIZE = 10

async function hydratePosts(posts: Post[]): Promise<PostWithMeta[]> {
  if (posts.length === 0) return []

  const postIds = posts.map((post) => post.id)

  const [{ data: likes, error: likesError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase.from('likes').select('*').in('post_id', postIds),
      supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true }),
    ])

  if (likesError) throw likesError
  if (commentsError) throw commentsError

  return posts.map((post) => ({
    ...post,
    likes: (likes ?? []).filter((like) => like.post_id === post.id),
    comments: (comments ?? []).filter((comment) => comment.post_id === post.id),
  }))
}

export async function fetchPostsPage(page: number): Promise<InfinitePostsResponse> {
  return fetchPostsPageByTag(null, page)
}

function escapeIlikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

export async function fetchPostsPageBySearch(
  search: string,
  page: number
): Promise<InfinitePostsResponse> {
  const term = escapeIlikePattern(search.trim())
  if (!term) return fetchPostsPage(page)

  const PAGE_SIZE = POSTS_PAGE_SIZE
  const start = page * PAGE_SIZE
  const end = start + PAGE_SIZE - 1
  const pattern = `%${term}%`

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) throw error

  if (!posts || posts.length === 0) {
    return { posts: [], nextCursor: null }
  }

  const hydratedPosts = await hydratePosts(posts)

  return {
    posts: hydratedPosts,
    nextCursor: posts.length === PAGE_SIZE ? page + 1 : null,
  }
}

export async function fetchPostsPageByTag(
  tag: ArticleTagSlug | null,
  page: number
): Promise<InfinitePostsResponse> {
  const PAGE_SIZE = POSTS_PAGE_SIZE
  const start = page * PAGE_SIZE
  const end = start + PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(start, end)

  if (tag) {
    query = query.eq('tag', tag)
  }

  const { data: posts, error } = await query

  if (error) throw error

  if (!posts || posts.length === 0) {
    return { posts: [], nextCursor: null }
  }

  const hydratedPosts = await hydratePosts(posts)

  return {
    posts: hydratedPosts,
    nextCursor: posts.length === PAGE_SIZE ? page + 1 : null,
  }
}

export async function fetchTotalPostCount(): Promise<number> {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

export async function fetchTagCounts(): Promise<Record<ArticleTagSlug, number>> {
  const entries = await Promise.all(
    (['exegesis', 'theology', 'history', 'life'] as const).map(async (tag) => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('tag', tag)

      if (error) throw error
      return [tag, count ?? 0] as const
    })
  )

  return Object.fromEntries(entries) as Record<ArticleTagSlug, number>
}

export async function fetchPostById(postId: string): Promise<PostWithMeta | null> {
  const { data: post, error } = await supabase.from('posts').select('*').eq('id', postId).single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const [hydratedPost] = await hydratePosts([post])
  return hydratedPost ?? null
}

export async function updatePost(
  postId: string,
  payload: {
    title: string
    content: string
    imageBlob: Blob | null
    existingImageUrl?: string | null
    commentsEnabled: boolean
    tag: string | null
  }
) {
  let imageUrl = payload.existingImageUrl ?? null

  if (payload.imageBlob) {
    const filePath = `feeds/${postId}-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, payload.imageBlob, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('posts').getPublicUrl(filePath)
    imageUrl = data.publicUrl
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title: payload.title,
      content: payload.content,
      image_url: imageUrl,
      comments_enabled: payload.commentsEnabled,
      tag: payload.tag,
    })
    .eq('id', postId)

  if (error) throw error
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}
