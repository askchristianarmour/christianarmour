import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchUnreadNotificationCount } from '../lib/questions'
import { supabase } from '../lib/supabase'

export function useQuestionNotifications(userId?: string | null, enabled = true) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['question-notifications', userId],
    enabled: !!userId && enabled,
    queryFn: () => fetchUnreadNotificationCount(userId!),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!userId || !enabled) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['question-notifications', userId] })
          queryClient.invalidateQueries({ queryKey: ['poster-questions'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, enabled, queryClient])

  return query
}
