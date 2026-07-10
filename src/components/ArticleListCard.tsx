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
  const excerpt = getExcerptFromContent(post.content, 120)

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
      <Link
        to={`/articles/${post.id}`}
        state={articleLinkState}
        className="block h-[168px] w-full shrink-0 overflow-hidden"
      >
        <PostCoverImage
          imageUrl={post.image_url}
          title={post.title}
          className="h-full w-full"
          titleClassName="font-serif text-2xl leading-tight text-slate-700"
        />
      </Link>

      <div className="flex min-h-0 flex-1 flex-col gap-[12.21px] p-[12.21px]">
        {tag && (
          <Link
            to={`/articles?tag=${tag.slug}`}
            className="font-sans text-[12.21px] font-bold uppercase leading-none tracking-normal text-[#D4AF37] hover:text-[#c49a2e]"
          >
            {tag.title}
          </Link>
        )}

        <Link to={`/articles/${post.id}`} state={articleLinkState} className="block">
          <h2 className="line-clamp-2 font-serif text-[28px] font-semibold leading-none tracking-normal text-[#1D2B34] transition-colors hover:text-[#15222a]">
            {post.title}
          </h2>
        </Link>

        <p className="line-clamp-2 text-sm leading-5 text-slate-500">{excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[18px] font-normal leading-[26px] tracking-normal text-[#5F6368]">
            <span className="inline-flex h-[26px] items-center gap-2 whitespace-nowrap">
              <img src="/home/Calendar,Schedule.svg" alt="" className="h-4 w-4 shrink-0" />
              {formattedDate}
            </span>
            <span className="inline-flex h-[26px] items-center gap-2 whitespace-nowrap">
              <img src="/home/Alarm, Clock, Time.svg" alt="" className="h-4 w-4 shrink-0" />
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
