import type { User } from '@supabase/supabase-js'
import { Lock, MessageCircle, Send, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { CrossSpinner } from './CrossLoader'
import type { Comment } from '../types/database'

const AVATAR_COLORS = [
  'from-[#1f2f3d] to-[#2d4a5e]',
  'from-[#8b6914] to-[#c6a14d]',
  'from-[#4a3728] to-[#7a5c44]',
  'from-[#2f4f4f] to-[#5f7a7a]',
  'from-[#3d2b4f] to-[#6b4f8a]',
]

type Props = {
  comments: Comment[]
  commentsEnabled: boolean
  user: User | null
  commentText: string
  onCommentTextChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onRequireAuth: () => void
  isSubmitting: boolean
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getAvatarStyle(userId: string) {
  return AVATAR_COLORS[hashString(userId) % AVATAR_COLORS.length]
}

function getDisplayName(userId: string) {
  return `Reader ${userId.slice(0, 4).toUpperCase()}`
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

function CommentAvatar({ userId, size = 'md' }: { userId: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-[0_4px_14px_rgba(15,23,42,0.12)] ring-2 ring-white ${sizeClass} ${getAvatarStyle(userId)}`}
      aria-hidden
    >
      {userId.slice(0, 2).toUpperCase()}
    </div>
  )
}

function CommentComposer({
  user,
  commentText,
  onCommentTextChange,
  onSubmit,
  onRequireAuth,
  isSubmitting,
}: Pick<Props, 'user' | 'commentText' | 'onCommentTextChange' | 'onSubmit' | 'onRequireAuth' | 'isSubmitting'>) {
  const charCount = commentText.length
  const maxChars = 500
  const canSubmit = commentText.trim().length > 0 && charCount <= maxChars

  return (
    <form onSubmit={onSubmit} className="mt-8">
      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-shadow focus-within:border-[#c6a14d]/40 focus-within:shadow-[0_12px_40px_rgba(198,161,77,0.12)]">
        <div className="flex items-start gap-4 p-4 sm:p-5">
          {user ? (
            <CommentAvatar userId={user.id} />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-100 text-slate-400">
              <MessageCircle size={18} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                {user ? 'Share your thoughts' : 'Join the conversation'}
              </p>
              {!user && (
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="text-xs font-semibold text-[#c6a14d] transition-colors hover:text-[#a8863d]"
                >
                  Sign in to comment
                </button>
              )}
            </div>

            <textarea
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              onFocus={() => {
                if (!user) onRequireAuth()
              }}
              maxLength={maxChars}
              rows={3}
              placeholder={
                user
                  ? 'Write a thoughtful response to this article...'
                  : 'Sign in to leave a comment on this article...'
              }
              className="w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/70 px-4 py-3 sm:px-5">
          <p className={`text-xs ${charCount > maxChars * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
            {charCount}/{maxChars}
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#182633] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? (
              <>
                <CrossSpinner size="xs" />
                Posting...
              </>
            ) : (
              <>
                Post comment
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <article className="group relative flex gap-4 rounded-[22px] border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="absolute left-0 top-5 hidden h-[calc(100%-2.5rem)] w-1 rounded-full bg-gradient-to-b from-[#c6a14d] to-[#e8d5a8] opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
      <CommentAvatar userId={comment.user_id} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">{getDisplayName(comment.user_id)}</p>
            <time className="text-xs text-slate-400" dateTime={comment.created_at}>
              {formatRelativeTime(comment.created_at)}
            </time>
          </div>
          <span className="rounded-full bg-[#faf5e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c6a14d]">
            Reader
          </span>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{comment.body}</p>
      </div>
    </article>
  )
}

export function CommentSection({
  comments,
  commentsEnabled,
  user,
  commentText,
  onCommentTextChange,
  onSubmit,
  onRequireAuth,
  isSubmitting,
}: Props) {
  const uniqueCommenters = useMemo(
    () => new Set(comments.map((comment) => comment.user_id)).size,
    [comments]
  )

  return (
    <section
      id="comments"
      className="relative mt-10 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#faf5e8]/60 to-transparent" />

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f2f3d] text-white shadow-[0_8px_20px_rgba(31,47,61,0.25)]">
              <MessageCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">
                Discussion
              </p>
              <h2 className="mt-1 font-serif text-3xl text-slate-900 sm:text-4xl">Comments</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Share reflections, questions, and insights with the Christian Armour community.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              <Sparkles size={14} className="text-[#c6a14d]" />
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
            {uniqueCommenters > 0 && (
              <span className="rounded-full bg-[#1f2f3d] px-4 py-2 text-sm font-medium text-white">
                {uniqueCommenters} {uniqueCommenters === 1 ? 'voice' : 'voices'}
              </span>
            )}
          </div>
        </div>

        {commentsEnabled ? (
          <CommentComposer
            user={user}
            commentText={commentText}
            onCommentTextChange={onCommentTextChange}
            onSubmit={onSubmit}
            onRequireAuth={onRequireAuth}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="mt-8 flex items-start gap-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Comments are closed</p>
              <p className="mt-1 text-sm text-slate-500">
                Discussion has been disabled for this article by the author.
              </p>
            </div>
          </div>
        )}

        <div className="mt-10">
          {comments.length > 0 && (
            <div className="mb-5 flex items-center gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Latest responses
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
          )}

          {comments.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf5e8] text-[#c6a14d]">
                <MessageCircle size={24} />
              </div>
              <p className="mt-5 font-serif text-2xl text-slate-800">No comments yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Be the first to share your perspective and start a meaningful conversation around
                this article.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...comments].reverse().map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
