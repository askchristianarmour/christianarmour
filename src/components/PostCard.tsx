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
  /** Pre-assigned cover (from adjacent-aware list assignment). */
  coverImageUrl?: string | null
  /** Denser layout for narrow 2-column mobile grids (max-sm only). */
  compact?: boolean
}

export function PostCard({ post, canToggleComments, coverImageUrl, compact = false }: Props) {
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

  const longDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const shortDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const excerpt = getExcerptFromContent(post.content, 220)
  const tag = getTagBySlug(post.tag)
  const readMins = getReadingMinutes(post.content)

  return (
    <article
      className={`overflow-hidden border border-slate-200 bg-white sm:rounded-[24px] sm:shadow-[0_2px_8px_rgba(15,23,42,0.08),0_12px_32px_rgba(15,23,42,0.14)] ${
        compact
          ? 'rounded-[12px] shadow-[0_2px_6px_rgba(15,23,42,0.06)]'
          : 'rounded-[16px] shadow-[0_2px_8px_rgba(15,23,42,0.08),0_12px_32px_rgba(15,23,42,0.14)]'
      }`}
    >
      <Link to={`/articles/${post.id}`} state={articleLinkState} className="block">
        <PostCoverImage
          imageUrl={coverImageUrl ?? post.image_url}
          title={post.title}
          seed={post.id}
          className={compact ? 'aspect-[16/11] sm:aspect-[16/9]' : 'aspect-[16/10] sm:aspect-[16/9]'}
          titleClassName="font-serif text-sm leading-tight text-slate-700 sm:text-3xl"
        />
      </Link>

      <div className={`sm:p-6 ${compact ? 'p-2.5' : 'p-3'}`}>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <p
            className={`font-sans font-bold uppercase leading-none tracking-normal text-[#D4AF37] sm:text-[12.21px] ${
              compact ? 'hidden sm:block sm:text-[12.21px]' : 'text-[10px]'
            }`}
          >
            Recent Article
          </p>
          {tag ? (
            <Link
              to={`/articles?tag=${tag.slug}`}
              className={`font-sans font-bold uppercase leading-none tracking-normal text-[#D4AF37] transition-colors hover:text-[#c49a2e] sm:text-[12.21px] ${
                compact ? 'text-[9px]' : 'text-[10px]'
              }`}
            >
              {tag.title}
            </Link>
          ) : (
            compact && (
              <p className="font-sans text-[9px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] sm:hidden">
                Article
              </p>
            )
          )}
        </div>

        <Link
          to={`/articles/${post.id}`}
          state={articleLinkState}
          className={`block sm:mt-3 ${compact ? 'mt-1.5' : 'mt-2'}`}
        >
          <h2
            className={`line-clamp-2 font-serif font-semibold tracking-normal text-[#1D2B34] transition-colors hover:text-[#15222a] sm:text-[28px] sm:leading-none ${
              compact ? 'text-[13px] leading-snug' : 'text-base leading-tight'
            }`}
          >
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

        <div
          className={`font-sans font-normal tracking-normal text-[#5F6368] sm:mt-5 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:text-[18px] sm:leading-[26px] ${
            compact
              ? 'mt-2 flex items-center gap-2 text-[10px] leading-none'
              : 'mt-3 flex flex-col gap-1 text-[11px] leading-4'
          }`}
        >
          <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap sm:h-[26px] sm:gap-2">
            <img
              src="/home/Calendar,Schedule.svg"
              alt=""
              className="h-3 w-3 shrink-0 sm:h-5 sm:w-5"
            />
            <span className={`truncate ${compact ? 'sm:hidden' : 'hidden'}`}>{shortDate}</span>
            <span className={`truncate ${compact ? 'hidden sm:inline' : ''}`}>{longDate}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap sm:h-[26px] sm:gap-2">
            <img
              src="/home/Alarm, Clock, Time.svg"
              alt=""
              className="h-3 w-3 shrink-0 sm:h-5 sm:w-5"
            />
            {readMins} mins
          </span>
        </div>

        <div
          className={`flex items-center border-t border-slate-100 sm:mt-6 sm:flex-wrap sm:gap-3 sm:pt-5 ${
            compact ? 'mt-2.5 gap-1 pt-2.5' : 'mt-3 flex-wrap gap-2 pt-3'
          }`}
        >
          <button
            type="button"
            onClick={toggleLike}
            disabled={isPending}
            aria-label={userLiked ? 'Unlike' : 'Like'}
            className={`inline-flex items-center font-medium transition-colors sm:gap-2 sm:rounded-full sm:border sm:px-4 sm:py-2 sm:text-sm ${
              userLiked
                ? 'text-rose-600 sm:border-rose-200 sm:bg-rose-50'
                : 'text-slate-500 hover:text-rose-600 sm:border-slate-200 sm:text-slate-600 sm:hover:border-rose-200'
            } ${
              compact
                ? 'gap-0.5 rounded-md px-1 py-1 text-[10px]'
                : 'gap-1.5 rounded-full border px-2.5 py-1.5 text-xs'
            } ${
              !compact && userLiked
                ? 'border-rose-200 bg-rose-50'
                : !compact
                  ? 'border-slate-200'
                  : ''
            }`}
          >
            <Heart size={compact ? 12 : 14} className="sm:hidden" fill={userLiked ? 'currentColor' : 'none'} />
            <Heart size={16} className="hidden sm:block" fill={userLiked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>

          <Link
            to={`/articles/${post.id}#comments`}
            state={articleLinkState}
            aria-label="Comments"
            className={`inline-flex items-center font-medium text-slate-500 transition-colors hover:text-slate-800 sm:gap-2 sm:rounded-full sm:border sm:border-slate-200 sm:px-4 sm:py-2 sm:text-sm sm:text-slate-600 sm:hover:border-slate-300 sm:hover:text-slate-900 ${
              compact
                ? 'gap-0.5 rounded-md px-1 py-1 text-[10px]'
                : 'gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600'
            }`}
          >
            <MessageCircle size={compact ? 12 : 14} className="sm:hidden" />
            <MessageCircle size={16} className="hidden sm:block" />
            {post.comments.length}
          </Link>

          {/* Compact mobile CTA */}
          {compact && (
            <Link
              to={`/articles/${post.id}`}
              state={articleLinkState}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f2f3d] text-white transition-colors hover:bg-[#182633] sm:hidden"
              aria-label={`Read ${post.title}`}
            >
              <img src="/home/Arrow.svg" alt="" className="h-3 w-3 -rotate-45 brightness-0 invert" />
            </Link>
          )}

          {/* Full CTA (always on sm+; also on mobile when not compact) */}
          <Link
            to={`/articles/${post.id}`}
            state={articleLinkState}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#1f2f3d] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#182633] sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${
              compact ? 'hidden sm:inline-flex' : ''
            }`}
          >
            <span className="sm:hidden">Read</span>
            <span className="hidden sm:inline">Read Article</span>
            <img src="/home/Arrow.svg" alt="" className="h-3 w-3 -rotate-45 sm:h-4 sm:w-4" />
          </Link>
        </div>

        {!post.comments_enabled && (
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 ${
              compact ? 'hidden sm:inline-flex' : ''
            }`}
          >
            <Lock size={12} />
            Comments disabled
          </div>
        )}

        {canToggleComments && (
          <button
            type="button"
            onClick={handleToggleComments}
            disabled={toggleCommentsMutation.isPending}
            className={`mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${
              compact ? 'hidden sm:inline-flex' : ''
            }`}
          >
            <Settings2 size={13} />
            {post.comments_enabled ? 'Disable Comments' : 'Enable Comments'}
          </button>
        )}
      </div>
    </article>
  )
}
