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
    month: 'short',
    day: 'numeric',
  })
  const readMins = getReadingMinutes(post.content)
  const excerpt = getExcerptFromContent(post.content, 110)

  const articleLinkState = {
    from: `${location.pathname}${location.search}`,
    fromLabel: 'Back to articles',
  }

  useRefTagger([post.id, post.content])

  useEffect(() => {
    window.setTimeout(() => window.refTagger?.tag?.(), 80)
  }, [post.id, post.content])

  return (
    <article className="flex h-[388.51px] w-full max-w-[312.95px] shrink-0 flex-col overflow-hidden rounded-[12.21px] bg-white shadow-[0_3.05px_3.05px_rgba(0,0,0,0.15)]">
      <div className="relative h-[168px] w-full shrink-0 overflow-hidden bg-[#f4efe7]">
        <Link
          to={`/articles/${post.id}`}
          state={articleLinkState}
          className="absolute inset-0 block"
        >
          <PostCoverImage
            imageUrl={post.image_url}
            title={post.title}
            className="h-full min-h-[168px] w-full"
            titleClassName="font-serif text-2xl leading-tight text-slate-700"
          />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
        {tag ? (
          <Link
            to={`/articles?tag=${tag.slug}`}
            className="font-sans text-[12.21px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] hover:text-[#c49a2e]"
          >
            {tag.title}
          </Link>
        ) : (
          <span className="h-[12.21px]" aria-hidden />
        )}

        <Link to={`/articles/${post.id}`} state={articleLinkState} className="mt-3 block">
          <h2 className="line-clamp-2 font-serif text-[28px] font-semibold leading-none tracking-normal text-[#1D2B34] transition-colors hover:text-[#15222a]">
            {post.title}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-5 text-slate-500">{excerpt}</p>

        <div className="mt-4 flex min-h-5 items-center gap-[12.21px]">
          <div className="flex min-w-0 flex-1 items-center gap-[12.21px] overflow-hidden font-sans text-[13px] font-normal leading-5 tracking-normal text-[#5F6368]">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <img src="/home/Calendar,Schedule.svg" alt="" className="h-5 w-5 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-5 w-5 shrink-0" />
              {readMins} mins read
            </span>
          </div>

          <Link
            to={`/articles/${post.id}`}
            state={articleLinkState}
            className="group/arrow mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#faf8f4] transition-all hover:border-[#D4AF37]/50 hover:bg-[#faf5e8]"
            aria-label={`Read ${post.title}`}
          >
            <img
              src="/home/noverticalhorizontalarrowiconyellow.svg"
              alt=""
              className="h-3.5 w-3.5 -rotate-45 transition-transform group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  )
}
