import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Lock, Settings2 } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import type { PostWithMeta } from '../lib/posts'
import { getTagBySlug } from '../lib/tags'
import { getExcerptFromContent, getReadingMinutes } from '../lib/article-content'
import { usePostLike } from '../hooks/usePostLike'
import { useRefTagger } from '../hooks/useRefTagger'
import { PostCoverImage } from './PostCoverImage'

type Props = {
  post: PostWithMeta
  canToggleComments?: boolean
}

export function PostCard({ post, canToggleComments }: Props) {
  const location = useLocation()
  const { success: toastSuccess, error: toastError } = useToast()
  const queryClient = useQueryClient()
  const { userLiked, likeCount, toggleLike, isPending } = usePostLike(post)

  const articleLinkState = {
    from: `${location.pathname}${location.search}`,
    fromLabel: location.pathname === '/' ? 'Back to home' : 'Back to articles',
  }

  useRefTagger([post.id, post.content])

  useEffect(() => {
    // Re-tag after excerpt mounts so Bible refs in the card become interactive
    window.setTimeout(() => window.refTagger?.tag?.(), 80)
  }, [post.id, post.content])

  const toggleCommentsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('posts')
        .update({ comments_enabled: !post.comments_enabled })
        .eq('id', post.id)
      if (error) throw error
    },
    onSuccess: () => {
      toastSuccess(`Comments ${!post.comments_enabled ? 'enabled' : 'disabled'} for this post!`)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to toggle comment settings')
    },
  })

  const handleToggleComments = () => {
    toggleCommentsMutation.mutate()
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const excerpt = getExcerptFromContent(post.content, 220)
  const tag = getTagBySlug(post.tag)

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <Link to={`/articles/${post.id}`} state={articleLinkState} className="block">
        <PostCoverImage
          imageUrl={post.image_url}
          title={post.title}
          className="aspect-[16/9]"
        />
      </Link>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">
            Recent Article
          </p>
          {tag && (
            <Link
              to={`/articles?tag=${tag.slug}`}
              className="rounded-full bg-[#faf5e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c6a14d] transition-colors hover:bg-[#f3e8c8]"
            >
              {tag.title}
            </Link>
          )}
        </div>
        <Link to={`/articles/${post.id}`} state={articleLinkState} className="mt-3 block">
          <h2 className="font-serif text-3xl leading-tight text-slate-900 transition-colors hover:text-[#1c2b3a]">
            {post.title}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">
          {excerpt}
        </p>
        <Link
          to={`/articles/${post.id}`}
          state={articleLinkState}
          className="mt-1 inline-block text-sm font-semibold text-[#c6a14d] transition-colors hover:text-[#a8863d]"
        >
          Read more
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <img src="/home/Calendar,Schedule.svg" alt="" className="h-4 w-4" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-2">
            <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-4 w-4" />
            {getReadingMinutes(post.content)} mins read
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={toggleLike}
            disabled={isPending}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              userLiked
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
            }`}
          >
            <Heart size={16} fill={userLiked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>

          <Link
            to={`/articles/${post.id}#comments`}
            state={articleLinkState}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            <MessageCircle size={16} />
            {post.comments.length}
          </Link>

          <Link
            to={`/articles/${post.id}`}
            state={articleLinkState}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#182633]"
          >
            Read Article
            <img src="/home/Arrow.svg" alt="" className="h-4 w-4" />
          </Link>
        </div>

        {!post.comments_enabled && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
            <Lock size={12} />
            Comments disabled
          </div>
        )}

        {canToggleComments && (
          <button
            type="button"
            onClick={handleToggleComments}
            disabled={toggleCommentsMutation.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Settings2 size={13} />
            {post.comments_enabled ? 'Disable Comments' : 'Enable Comments'}
          </button>
        )}
      </div>
    </article>
  )
}
