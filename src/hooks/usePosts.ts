import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPostsPage, type InfinitePostsResponse } from '../lib/posts'

export function usePosts() {
  return useInfiniteQuery<InfinitePostsResponse, Error>({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

