import { useQuery } from '@tanstack/react-query'
import {
  fetchPrandomCoverPool,
  LOCAL_FALLBACK_COVER_IMAGES,
} from '../lib/cover-images'

export function useFallbackCoverPool() {
  return useQuery({
    queryKey: ['prandom-cover-pool'],
    queryFn: fetchPrandomCoverPool,
    staleTime: 5 * 60_000,
    placeholderData: [...LOCAL_FALLBACK_COVER_IMAGES],
  })
}
