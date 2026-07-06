import { useInfiniteQuery } from '@tanstack/react-query'
import {
  fetchPostsPage,
  fetchPostsPageBySearch,
  fetchPostsPageByTag,
  type InfinitePostsResponse,
} from '../lib/posts'
import type { ArticleTagSlug } from '../lib/tags'

type FilterOptions = {
  tag: ArticleTagSlug | null
  search: string | null
}

export function useFilteredPosts({ tag, search }: FilterOptions) {
  const normalizedSearch = search?.trim() || null

  const queryKey = normalizedSearch
    ? ['posts-by-search', normalizedSearch]
    : tag
      ? ['posts-by-tag', tag]
      : ['posts']

  return useInfiniteQuery<InfinitePostsResponse, Error>({
    queryKey,
    queryFn: ({ pageParam }) => {
      if (normalizedSearch) {
        return fetchPostsPageBySearch(normalizedSearch, pageParam as number)
      }
      if (tag) {
        return fetchPostsPageByTag(tag, pageParam as number)
      }
      return fetchPostsPage(pageParam as number)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
