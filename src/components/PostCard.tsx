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
    <article className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08),0_12px_32px_rgba(15,23,42,0.14)] sm:rounded-[24px]">
      <Link to={`/articles/${post.id}`} state={articleLinkState} className="block">
        <PostCoverImage
          imageUrl={post.image_url}
          title={post.title}
          className="aspect-[16/10] sm:aspect-[16/9]"
          titleClassName="font-serif text-base leading-tight text-slate-700 sm:text-3xl"
        />
      </Link>

      <div className="p-3 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <p className="font-sans text-[10px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] sm:text-[12.21px]">
            Recent Article
          </p>
          {tag && (
            <Link
              to={`/articles?tag=${tag.slug}`}
              className="font-sans text-[10px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] transition-colors hover:text-[#c49a2e] sm:text-[12.21px]"
            >
              {tag.title}
            </Link>
          )}
        </div>
        <Link to={`/articles/${post.id}`} state={articleLinkState} className="mt-2 block sm:mt-3">
          <h2 className="line-clamp-2 font-serif text-base font-semibold leading-tight tracking-normal text-[#1D2B34] transition-colors hover:text-[#15222a] sm:text-[28px] sm:leading-none">
            {post.title}
          </h2>
        </Link>

        <p className="mt-2 hidden line-clamp-2 text-sm leading-7 text-slate-600 sm:mt-3 sm:block">
          {excerpt}
        </p>
        <Link
          to={`/articles/${post.id}`}
          state={articleLinkState}
          className="mt-1 hidden text-sm font-semibold text-slate-400 transition-colors hover:text-slate-600 sm:inline-block"
        >
          Read more
        </Link>

        <div className="mt-3 flex flex-col gap-1 font-sans text-[11px] font-normal leading-4 tracking-normal text-[#5F6368] sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:text-[18px] sm:leading-[26px]">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap sm:h-[26px] sm:gap-2">
            <img src="/home/Calendar,Schedule.svg" alt="" className="h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">{formattedDate}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap sm:h-[26px] sm:gap-2">
            <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" />
            {getReadingMinutes(post.content)} mins
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:mt-6 sm:gap-3 sm:pt-5">
          <button
            type="button"
            onClick={toggleLike}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
              userLiked
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
            }`}
          >
            <Heart size={14} className="sm:hidden" fill={userLiked ? 'currentColor' : 'none'} />
            <Heart size={16} className="hidden sm:block" fill={userLiked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>

          <Link
            to={`/articles/${post.id}#comments`}
            state={articleLinkState}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <MessageCircle size={14} className="sm:hidden" />
            <MessageCircle size={16} className="hidden sm:block" />
            {post.comments.length}
          </Link>

          <Link
            to={`/articles/${post.id}`}
            state={articleLinkState}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#1f2f3d] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#182633] sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="sm:hidden">Read</span>
            <span className="hidden sm:inline">Read Article</span>
            <img src="/home/Arrow.svg" alt="" className="h-3 w-3 -rotate-45 sm:h-4 sm:w-4" />
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
