import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User as UserIcon, Lock, Heart, MessageSquare, Shield, ChevronLeft, Camera } from 'lucide-react'

interface ActivityLike {
  id: string
  post_id: string
  user_id: string
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

export function Profile() {
  const { user, loading } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Profile fields state
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

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
        .select('id, post_id, user_id, posts(title)')
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

  // File loading for cropper
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

  // Cropper mouse event handlers
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

  // Cropper touch event handlers (mobile support)
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

  // Canvas Crop & Supabase Storage Upload
  const handleCropAndUpload = async () => {
    if (!croppingImage || !user) return
    setIsUploadingAvatar(true)

    try {
      // Load image into HTMLImageElement
      const img = new Image()
      img.src = croppingImage
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // Create cropped Canvas
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not initialize canvas context')

      ctx.clearRect(0, 0, 256, 256)

      // Apply drag offset and zoom transformations
      ctx.save()
      ctx.translate(128 + position.x, 128 + position.y)
      ctx.scale(zoom, zoom)

      const aspect = img.height / img.width
      const drawW = 256
      const drawH = 256 * aspect

      // Draw image centered at the translated coordinate
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

      // Convert Canvas to File Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })

      if (!blob) throw new Error('Failed to generate cropped image')

      // Upload file to Supabase S3 bucket (profile bucket, trying multiple paths to respect RLS policies)
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
            // Check if it's an RLS error
            const msg = uploadError.message?.toLowerCase() || ''
            if (msg.includes('row-level security') || msg.includes('violates') || msg.includes('policy')) {
              finalError = uploadError
              continue
            }
            throw uploadError
          }

          // If success, store data and break
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

      // Retrieve public URL from bucket
      const { data } = supabase.storage
        .from('profile')
        .getPublicUrl(finalFilePath)

      const publicUrl = data.publicUrl

      // Save public URL in Supabase user metadata
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

  if (loading || !user) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        <span className="animate-pulse">Loading profile…</span>
      </div>
    )
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Home
        </Link>
      </div>

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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
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
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
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
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isUpdatingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Feeds */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Activity Feed</h2>

            {isActivityLoading ? (
              <p className="text-sm text-slate-500 animate-pulse">Loading activity...</p>
            ) : (
              <div className="space-y-6">
                {/* Recent Comments */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                    <MessageSquare size={16} className="text-slate-400" />
                    Recent Comments
                  </h3>
                  {activity?.comments.length === 0 ? (
                    <p className="text-xs text-slate-400 pl-6">You haven&apos;t commented on any posts yet.</p>
                  ) : (
                    <ul className="space-y-3 pl-6 border-l border-slate-100">
                      {activity?.comments.map((comment) => (
                        <li key={comment.id} className="relative group">
                          <div className="absolute -left-[28.5px] top-1.5 h-2 w-2 rounded-full bg-slate-300 group-hover:bg-slate-600 transition-colors" />
                          <p className="text-xs text-slate-400 font-medium">
                            On <span className="text-slate-700 font-semibold">{comment.posts?.title || 'Unknown post'}</span> • {new Date(comment.created_at).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-sm text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                            &ldquo;{comment.body}&rdquo;
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* Liked Posts */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                    <Heart size={16} className="text-slate-400" />
                    Liked Posts
                  </h3>
                  {activity?.likes.length === 0 ? (
                    <p className="text-xs text-slate-400 pl-6">You haven&apos;t liked any posts yet.</p>
                  ) : (
                    <ul className="space-y-2 pl-6 border-l border-slate-100">
                      {activity?.likes.map((like) => (
                        <li key={like.id} className="relative group flex items-center gap-2">
                          <div className="absolute -left-[28.5px] top-2 h-2 w-2 rounded-full bg-slate-300 group-hover:bg-rose-400 transition-colors" />
                          <span className="text-sm text-slate-700 font-medium hover:text-slate-900 transition-colors">
                            {like.posts?.title || 'Unknown post'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropAndUpload}
                disabled={isUploadingAvatar}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
    </div>
  )
}
