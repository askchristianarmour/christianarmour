import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArticleAdminActions } from '../components/ArticleAdminActions'
import { ArticleContent } from '../components/ArticleContent'
import { AuthRequiredModal } from '../components/AuthRequiredModal'
import { CommentSection } from '../components/CommentSection'
import { PageLoader } from '../components/CrossLoader'
import { PostCoverImage } from '../components/PostCoverImage'
import { RelatedArticles } from '../components/RelatedArticles'
import { Seo } from '../components/Seo'
import { ShareArticleModal } from '../components/ShareArticleModal'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { usePostLike } from '../hooks/usePostLike'
import { useIsAdmin } from '../hooks/useUserPermissions'
import { logView } from '../lib/analytics'
import { getExcerptFromContent, getReadingMinutes } from '../lib/article-content'
import { fetchPostById } from '../lib/posts'
import { absoluteUrl, SITE_NAME } from '../lib/seo'
import { getTagBySlug } from '../lib/tags'
import { supabase } from '../lib/supabase'

type LocationState = {
  from?: string
  fromLabel?: string
}

export function ArticleDetail() {
  const { postId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = (location.state as LocationState | null) ?? null
  const backTo = locationState?.from || '/articles'
  const backLabel =
    locationState?.fromLabel ||
    (backTo === '/' || backTo.startsWith('/?') ? 'Back to home' : 'Back to articles')
  const { user } = useAuth()
  const { isAdmin } = useIsAdmin()
  const { success: toastSuccess, error: toastError } = useToast()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const handleBack = () => {
    if (locationState?.from) {
      navigate(locationState.from)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/articles')
  }

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPostById(postId),
    enabled: !!postId,
  })

  useEffect(() => {
    if (!post) return

    const sessionKey = `viewed_${post.id}`
    const alreadyViewed = sessionStorage.getItem(sessionKey)

    if (!alreadyViewed) {
      sessionStorage.setItem(sessionKey, 'true')
      logView({
        action: 'read',
        postId: post.id,
        postTitle: post.title,
      })
    }
  }, [post])

  useEffect(() => {
    if (error) {
      toastError('Failed to load this article')
    }
  }, [error, toastError])

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        body,
      })

      if (insertError) throw insertError
    },
    onSuccess: () => {
      setCommentText('')
      toastSuccess('Comment posted successfully')
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (mutationError: Error) => {
      toastError(mutationError.message || 'Failed to add comment')
    },
  })

  const likeState = usePostLike(
    post ?? {
      id: postId,
      likes: [],
    }
  )

  const formattedDate = useMemo(() => {
    if (!post) return ''
    return new Date(post.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [post])

  const readingTime = useMemo(() => {
    if (!post) return 1
    return getReadingMinutes(post.content)
  }, [post])

  const shareUrl = useMemo(() => {
    if (!post) return ''
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/articles/${post.id}`
    }
    return absoluteUrl(`/articles/${post.id}`)
  }, [post])

  const articleSeo = useMemo(() => {
    if (!post) return null

    const description = getExcerptFromContent(post.content, 160)
    const image = post.image_url ? absoluteUrl(post.image_url) : absoluteUrl('/og-image.svg')

    return {
      title: `${post.title} | Christian Armour`,
      description,
      canonicalPath: `/articles/${post.id}`,
      image,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description,
        datePublished: post.created_at,
        dateModified: post.created_at,
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: absoluteUrl('/favicon.svg') },
        },
        image,
        mainEntityOfPage: absoluteUrl(`/articles/${post.id}`),
      },
    }
  }, [post])

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    if (!user) {
      setShowAuthModal(true)
      return
    }

    commentMutation.mutate(commentText.trim())
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
          <PageLoader label="Loading article..." />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-slate-600">This article could not be found.</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 inline-block text-sm font-medium text-[#1c2b3a] underline"
          >
            {backLabel}
          </button>
        </div>
      </div>
    )
  }

  const categoryLabel = getTagBySlug(post.tag)?.title || post.tag?.trim() || 'Article'

  return (
    <>
      {articleSeo && (
        <Seo
          title={articleSeo.title}
          description={articleSeo.description}
          canonicalPath={articleSeo.canonicalPath}
          image={articleSeo.image}
          type="article"
          jsonLd={articleSeo.jsonLd}
        />
      )}
      <div className="w-full bg-white">
        <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#1c2b3a]"
          >
            <ChevronLeft size={16} />
            {backLabel}
          </button>

          {isAdmin && (
            <div className="mt-3 sm:mt-4">
              <ArticleAdminActions postId={post.id} postTitle={post.title} />
            </div>
          )}

          <article className="mt-4 sm:mt-6">
            <div className="relative overflow-hidden rounded-[14px] sm:rounded-[20px]">
              <PostCoverImage
                imageUrl={post.image_url}
                title={post.title}
                className="aspect-[16/10] min-h-0 w-full sm:aspect-[16/9] sm:min-h-[340px] lg:min-h-[420px]"
                titleClassName="max-w-xl font-serif text-2xl leading-tight text-slate-700 sm:text-4xl"
              />

              <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-wrap items-center justify-end gap-1.5 sm:bottom-5 sm:right-5 sm:gap-3">
                <button
                  type="button"
                  onClick={likeState.toggleLike}
                  disabled={likeState.isPending}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                    likeState.userLiked
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-white/90 text-slate-800 hover:bg-white'
                  }`}
                >
                  <Heart size={14} className="sm:hidden" fill={likeState.userLiked ? 'currentColor' : 'none'} />
                  <Heart size={15} className="hidden sm:block" fill={likeState.userLiked ? 'currentColor' : 'none'} />
                  <span className="sm:inline">Like</span>
                </button>

                <a
                  href="#comments"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <MessageCircle size={14} className="sm:hidden" />
                  <MessageCircle size={15} className="hidden sm:block" />
                  Comment
                </a>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Share2 size={14} className="sm:hidden" />
                  <Share2 size={15} className="hidden sm:block" />
                  Share
                </button>
              </div>
            </div>

            <div className="mt-5 max-w-3xl sm:mt-8">
              <p className="font-sans text-[11px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] sm:text-[12.21px]">
                {categoryLabel}
              </p>
              <h1 className="mt-2 font-serif text-[1.75rem] font-bold leading-[1.15] tracking-normal text-slate-900 sm:mt-3 sm:text-[48px] sm:leading-none">
                {post.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 sm:mt-5 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
                <span>Christian Armour</span>
                <span aria-hidden className="hidden text-slate-300 sm:inline">
                  ·
                </span>
                <span>{formattedDate}</span>
                <span aria-hidden className="hidden text-slate-300 sm:inline">
                  ·
                </span>
                <span>{readingTime} mins read</span>
              </div>

              <ArticleContent content={post.content} className="mt-6 sm:mt-8" showPageNav />
            </div>
          </article>

          <RelatedArticles postId={post.id} tag={post.tag} />

          <CommentSection
            comments={post.comments}
            commentsEnabled={post.comments_enabled}
            user={user}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onSubmit={handleCommentSubmit}
            onRequireAuth={() => setShowAuthModal(true)}
            isSubmitting={commentMutation.isPending}
          />
        </div>
      </div>

      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ShareArticleModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={post.title}
        url={shareUrl}
      />
    </>
  )
}
