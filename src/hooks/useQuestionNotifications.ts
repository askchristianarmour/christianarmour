import { useNotifications } from './useNotifications'

/** @deprecated Use useNotifications instead */
export function useQuestionNotifications(userId?: string | null, enabled = true) {
  const { unreadCount, isLoading, refetch } = useNotifications(userId, enabled)

  return {
    data: unreadCount,
    isLoading,
    refetch,
  }
}
