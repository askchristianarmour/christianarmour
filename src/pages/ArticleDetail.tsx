import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Heart, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AuthRequiredModal } from '../components/AuthRequiredModal'
import { PageLoader } from '../components/CrossLoader'
import { Seo } from '../components/Seo'
import { CommentSection } from '../components/CommentSection'
import { PostCoverImage } from '../components/PostCoverImage'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { usePostLike } from '../hooks/usePostLike'
import { logView } from '../lib/analytics'
import { ArticleContent } from '../components/ArticleContent'
import { getExcerptFromContent, getReadingMinutes } from '../lib/article-content'
import { fetchPostById } from '../lib/posts'
import { absoluteUrl, SITE_NAME } from '../lib/seo'
import { supabase } from '../lib/supabase'
import { ArticleAdminActions } from '../components/ArticleAdminActions'
import { useIsAdmin } from '../hooks/useUserPermissions'

export function ArticleDetail() {
  const { postId = '' } = useParams()
  const { user } = useAuth()
  const { isAdmin } = useIsAdmin()
  const { success: toastSuccess, error: toastError } = useToast()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)

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
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#faf8f4]">
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
          <PageLoader label="Loading article..." />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#faf8f4]">
        <div className="mx-auto max-w-[1240px] px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-slate-600">This article could not be found.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-[#1c2b3a] underline">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

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
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#faf8f4]">
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#1c2b3a]"
          >
            <ChevronLeft size={16} />
            Back to articles
          </Link>

          {isAdmin && (
            <div className="mt-4">
              <ArticleAdminActions postId={post.id} postTitle={post.title} />
            </div>
          )}

          <article className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">
                  Article
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900 sm:text-5xl">
                  {post.title}
                </h1>
                <ArticleContent content={post.content} className="mt-5" />

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <img src="/home/account.svg" alt="" className="h-4 w-4" />
                    Christian Armour
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <img src="/home/Calendar,Schedule.svg" alt="" className="h-4 w-4" />
                    {formattedDate}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-4 w-4" />
                    {readingTime} mins read
                  </span>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={likeState.toggleLike}
                    disabled={likeState.isPending}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      likeState.userLiked
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
                    }`}
                  >
                    <Heart size={16} fill={likeState.userLiked ? 'currentColor' : 'none'} />
                    {likeState.likeCount} {likeState.likeCount === 1 ? 'Like' : 'Likes'}
                  </button>

                  <a
                    href="#comments"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    <MessageCircle size={16} />
                    {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
                  </a>
                </div>
              </div>

              <PostCoverImage
                imageUrl={post.image_url}
                title={post.title}
                className="min-h-[320px]"
                titleClassName="max-w-xl font-serif text-4xl leading-tight text-slate-700"
              />
            </div>
          </article>

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
    </>
  )
}
