import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArticleListCard } from './ArticleListCard'
import { assignAdjacentCoverImages } from '../lib/cover-images'
import { useFallbackCoverPool } from '../hooks/useFallbackCoverPool'
import { fetchRelatedPostsByTag } from '../lib/posts'
import { getTagBySlug, isArticleTagSlug } from '../lib/tags'

type Props = {
  postId: string
  tag: string | null | undefined
}

export function RelatedArticles({ postId, tag }: Props) {
  const validTag = tag && isArticleTagSlug(tag) ? tag : null
  const category = getTagBySlug(validTag)

  const { data: relatedPosts = [], isLoading } = useQuery({
    queryKey: ['related-posts', validTag, postId],
    queryFn: () => fetchRelatedPostsByTag(validTag!, postId, 3),
    enabled: !!validTag && !!postId,
  })
  const { data: coverPool } = useFallbackCoverPool()
  const coverById = useMemo(
    () => assignAdjacentCoverImages(relatedPosts, coverPool),
    [relatedPosts, coverPool]
  )

  if (!validTag || isLoading || relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-sans text-[12.21px] font-bold uppercase leading-none tracking-normal text-[#D4AF37]">
            Related Articles
          </p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900 sm:text-4xl">
            More in {category?.title ?? 'this category'}
          </h2>
        </div>
        <Link
          to={`/articles?tag=${validTag}`}
          className="text-sm font-medium text-[#1f2f3d] underline-offset-2 hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 justify-items-stretch gap-3 sm:justify-items-start sm:gap-[12.21px] lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <ArticleListCard key={post.id} post={post} coverImageUrl={coverById[post.id]} />
        ))}
      </div>
    </section>
  )
}
