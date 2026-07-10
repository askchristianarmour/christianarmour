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
    <article className="flex h-auto min-h-0 w-full max-w-none flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_3.05px_3.05px_rgba(0,0,0,0.15)] sm:h-[388.51px] sm:max-w-[312.95px] sm:shrink-0 sm:rounded-[12.21px]">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#f4efe7] sm:aspect-auto sm:h-[168px]">
        <Link
          to={`/articles/${post.id}`}
          state={articleLinkState}
          className="absolute inset-0 block"
        >
          <PostCoverImage
            imageUrl={post.image_url}
            title={post.title}
            className="h-full min-h-full w-full sm:min-h-[168px]"
            titleClassName="font-serif text-base leading-tight text-slate-700 sm:text-2xl"
          />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2.5 py-3 sm:px-3 sm:py-4">
        {tag ? (
          <Link
            to={`/articles?tag=${tag.slug}`}
            className="font-sans text-[10px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] hover:text-[#c49a2e] sm:text-[12.21px]"
          >
            {tag.title}
          </Link>
        ) : (
          <span className="hidden h-[12.21px] sm:block" aria-hidden />
        )}

        <Link to={`/articles/${post.id}`} state={articleLinkState} className="mt-2 block sm:mt-3">
          <h2 className="line-clamp-2 font-serif text-base font-semibold leading-tight tracking-normal text-[#1D2B34] transition-colors hover:text-[#15222a] sm:text-[28px] sm:leading-none">
            {post.title}
          </h2>
        </Link>

        <p className="mt-2 hidden line-clamp-2 flex-1 text-sm leading-5 text-slate-500 sm:mt-3 sm:block">
          {excerpt}
        </p>

        <div className="mt-3 flex min-h-5 items-center gap-2 sm:mt-4 sm:gap-[12.21px]">
          <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden font-sans text-[11px] font-normal leading-4 tracking-normal text-[#5F6368] sm:flex-row sm:items-center sm:gap-[12.21px] sm:text-[13px] sm:leading-5">
            <span className="inline-flex min-w-0 items-center gap-1 sm:gap-1.5">
              <img src="/home/Calendar,Schedule.svg" alt="" className="h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" />
              <span className="truncate">{formattedDate}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-1.5">
              <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" />
              {readMins} mins
            </span>
          </div>

          <Link
            to={`/articles/${post.id}`}
            state={articleLinkState}
            className="group/arrow flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#faf8f4] transition-all hover:border-[#D4AF37]/50 hover:bg-[#faf5e8] sm:mr-2 sm:h-8 sm:w-8"
            aria-label={`Read ${post.title}`}
          >
            <img
              src="/home/noverticalhorizontalarrowiconyellow.svg"
              alt=""
              className="h-3 w-3 -rotate-45 transition-transform group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5 sm:h-3.5 sm:w-3.5"
            />
          </Link>
        </div>
      </div>
    </article>
  )
}
