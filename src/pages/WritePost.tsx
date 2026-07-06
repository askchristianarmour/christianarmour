import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIsAdmin } from '../hooks/useUserPermissions'
import { supabase } from '../lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { ChevronLeft, Image as ImageIcon, ShieldAlert, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { CrossSpinner, PageLoader } from '../components/CrossLoader'
import { ArticleContent } from '../components/ArticleContent'
import { ArticlePagesEditor } from '../components/ArticlePagesEditor'
import {
  createDefaultArticleContent,
  hasArticleBody,
  serializeArticleContent,
} from '../lib/article-structure'
import { TagPicker } from '../components/TagPicker'
import type { ArticleTagSlug } from '../lib/tags'
import { getTagBySlug } from '../lib/tags'
import { fetchPostById, updatePost } from '../lib/posts'

export function WritePost() {
  const { postId: editPostId } = useParams()
  const isEditing = !!editPostId
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, isLoading: permLoading } = useIsAdmin()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()

  // Form State
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState(() =>
    serializeArticleContent(createDefaultArticleContent())
  )
  const [commentsEnabled, setCommentsEnabled] = useState(false)
  const [postTag, setPostTag] = useState<ArticleTagSlug | null>(null)

  // Cover Image Cropping State
  const [postImageSrc, setPostImageSrc] = useState<string | null>(null)
  const [postImageBlob, setPostImageBlob] = useState<Blob | null>(null)
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  // Cropper geometry state
  const [postCropZoom, setPostCropZoom] = useState(1)
  const [postCropPosition, setPostCropPosition] = useState({ x: 0, y: 0 })
  const [postIsDragging, setPostIsDragging] = useState(false)
  const [postDragStart, setPostDragStart] = useState({ x: 0, y: 0 })

  // Preview confirmation state
  const [showPublishPreview, setShowPublishPreview] = useState(false)

  const { data: existingPost, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', editPostId],
    queryFn: () => fetchPostById(editPostId!),
    enabled: isEditing && isAdmin,
  })

  useEffect(() => {
    if (!existingPost) return
    setPostTitle(existingPost.title)
    setPostContent(existingPost.content)
    setCommentsEnabled(existingPost.comments_enabled)
    setPostTag((existingPost.tag as ArticleTagSlug | null) ?? null)
    if (existingPost.image_url) {
      setPostImagePreview(existingPost.image_url)
      setExistingImageUrl(existingPost.image_url)
    }
  }, [existingPost])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin')
    }
  }, [user, authLoading, navigate])

  // Mutation to add a new post
  const addPostMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      content: string
      imageBlob: Blob | null
      commentsEnabled: boolean
      tag: ArticleTagSlug | null
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
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        imageUrl = data.publicUrl
      }

      const { data, error } = await supabase.from('posts').insert({
        id: postId,
        title: payload.title,
        content: payload.content,
        image_url: imageUrl,
        comments_enabled: payload.commentsEnabled,
        tag: payload.tag ?? null,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('Post published successfully!')
      setPostTitle('')
      setPostContent(serializeArticleContent(createDefaultArticleContent()))
      setCommentsEnabled(false)
      setPostTag(null)
      setPostImageSrc(null)
      setPostImageBlob(null)
      setPostImagePreview(null)
      setShowPublishPreview(false)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
      queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
      navigate('/') // Redirect to home page where post will appear in real time
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to publish post')
    },
  })

  const updatePostMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      content: string
      imageBlob: Blob | null
      commentsEnabled: boolean
      tag: ArticleTagSlug | null
      existingImageUrl: string | null
    }) => {
      if (!editPostId) throw new Error('Missing post ID')
      await updatePost(editPostId, {
        title: payload.title,
        content: payload.content,
        imageBlob: payload.imageBlob,
        existingImageUrl: payload.existingImageUrl,
        commentsEnabled: payload.commentsEnabled,
        tag: payload.tag,
      })
    },
    onSuccess: () => {
      toastSuccess('Article updated successfully!')
      setShowPublishPreview(false)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', editPostId] })
      queryClient.invalidateQueries({ queryKey: ['tag-counts'] })
      queryClient.invalidateQueries({ queryKey: ['total-post-count'] })
      navigate(`/articles/${editPostId}`)
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update article')
    },
  })

  // Cover image input change handler
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

  // Mouse event handlers for repositioning
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

  // Touch event handlers (mobile support)
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

  // Perform canvas crop
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

      // Map viewport drag size (288px) to canvas output size (640px)
      const scaleFactor = 640 / 288
      ctx.translate(320 + postCropPosition.x * scaleFactor, 180 + postCropPosition.y * scaleFactor)
      ctx.scale(postCropZoom, postCropZoom)

      const aspect = img.height / img.width
      const drawW = 640
      const drawH = 640 * aspect

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

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

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postTitle.trim()) {
      toastError('Please enter a post title')
      return
    }
    if (!hasArticleBody(postContent)) {
      toastError('Please add content or scripture to at least one page')
      return
    }
    setShowPublishPreview(true)
  }

  const handleConfirmPublish = () => {
    const payload = {
      title: postTitle.trim(),
      content: postContent.trim(),
      imageBlob: postImageBlob,
      commentsEnabled: commentsEnabled,
      tag: postTag,
    }

    if (isEditing) {
      updatePostMutation.mutate({
        ...payload,
        existingImageUrl,
      })
      return
    }

    addPostMutation.mutate(payload)
  }

  const isSaving = addPostMutation.isPending || updatePostMutation.isPending

  if (authLoading || permLoading || (isEditing && postLoading)) {
    return <PageLoader label={isEditing ? 'Loading article...' : 'Preparing editor...'} minHeightClassName="min-h-[40vh]" />
  }

  if (isEditing && (postError || !existingPost)) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Article not found</h2>
        <p className="mt-2 text-slate-600 text-sm">
          This article may have been removed or you do not have access to edit it.
        </p>
        <button
          onClick={() => navigate('/articles')}
          className="mt-6 inline-flex items-center gap-1.5 justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to Articles
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-slate-600 text-sm">
          You do not have the required administrator privileges to {isEditing ? 'edit' : 'add'} posts.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-1.5 justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in duration-300">
      <div className="mb-6">
        <Link
          to={isEditing ? `/articles/${editPostId}` : '/'}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} />
          {isEditing ? 'Back to article' : 'Back to Feed'}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="text-amber-600" size={32} />
          {isEditing ? 'Edit Article' : 'Write a New Post'}
        </h1>
        <p className="mt-1 text-slate-500 text-sm">
          {isEditing
            ? 'Update the title, cover image, content, or settings for this article.'
            : 'Draft a new article, upload a cover header, and publish it to the community.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handlePublishSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="postTitle" className="block text-sm font-semibold text-slate-700">
              Post Title
            </label>
            <input
              type="text"
              id="postTitle"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Give your post a title..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 font-semibold"
              required
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <span className="block text-sm font-semibold text-slate-700">
              Cover Image (Optional)
            </span>
            {postImagePreview ? (
              <div className="mt-2 space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50">
                  <img
                    src={postImagePreview}
                    alt="Cropped post cover"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    Change Image
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
                      setExistingImageUrl(null)
                    }}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-8 cursor-pointer hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                <ImageIcon className="h-10 w-10 text-slate-400 group-hover:text-slate-600 transition-colors mb-2" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">
                  Upload Cover Header Image
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Supports JPG, PNG (16:9 crop ratio)
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

          {/* Comment control settings */}
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
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
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              {isSaving ? (
                <>
                  <CrossSpinner size="xs" />
                  {isEditing ? 'Saving…' : 'Publishing…'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Publish Post'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Post Image Preview Crop Modal */}
      {postImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Crop Post Cover Image</h3>
              <p className="mt-1 text-xs text-slate-500">
                Drag the photo to reposition and zoom to frame it in a landscape aspect ratio.
              </p>
            </div>

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
              <div className="absolute inset-0 rounded-xl border border-white/30 pointer-events-none" />
            </div>

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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Confirm & Save Changes' : 'Confirm & Publish Post'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Review the preview of your {isEditing ? 'changes' : 'post'} before {isEditing ? 'saving' : 'publishing'}.
                </p>
              </div>
            </div>

            {/* Simulated Live Post View */}
            <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-4">
              {postImagePreview && (
                <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
                  <img
                    src={postImagePreview}
                    alt="Preview cover"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Preview Post Mode
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-1">{postTitle}</h4>
                <ArticleContent content={postContent} className="text-sm" />
              </div>
              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                <AlertCircle size={14} className="text-amber-500" />
                <span>Comments: {commentsEnabled ? 'Enabled' : 'Disabled'}</span>
                <span>Tag: {postTag ? getTagBySlug(postTag)?.title : 'None'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishPreview(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isSaving}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <CrossSpinner size="xs" />
                    {isEditing ? 'Saving…' : 'Publishing…'}
                  </>
                ) : isEditing ? (
                  'Confirm & Save'
                ) : (
                  'Confirm & Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
