import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AuthRequiredModal } from './AuthRequiredModal'
import type { PostWithMeta } from '../hooks/usePosts'

type Props = {
  post: PostWithMeta
}

export function PostCard({ post }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)

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

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              userLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
            }`}
          >
            <Heart size={18} fill={userLiked ? 'currentColor' : 'none'} />
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>

          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <MessageCircle size={18} />
            {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
          </button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {post.comments.length > 0 && (
              <ul className="space-y-3">
                {post.comments.map((comment) => (
                  <li key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p className="text-slate-700">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}

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
                className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </article>

      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
