import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User as Lock, Heart, MessageSquare, Camera, Settings, Activity, PlusCircle, ShieldAlert, ShieldCheck, Image as ImageIcon, HelpCircle, MoreHorizontal, Ban, Gift, FileText } from 'lucide-react'
import { TagPicker } from '../components/TagPicker'
import { KeywordMapper } from '../components/KeywordMapper'
import { CrossLoader, CrossSpinner, PageLoader } from '../components/CrossLoader'
import { PageBackLink } from '../components/PageBackLink'
import { AskedQuestionsPanel } from '../components/AskedQuestionsPanel'
import { AdminPostsManager } from '../components/AdminPostsManager'
import { AdminRandomCoversManager } from '../components/AdminRandomCoversManager'
import { AdminBannedUsersManager } from '../components/AdminBannedUsersManager'
import { InviteRewardsPanel } from '../components/InviteRewardsPanel'
import { MySubmissionsPanel, AdminPendingApprovalsBanner } from '../components/MySubmissionsPanel'
import { EditPermissionModal } from '../components/EditPermissionModal'
import { RevokePermissionConfirmationModal } from '../components/RevokePermissionConfirmationModal'
import { ArticleContent } from '../components/ArticleContent'
import { ArticlePagesEditor } from '../components/ArticlePagesEditor'
import {
  createDefaultArticleContent,
  hasArticleBody,
  serializeArticleContent,
} from '../lib/article-structure'
import type { ArticleTagSlug } from '../lib/tags'
import { getTagBySlug } from '../lib/tags'
import { normalizeKeywords } from '../lib/keywords'

interface ActivityLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
  posts: {
    title: string
  } | null
}

interface ActivityComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  posts: {
    title: string
  } | null
}

type ActivityItem =
  | (ActivityLike & { type: 'like' })
  | (ActivityComment & { type: 'comment' })

export function Profile() {
  const { user, loading } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  // Profile fields state
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<
    | 'settings'
    | 'activity'
    | 'add-post'
    | 'permissions'
    | 'banned-users'
    | 'asked-questions'
    | 'invite'
    | 'submissions'
  >('settings')

  // Add post state
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState(() =>
    serializeArticleContent(createDefaultArticleContent())
  )
  const [commentsEnabled, setCommentsEnabled] = useState(false)
  const [postTag, setPostTag] = useState<ArticleTagSlug | null>(null)
  const [postKeywords, setPostKeywords] = useState<string[]>([])
  const [showPublishPreview, setShowPublishPreview] = useState(false)

  // Post Header Image & Crop state
  const [postImageSrc, setPostImageSrc] = useState<string | null>(null)
  const [postImageBlob, setPostImageBlob] = useState<Blob | null>(null)
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null)
  const [postCropZoom, setPostCropZoom] = useState(1)
  const [postCropPosition, setPostCropPosition] = useState({ x: 0, y: 0 })
  const [postIsDragging, setPostIsDragging] = useState(false)
  const [postDragStart, setPostDragStart] = useState({ x: 0, y: 0 })

  // Permissions state
  const [newAccessEmail, setNewAccessEmail] = useState('')
  const [editingPermission, setEditingPermission] = useState<{
    email: string
    canAdd: boolean
    canEdit: boolean
  } | null>(null)
  const [revokeEmail, setRevokeEmail] = useState<string | null>(null)

  // Fetch current user permissions
  const { data: userPermission } = useQuery({
    queryKey: ['user-permissions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) {
        // Return default permissions if query fails (table not created yet, etc.)
        return {
          email: user.email,
          can_post: user.email === 'ask@christianarmour.com',
          is_admin: user.email === 'ask@christianarmour.com',
        }
      }
      return data
    },
  })

  const isAdmin = user?.email === 'ask@christianarmour.com' || !!userPermission?.is_admin
  const canPost =
    user?.email === 'ask@christianarmour.com' ||
    !!userPermission?.is_admin ||
    !!userPermission?.can_post

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'asked-questions' && canPost) setActiveTab('asked-questions')
    else if (tab === 'invite') setActiveTab('invite')
    else if (tab === 'submissions') setActiveTab('submissions')
    else if (tab === 'add-post') setActiveTab('add-post')
    else if (tab === 'activity') setActiveTab('activity')
    else if (tab === 'permissions' && isAdmin) setActiveTab('permissions')
    else if (tab === 'banned-users' && isAdmin) setActiveTab('banned-users')
  }, [searchParams, canPost, isAdmin])

  // Fetch all permissions for Admin View
  const { data: allPermissions, refetch: refetchPermissions, error: permissionsTableError } = useQuery({
    queryKey: ['all-permissions'],
    enabled: !!user?.id && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('email', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  // Mutation to add a new post
  const addPostMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      content: string
      imageBlob: Blob | null
      commentsEnabled: boolean
      tag: ArticleTagSlug | null
      keywords: string[]
    }) => {
      const postId = crypto.randomUUID()
      let imageUrl: string | null = null

      // Upload image to Supabase Storage if selected
      if (payload.imageBlob) {
        const filePath = `feeds/${postId}-${Date.now()}.png`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, payload.imageBlob, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        imageUrl = data.publicUrl
      }

      if (!user?.id) throw new Error('You must be signed in')
      const status = canPost ? 'approved' : 'pending'

      const { data, error } = await supabase.from('posts').insert({
        id: postId,
        title: payload.title,
        content: payload.content,
        image_url: imageUrl,
        comments_enabled: payload.commentsEnabled,
        tag: payload.tag ?? null,
        keywords: normalizeKeywords(payload.keywords),
        author_id: user.id,
        status,
      })

      if (error) throw error
      return { data, status }
    },
    onSuccess: (result) => {
      if (result.status === 'pending') {
        toastSuccess('Article submitted for review. It will appear after approval.')
      } else {
        toastSuccess('Post published successfully!')
      }
      setPostTitle('')
      setPostContent(serializeArticleContent(createDefaultArticleContent()))
      setCommentsEnabled(false)
      setPostTag(null)
      setPostKeywords([])
      setPostImageSrc(null)
      setPostImageBlob(null)
      setPostImagePreview(null)
      setShowPublishPreview(false)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts-by-search'] })
      queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
      queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
      queryClient.invalidateQueries({ queryKey: ['admin-posts-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] })
      if (result.status === 'pending') setActiveTab('submissions')
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to publish post')
    },
  })

  // Mutation to grant post access to an email
  const grantPermissionMutation = useMutation({
    mutationFn: async (payload: {
      email: string
      canAdd: boolean
      canEdit: boolean
    }) => {
      const email = payload.email.toLowerCase().trim()
      if (!payload.canAdd && !payload.canEdit) {
        throw new Error('Select at least one permission: Can Add or Can Edit')
      }
      const { data, error } = await supabase.from('user_permissions').upsert({
        email,
        can_post: payload.canAdd,
        can_edit: payload.canEdit,
        is_admin: false,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('Access permissions updated successfully!')
      setNewAccessEmail('')
      refetchPermissions()
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to grant access')
    },
  })

  const updatePermissionMutation = useMutation({
    mutationFn: async (payload: {
      email: string
      can_post: boolean
      can_edit: boolean
    }) => {
      if (!payload.can_post && !payload.can_edit) {
        throw new Error('Keep at least one permission, or use Revoke to remove access')
      }
      const { error } = await supabase
        .from('user_permissions')
        .update({
          can_post: payload.can_post,
          can_edit: payload.can_edit,
        })
        .eq('email', payload.email)
      if (error) throw error
    },
    onSuccess: () => {
      toastSuccess('Access permissions updated')
      setEditingPermission(null)
      refetchPermissions()
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update permission')
    },
  })

  // Mutation to revoke post access
  const revokePermissionMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      const { data, error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('email', targetEmail)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('User removed from permissions list')
      setRevokeEmail(null)
      setEditingPermission(null)
      refetchPermissions()
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to remove user')
    },
  })

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postTitle.trim() || !hasArticleBody(postContent)) {
      toastError('Title and content are required')
      return
    }
    // Open preview confirmation modal
    setShowPublishPreview(true)
  }

  const handleConfirmPublish = () => {
    addPostMutation.mutate({
      title: postTitle.trim(),
      content: postContent.trim(),
      imageBlob: postImageBlob,
      commentsEnabled,
      tag: postTag,
      keywords: postKeywords,
    })
  }

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccessEmail.trim()) {
      toastError('Email address is required')
      return
    }
    grantPermissionMutation.mutate({
      email: newAccessEmail.trim(),
      canAdd: true,
      canEdit: true,
    })
  }

  // Cropper state
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Redirect if not signed in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin')
    } else if (user) {
      setDisplayName(user.user_metadata?.display_name || '')
      setDob(user.user_metadata?.dob || '')
    }
  }, [user, loading, navigate])

  // Fetch activity
  const { data: activity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['user-activity', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return { likes: [], comments: [] }

      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('id, post_id, user_id, created_at, posts(title)')
        .eq('user_id', user.id)

      if (likesError) throw likesError

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, post_id, user_id, body, created_at, posts(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (commentsError) throw commentsError

      return {
        likes: (likes || []) as unknown as ActivityLike[],
        comments: (comments || []) as unknown as ActivityComment[],
      }
    },
  })

  // Merge and sort activities
  const mergedActivities: ActivityItem[] = [
    ...(activity?.likes || []).map((l) => ({ ...l, type: 'like' as const })),
    ...(activity?.comments || []).map((c) => ({ ...c, type: 'comment' as const })),
  ]
  mergedActivities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const latestActivities = mergedActivities.slice(0, 2)

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; dob: string }) => {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: payload.name, dob: payload.dob },
      })
      if (error) throw error
      return data
    },
    onMutate: () => setIsUpdatingName(true),
    onSuccess: () => {
      toastSuccess('Profile settings updated successfully!')
      setIsUpdatingName(false)
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update profile settings')
      setIsUpdatingName(false)
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (pass: string) => {
      const { data, error } = await supabase.auth.updateUser({
        password: pass,
      })
      if (error) throw error
      return data
    },
    onMutate: () => setIsUpdatingPassword(true),
    onSuccess: () => {
      toastSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setIsUpdatingPassword(false)
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update password')
      setIsUpdatingPassword(false)
    },
  })

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate({ name: displayName.trim(), dob })
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      toastError('Password cannot be empty')
      return
    }
    if (newPassword.length < 8) {
      toastError('Password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match')
      return
    }
    updatePasswordMutation.mutate(newPassword)
  }

  // File loading for avatar cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCroppingImage(reader.result as string)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // Clear input
  }

  // Avatar cropper mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Avatar cropper touch event handlers (mobile support)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Avatar Canvas Crop & Supabase Storage Upload
  const handleCropAndUpload = async () => {
    if (!croppingImage || !user) return
    setIsUploadingAvatar(true)

    try {
      const img = new Image()
      img.src = croppingImage
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not initialize canvas context')

      ctx.clearRect(0, 0, 256, 256)

      ctx.save()
      ctx.translate(128 + position.x, 128 + position.y)
      ctx.scale(zoom, zoom)

      const aspect = img.height / img.width
      const drawW = 256
      const drawH = 256 * aspect

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })

      if (!blob) throw new Error('Failed to generate cropped image')

      const pathsToTry = [
        `avatars/${user.id}/${Date.now()}.png`,
        `avatars/${user.id}.png`,
        `${user.id}/avatars/${Date.now()}.png`,
        `${user.id}/${Date.now()}.png`,
      ]

      let finalError: any = null
      let finalFilePath = ''

      for (const candidatePath of pathsToTry) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('profile')
            .upload(candidatePath, blob, {
              contentType: 'image/png',
              upsert: true,
            })

          if (uploadError) {
            const msg = uploadError.message?.toLowerCase() || ''
            if (msg.includes('row-level security') || msg.includes('violates') || msg.includes('policy')) {
              finalError = uploadError
              continue
            }
            throw uploadError
          }

          finalFilePath = candidatePath
          finalError = null
          break
        } catch (err) {
          finalError = err
        }
      }

      if (finalError || !finalFilePath) {
        throw finalError || new Error('All upload paths violated storage row-level security policies')
      }

      const { data } = supabase.storage
        .from('profile')
        .getPublicUrl(finalFilePath)

      const publicUrl = data.publicUrl

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })

      if (metadataError) throw metadataError

      toastSuccess('Avatar photo updated successfully!')
      setCroppingImage(null)
      queryClient.invalidateQueries({ queryKey: ['user-activity', user.id] })
    } catch (err) {
      console.error(err)
      toastError(err instanceof Error ? err.message : 'Failed to crop and upload photo')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // File loading for post image cropper
  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPostImageSrc(reader.result as string)
      setPostCropZoom(1)
      setPostCropPosition({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // Clear input
  }

  // Post cropper mouse event handlers
  const handlePostMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setPostIsDragging(true)
    setPostDragStart({ x: e.clientX - postCropPosition.x, y: e.clientY - postCropPosition.y })
  }

  const handlePostMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!postIsDragging) return
    setPostCropPosition({ x: e.clientX - postDragStart.x, y: e.clientY - postDragStart.y })
  }

  const handlePostMouseUp = () => {
    setPostIsDragging(false)
  }

  // Post cropper touch event handlers (mobile support)
  const handlePostTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return
    setPostIsDragging(true)
    const touch = e.touches[0]
    setPostDragStart({ x: touch.clientX - postCropPosition.x, y: touch.clientY - postCropPosition.y })
  }

  const handlePostTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!postIsDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPostCropPosition({ x: touch.clientX - postDragStart.x, y: touch.clientY - postDragStart.y })
  }

  const handlePostTouchEnd = () => {
    setPostIsDragging(false)
  }

  // Landscape Canvas Crop (16:9 aspect ratio)
  const handlePostCropSave = async () => {
    if (!postImageSrc) return

    try {
      const img = new Image()
      img.src = postImageSrc
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not initialize canvas context')

      ctx.clearRect(0, 0, 640, 360)
      ctx.save()

      // Map drag offset from viewport (288) to canvas (640)
      const scaleFactor = 640 / 288
      ctx.translate(320 + postCropPosition.x * scaleFactor, 180 + postCropPosition.y * scaleFactor)
      ctx.scale(postCropZoom, postCropZoom)

      const aspect = img.height / img.width
      const drawW = 640
      const drawH = 640 * aspect

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

      // Convert canvas output to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })

      if (!blob) throw new Error('Failed to generate cropped post image')

      setPostImageBlob(blob)
      setPostImagePreview(canvas.toDataURL('image/png'))
      setPostImageSrc(null) // Close cropper modal
      toastSuccess('Post cover image cropped successfully!')
    } catch (err) {
      console.error(err)
      toastError(err instanceof Error ? err.message : 'Failed to crop post image')
    }
  }

  if (loading || !user) {
    return <PageLoader label="Loading profile..." minHeightClassName="min-h-[40vh]" />
  }

  const initial = (displayName || user.email || 'U')[0].toUpperCase()
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-1 sm:px-6">
      <PageBackLink to="/">Back to Home</PageBackLink>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Card & Navigation */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            {/* Editable Avatar Circle */}
            <div className="relative mx-auto h-20 w-20 group">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover border border-slate-200 shadow-md"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white shadow-md uppercase">
                  {initial}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 truncate" title={displayName || 'User'}>
              {displayName || 'User'}
            </h2>
            <p className="text-xs text-slate-500 truncate" title={user.email}>
              {user.email}
            </p>

            {user.user_metadata?.dob && (
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1 inline-block border border-slate-200/50">
                  🎂 {new Date(user.user_metadata.dob).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {joinDate && (
              <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Member since {joinDate}
              </p>
            )}
          </div>

          {/* Dashboard Navigation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Dashboard Navigation
            </h3>
            <nav className="mt-3 space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Settings size={16} />
                Profile Settings
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Activity size={16} />
                Activity Feed
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'invite'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Gift size={16} />
                Invite & Earn
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('submissions')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'submissions'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText size={16} />
                My Submissions
              </button>

              {canPost && (
                <button
                  type="button"
                  onClick={() => setActiveTab('asked-questions')}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'asked-questions'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle size={16} />
                  Asked Questions
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('add-post')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'add-post'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <PlusCircle size={16} />
                {canPost ? 'Add Post' : 'Submit Article'}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('permissions')}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'permissions'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck size={16} />
                  Manage Permissions
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('banned-users')}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'banned-users'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Ban size={16} />
                  Banned Users
                </button>
              )}
            </nav>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Activity Statistics
            </h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <Heart size={16} className="text-rose-500 fill-rose-500" />
                  Likes given
                </span>
                <span className="font-semibold text-slate-900">
                  {isActivityLoading ? '…' : activity?.likes.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" />
                  Comments written
                </span>
                <span className="font-semibold text-slate-900">
                  {isActivityLoading ? '…' : activity?.comments.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings & Activity Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit settings */}
          {activeTab === 'settings' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>

              {/* Profile Fields */}
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-semibold text-slate-700">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="dob" className="block text-sm font-semibold text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 text-slate-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      isUpdatingName ||
                      (displayName.trim() === (user.user_metadata?.display_name || '') &&
                        dob === (user.user_metadata?.dob || ''))
                    }
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUpdatingName ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>

              <hr className="border-slate-100" />

              {/* Change Password */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock size={16} className="text-slate-400" />
                  Change Password
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="newPass" className="block text-xs text-slate-500">
                      New Password
                    </label>
                    <input
                      id="newPass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPass" className="block text-xs text-slate-500">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPassword}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUpdatingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'settings' && isAdmin && <AdminPendingApprovalsBanner />}
          {activeTab === 'settings' && isAdmin && <AdminPostsManager variant="preview" />}
          {activeTab === 'settings' && isAdmin && <AdminRandomCoversManager variant="preview" />}

          {/* Activity Feeds */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Your Activity Feed</h2>

              {isActivityLoading ? (
                <div className="flex justify-center py-8">
                  <CrossLoader size="md" label="Loading activity..." />
                </div>
              ) : (
                <div className="space-y-4">
                  {latestActivities.length === 0 ? (
                    <p className="text-sm text-slate-500">You haven&apos;t done any activity yet.</p>
                  ) : (
                    <ul className="space-y-4 border-l border-slate-100 pl-6">
                      {latestActivities.map((item) => (
                        <li key={item.id} className="relative group">
                          <div className="absolute -left-[28.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300 group-hover:bg-slate-500 transition-colors shadow-sm" />
                          {item.type === 'comment' ? (
                            <div>
                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <MessageSquare size={12} className="text-slate-400 shrink-0" />
                                Commented on <span className="text-slate-700 font-semibold">{item.posts?.title || 'Unknown post'}</span> • {new Date(item.created_at).toLocaleDateString()}
                              </p>
                              <p className="mt-1 text-sm text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                                &ldquo;{item.body}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" />
                                Liked <span className="text-slate-700 font-semibold">{item.posts?.title || 'Unknown post'}</span> • {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Link
                      to="/activity"
                      className="text-sm font-semibold text-slate-900 hover:text-amber-600 transition-colors flex items-center gap-1"
                    >
                      View All Activity &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invite' && <InviteRewardsPanel />}

          {activeTab === 'submissions' && <MySubmissionsPanel />}

          {/* Add Post tab */}
          {activeTab === 'asked-questions' && canPost && user && (
            <AskedQuestionsPanel userId={user.id} isAdmin={isAdmin} />
          )}

          {activeTab === 'add-post' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {canPost ? 'Add New Post' : 'Submit an Article'}
              </h2>
              {!canPost && (
                <p className="mb-4 text-sm text-slate-500">
                  Your article will be reviewed before it appears on the site. You can also use the{' '}
                  <Link to="/add-post" className="font-semibold text-slate-800 underline">
                    full writer
                  </Link>
                  .
                </p>
              )}
              {canPost && <div className="mb-4" />}
              <form onSubmit={handleAddPost} className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="postTitle" className="block text-sm font-semibold text-slate-700">
                    Post Title
                  </label>
                  <input
                    id="postTitle"
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Enter the post title"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>

                {/* Optional Image Selection */}
                <div>
                  <span className="block text-sm font-semibold text-slate-700">
                    Header Image (Optional)
                  </span>
                  
                  {postImagePreview ? (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] w-full max-w-sm group">
                      <img
                        src={postImagePreview}
                        alt="Post cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-white cursor-pointer transition-colors">
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePostFileChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPostImageBlob(null)
                            setPostImagePreview(null)
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-6 cursor-pointer hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                      <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-slate-600 transition-colors mb-1.5" />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">
                        Upload Header Image
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Supports JPG, PNG (16:9 crop)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePostFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Article pages</label>
                  <p className="mt-1 text-xs text-slate-500">
                    Organize your article into pages with descriptions, rich text, and Bible passages.
                  </p>
                  <div className="mt-2">
                    <ArticlePagesEditor value={postContent} onChange={setPostContent} />
                  </div>
                </div>

                <TagPicker value={postTag} onChange={setPostTag} />

                <KeywordMapper value={postKeywords} onChange={setPostKeywords} />

                {/* Comment control settings (Default: False/Disabled) */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <input
                    type="checkbox"
                    id="commentsEnabled"
                    checked={commentsEnabled}
                    onChange={(e) => setCommentsEnabled(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                  />
                  <label htmlFor="commentsEnabled" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Enable comments on this post (comments are off by default)
                  </label>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={addPostMutation.isPending}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {canPost ? 'Publish Post' : 'Submit for Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Manage Permissions tab */}
          {activeTab === 'permissions' && isAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Access Permissions</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Control who can add new articles and who can edit existing ones.
                </p>
              </div>

              {permissionsTableError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-start gap-2">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Database Setup Required:</span> Please ensure the permissions table is created in your database. Run the SQL commands inside <code className="rounded bg-amber-100 px-1 font-mono">supabase/migrations/003_post_permissions.sql</code> and <code className="rounded bg-amber-100 px-1 font-mono">016_permission_add_edit.sql</code> in your Supabase SQL editor.
                  </div>
                </div>
              )}

              {/* Grant access form */}
              {!permissionsTableError && (
                <div className="space-y-3">
                  <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900">
                    <span className="font-bold">Important:</span> You can only grant access to users
                    who have already registered in the app. Ask them to sign up first, then enter
                    their registered email here.
                  </p>
                  <form onSubmit={handleGrantAccess} className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={newAccessEmail}
                        onChange={(e) => setNewAccessEmail(e.target.value)}
                        placeholder="Enter user email address"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={grantPermissionMutation.isPending}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Grant Access
                    </button>
                  </form>
                </div>
              )}

              {/* Permissions list */}
              {!permissionsTableError && (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          User Email
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Can Add
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Can Edit
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-sm">
                      {allPermissions && allPermissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                            No other accounts have posting privileges yet.
                          </td>
                        </tr>
                      ) : (
                        allPermissions?.map((perm) => {
                          const canEdit = Boolean(perm.can_edit ?? perm.can_post)
                          const isSystemRoot = perm.email === 'ask@christianarmour.com'

                          return (
                            <tr key={perm.email}>
                              <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[200px]" title={perm.email}>
                                {perm.email}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${
                                    perm.can_post
                                      ? 'border-green-200/50 bg-green-50 text-green-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  {perm.can_post ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${
                                    canEdit
                                      ? 'border-green-200/50 bg-green-50 text-green-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  {canEdit ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {perm.is_admin ? 'Admin' : 'Authorized Author'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isSystemRoot ? (
                                  <span className="text-xs font-medium text-slate-400">System Root</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingPermission({
                                        email: perm.email,
                                        canAdd: !!perm.can_post,
                                        canEdit,
                                      })
                                    }
                                    className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                                    aria-label={`Manage access for ${perm.email}`}
                                    title="Update access"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <EditPermissionModal
                open={!!editingPermission}
                email={editingPermission?.email ?? ''}
                canAdd={editingPermission?.canAdd ?? false}
                canEdit={editingPermission?.canEdit ?? false}
                isSaving={updatePermissionMutation.isPending}
                onClose={() => {
                  if (!updatePermissionMutation.isPending) setEditingPermission(null)
                }}
                onSave={({ canAdd, canEdit }) => {
                  if (!editingPermission) return
                  updatePermissionMutation.mutate({
                    email: editingPermission.email,
                    can_post: canAdd,
                    can_edit: canEdit,
                  })
                }}
                onRemoveUser={() => {
                  if (!editingPermission) return
                  setRevokeEmail(editingPermission.email)
                  setEditingPermission(null)
                }}
              />

              <RevokePermissionConfirmationModal
                open={!!revokeEmail}
                email={revokeEmail ?? ''}
                isRevoking={revokePermissionMutation.isPending}
                onClose={() => {
                  if (!revokePermissionMutation.isPending) setRevokeEmail(null)
                }}
                onConfirm={() => {
                  if (revokeEmail) revokePermissionMutation.mutate(revokeEmail)
                }}
              />
            </div>
          )}

          {activeTab === 'banned-users' && isAdmin && <AdminBannedUsersManager />}
        </div>
      </div>

      {/* Avatar Preview Crop Modal */}
      {croppingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Crop Profile Photo</h3>
              <p className="mt-1 text-xs text-slate-500">
                Drag the photo to reposition and use the zoom slider below to frame it.
              </p>
            </div>

            {/* Circle Cropping Viewport */}
            <div
              className="relative mx-auto h-64 w-64 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-50 cursor-move touch-none select-none shadow-inner"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={croppingImage}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '256px',
                  height: 'auto',
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                }}
              />
              {/* Highlight Circle Overlay Grid */}
              <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
            </div>

            {/* Slider zoom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCroppingImage(null)}
                disabled={isUploadingAvatar}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropAndUpload}
                disabled={isUploadingAvatar}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <>
                    <CrossSpinner size="xs" />
                    Uploading…
                  </>
                ) : (
                  'Save Photo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Image Preview Crop Modal (16:9 aspect ratio) */}
      {postImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Crop Post Cover Image</h3>
              <p className="mt-1 text-xs text-slate-500">
                Drag the photo to reposition and zoom to frame it in a landscape aspect ratio.
              </p>
            </div>

            {/* 16:9 Cropping Viewport */}
            <div
              className="relative mx-auto h-[162px] w-72 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 cursor-move touch-none select-none shadow-inner"
              onMouseDown={handlePostMouseDown}
              onMouseMove={handlePostMouseMove}
              onMouseUp={handlePostMouseUp}
              onMouseLeave={handlePostMouseUp}
              onTouchStart={handlePostTouchStart}
              onTouchMove={handlePostTouchMove}
              onTouchEnd={handlePostTouchEnd}
            >
              <img
                src={postImageSrc}
                alt="Post crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '288px',
                  height: 'auto',
                  transform: `translate(-50%, -50%) translate(${postCropPosition.x}px, ${postCropPosition.y}px) scale(${postCropZoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                }}
              />
              {/* Landscape overlay frame */}
              <div className="absolute inset-0 rounded-xl border border-white/30 pointer-events-none" />
            </div>

            {/* Zoom slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Zoom</span>
                <span>{Math.round(postCropZoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={postCropZoom}
                onChange={(e) => setPostCropZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPostImageSrc(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostCropSave}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Preview Confirmation Modal */}
      {showPublishPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Post Preview</h3>
              <p className="mt-1 text-xs text-slate-500">
                This is a live mockup of how the post will render on the blog feed.
              </p>
            </div>

            {/* Mockup Post Card */}
            <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm overflow-hidden text-left space-y-3 pointer-events-none select-none">
              {postImagePreview && (
                <div className="mb-4 -mx-6 -mt-6 aspect-[16/9] w-[calc(100%+3rem)] overflow-hidden border-b border-slate-100">
                  <img
                    src={postImagePreview}
                    alt={postTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <time className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <h2 className="text-xl font-semibold text-slate-900">{postTitle}</h2>
              <ArticleContent content={postContent} className="text-sm" />
              
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <span>💬 Comments:</span>
                  <span className={`font-semibold ${commentsEnabled ? 'text-green-600' : 'text-red-500'}`}>
                    {commentsEnabled ? 'Enabled' : 'Disabled (Default)'}
                  </span>
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {postTag ? getTagBySlug(postTag)?.title : 'No tag'}
                </span>
              </div>
              {postKeywords.length > 0 && (
                <p className="text-[11px] text-slate-400">
                  Keywords: {postKeywords.join(', ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishPreview(false)}
                disabled={addPostMutation.isPending}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={addPostMutation.isPending}
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {addPostMutation.isPending ? (
                  <>
                    <CrossSpinner size="xs" />
                    {canPost ? 'Publishing…' : 'Submitting…'}
                  </>
                ) : canPost ? (
                  'Confirm & Publish'
                ) : (
                  'Confirm & Submit for Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
