import { ArticlePagesView } from './ArticlePagesView'

type Props = {
  content: string
  className?: string
  showPageNav?: boolean
  /** Dark wood reading surface (article detail). */
  woodSurface?: boolean
}

export function ArticleContent({
  content,
  className = '',
  showPageNav = true,
  woodSurface = false,
}: Props) {
  return (
    <ArticlePagesView
      content={content}
      className={className}
      showPageNav={showPageNav}
      woodSurface={woodSurface}
    />
  )
}
