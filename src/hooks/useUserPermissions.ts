import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export type UserPermissionRow = {
  email: string
  can_post: boolean
  can_edit?: boolean
  is_admin: boolean
}

function fallbackPermission(email: string | undefined | null): UserPermissionRow | null {
  if (!email) return null
  const isRoot = email === 'ask@christianarmour.com'
  return {
    email,
    can_post: isRoot,
    can_edit: isRoot,
    is_admin: isRoot,
  }
}

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
        return fallbackPermission(user.email)
      }

      return {
        ...data,
        can_edit: data.can_edit ?? data.can_post,
      } as UserPermissionRow
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

export function useArticlePermissions() {
  const { user } = useAuth()
  const { data: permissions, isLoading } = useUserPermissions()
  const isRoot = user?.email === 'ask@christianarmour.com'
  const isAdmin = isRoot || !!permissions?.is_admin
  const canAdd = isRoot || isAdmin || !!permissions?.can_post
  const canEdit = isRoot || isAdmin || !!permissions?.can_edit

  return { isAdmin, canAdd, canEdit, isLoading, permissions }
}
