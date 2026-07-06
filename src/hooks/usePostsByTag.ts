import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPostsPageByTag, type InfinitePostsResponse } from '../lib/posts'
import type { ArticleTagSlug } from '../lib/tags'

export function usePostsByTag(tag: ArticleTagSlug) {
  return useInfiniteQuery<InfinitePostsResponse, Error>({
    queryKey: ['posts-by-tag', tag],
    queryFn: ({ pageParam }) => fetchPostsPageByTag(tag, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
