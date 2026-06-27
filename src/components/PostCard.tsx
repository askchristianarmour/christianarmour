import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Send, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'
import { AuthRequiredModal } from './AuthRequiredModal'
import type { PostWithMeta } from '../hooks/usePosts'
import { logView } from '../lib/analytics'

type Props = {
  post: PostWithMeta
  canToggleComments?: boolean
}

export function PostCard({ post, canToggleComments }: Props) {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const queryClient = useQueryClient()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)

  // Track post views (reads) in the database via session storage to prevent duplicate logging
  useEffect(() => {
    const sessionKey = `viewed_${post.id}`
    const alreadyViewed = sessionStorage.getItem(sessionKey)
    if (!alreadyViewed) {
      sessionStorage.setItem(sessionKey, 'true')
      logView({
        action: 'read',
        postId: post.id,
        postTitle: post.title,
      })
    }
  }, [post.id, post.title])

  const userLiked = post.likes.some((like) => like.user_id === user?.id)
  const likeCount = post.likes.length

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')

      if (userLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').insert({
          post_id: post.id,
          user_id: user.id,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        body,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

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

  const handleLike = () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    likeMutation.mutate()
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    if (!user) {
      setShowAuthModal(true)
      return
    }

    commentMutation.mutate(commentText.trim())
  }

  const handleToggleComments = () => {
    toggleCommentsMutation.mutate()
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        {post.image_url && (
          <div className="mb-4 -mx-6 -mt-6 aspect-[16/9] w-[calc(100%+3rem)] overflow-hidden border-b border-slate-100">
            <img
              src={post.image_url}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <time className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {formattedDate}
        </time>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{post.title}</h2>
        <p className="mt-3 leading-relaxed text-slate-600">{post.content}</p>

        <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
              userLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
            }`}
          >
            <Heart size={18} fill={userLiked ? 'currentColor' : 'none'} />
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>

          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <MessageCircle size={18} />
            {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
          </button>

          {canToggleComments && (
            <button
              type="button"
              onClick={handleToggleComments}
              disabled={toggleCommentsMutation.isPending}
              className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1.5"
            >
              {post.comments_enabled ? 'Disable Comments' : 'Enable Comments'}
            </button>
          )}
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 animate-in fade-in duration-200">
            {post.comments.length > 0 && (
              <ul className="space-y-3">
                {post.comments.map((comment) => (
                  <li key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p className="text-slate-700">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}

            {post.comments_enabled ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onFocus={() => {
                    if (!user) setShowAuthModal(true)
                  }}
                  placeholder={user ? 'Write a comment…' : 'Sign in to comment…'}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <button
                  type="submit"
                  disabled={commentMutation.isPending || !commentText.trim()}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-slate-400" />
                <span>Comments are disabled for this post.</span>
              </div>
            )}
          </div>
        )}
      </article>

      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
