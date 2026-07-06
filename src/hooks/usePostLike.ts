import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { useToast } from '../contexts/ToastContext'
import { ensureGuestLikeIdentity, hasGuestLiked, toggleGuestLike } from '../lib/guest-likes'
import { supabase } from '../lib/supabase'
import type { PostWithMeta } from '../lib/posts'

export function usePostLike(post: Pick<PostWithMeta, 'id' | 'likes'>) {
  const { user } = useAuth()
  const { error: toastError } = useToast()
  const queryClient = useQueryClient()
  const [guestLiked, setGuestLiked] = useState(false)

  useEffect(() => {
    ensureGuestLikeIdentity()
    setGuestLiked(hasGuestLiked(post.id))
  }, [post.id])

  const userLiked = useMemo(() => {
    if (!user) return guestLiked
    return post.likes.some((like) => like.user_id === user.id)
  }, [guestLiked, post.likes, user])

  const likeCount = useMemo(() => {
    if (user) return post.likes.length
    return post.likes.length + (guestLiked ? 1 : 0)
  }, [guestLiked, post.likes.length, user])

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        return toggleGuestLike(post.id)
      }

      const alreadyLiked = post.likes.some((like) => like.user_id === user.id)

      if (alreadyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        if (error) throw error
        return false
      }

      const { error } = await supabase.from('likes').insert({
        post_id: post.id,
        user_id: user.id,
      })

      if (error) throw error
      return true
    },
    onSuccess: (liked) => {
      if (!user) {
        setGuestLiked(liked)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update like')
    },
  })

  return {
    userLiked,
    likeCount,
    toggleLike: () => likeMutation.mutate(),
    isPending: likeMutation.isPending,
  }
}
