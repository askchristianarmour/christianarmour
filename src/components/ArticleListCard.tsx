import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import type { PostWithMeta } from '../lib/posts'
import { getExcerptFromContent, getReadingMinutes } from '../lib/article-content'
import { getTagBySlug } from '../lib/tags'
import { useRefTagger } from '../hooks/useRefTagger'
import { PostCoverImage } from './PostCoverImage'

type Props = {
  post: PostWithMeta
}

export function ArticleListCard({ post }: Props) {
  const location = useLocation()
  const tag = getTagBySlug(post.tag)
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const readMins = getReadingMinutes(post.content)
  const excerpt = getExcerptFromContent(post.content, 160)

  const articleLinkState = {
    from: `${location.pathname}${location.search}`,
    fromLabel: 'Back to articles',
  }

  useRefTagger([post.id, post.content])

  useEffect(() => {
    window.setTimeout(() => window.refTagger?.tag?.(), 80)
  }, [post.id, post.content])

  return (
    <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08),0_12px_32px_rgba(15,23,42,0.14)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.1),0_16px_40px_rgba(15,23,42,0.16)]">
      <Link to={`/articles/${post.id}`} state={articleLinkState} className="block">
        <PostCoverImage imageUrl={post.image_url} title={post.title} className="aspect-[16/10]" />
      </Link>

      <div className="p-5">
        {tag && (
          <Link
            to={`/articles?tag=${tag.slug}`}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c6a14d] hover:text-[#a8863d]"
          >
            {tag.title}
          </Link>
        )}

        <Link to={`/articles/${post.id}`} state={articleLinkState} className="mt-2 block">
          <h2 className="font-serif text-[1.65rem] leading-tight text-slate-900 transition-colors hover:text-[#1c2b3a]">
            {post.title}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{excerpt}</p>
        <Link
          to={`/articles/${post.id}`}
          state={articleLinkState}
          className="mt-1 inline-block text-sm font-semibold text-slate-400 transition-colors hover:text-slate-600"
        >
          Read more
        </Link>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <img src="/home/Calendar,Schedule.svg" alt="" className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-3.5 w-3.5" />
              {readMins} mins read
            </span>
          </div>

          <Link
            to={`/articles/${post.id}`}
            state={articleLinkState}
            className="group/arrow flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#faf8f4] shadow-sm transition-all hover:border-[#c6a14d]/50 hover:bg-[#faf5e8]"
            aria-label={`Read ${post.title}`}
          >
            <img
              src="/home/noverticalhorizontalarrowiconyellow.svg"
              alt=""
              className="h-4 w-4 -rotate-45 transition-transform group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  )
}
