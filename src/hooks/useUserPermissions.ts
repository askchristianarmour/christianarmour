import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useUserPermissions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-permissions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()

      if (error || !data) {
        return {
          email: user.email,
          can_post: user.email === 'ask@christianarmour.com',
          is_admin: user.email === 'ask@christianarmour.com',
        }
      }
      return data
    },
  })
}

export function useIsAdmin() {
  const { user } = useAuth()
  const { data: permissions, isLoading } = useUserPermissions()
  const isAdmin =
    user?.email === 'ask@christianarmour.com' || !!permissions?.is_admin

  return { isAdmin, isLoading }
}
