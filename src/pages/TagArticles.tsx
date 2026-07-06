import { Navigate, useParams } from 'react-router-dom'
import { isArticleTagSlug } from '../lib/tags'

export function TagArticles() {
  const { tag: tagParam = '' } = useParams()

  if (!isArticleTagSlug(tagParam)) {
    return <Navigate to="/articles" replace />
  }

  return <Navigate to={`/articles?tag=${tagParam}`} replace />
}
