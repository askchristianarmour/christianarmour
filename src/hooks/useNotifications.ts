import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId } from 'react'
import { fetchUnreadNotificationCount, fetchUserNotifications } from '../lib/questions'
import { supabase } from '../lib/supabase'

export function useNotifications(userId?: string | null, enabled = true) {
  const queryClient = useQueryClient()
  const channelSuffix = useId().replace(/:/g, '')
  const isEnabled = !!userId && enabled

  const countQuery = useQuery({
    queryKey: ['notification-count', userId],
    enabled: isEnabled,
    queryFn: () => fetchUnreadNotificationCount(userId!),
    refetchInterval: 30_000,
  })

  const listQuery = useQuery({
    queryKey: ['notifications', userId],
    enabled: isEnabled,
    queryFn: () => fetchUserNotifications(userId!),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!isEnabled) return

    const channel = supabase
      .channel(`notifications-${userId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notification-count', userId] })
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
          queryClient.invalidateQueries({ queryKey: ['question-notifications', userId] })
          queryClient.invalidateQueries({ queryKey: ['poster-questions'] })
          queryClient.invalidateQueries({ queryKey: ['answered-questions'] })
          queryClient.invalidateQueries({ queryKey: ['user-questions', userId] })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, isEnabled, channelSuffix, queryClient])

  return {
    unreadCount: countQuery.data ?? 0,
    notifications: listQuery.data ?? [],
    isLoading: countQuery.isLoading || listQuery.isLoading,
    refetch: () => {
      countQuery.refetch()
      listQuery.refetch()
    },
  }
}
