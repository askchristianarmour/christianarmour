import { ArticlePagesView } from './ArticlePagesView'

type Props = {
  content: string
  className?: string
  showPageNav?: boolean
}

export function ArticleContent({ content, className = '', showPageNav = true }: Props) {
  return <ArticlePagesView content={content} className={className} showPageNav={showPageNav} />
}
