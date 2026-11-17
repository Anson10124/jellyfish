import { useTmdbMedia } from '@/hooks/media/use-tmdb-media';
import { useInfiniteScroll } from '@/hooks/ui/use-infinite-scroll';
import { NETWORK_SORT_QUERIES, type NetworkSort } from '@/constants/networks';

export interface UseNetworkMediaParams {
  networkId: number | undefined;
  sort?: NetworkSort;
}

/** Infinite list of a network's TV shows, with the scroll sentinel already wired up. */
export function useNetworkMedia({ networkId, sort = 'popular' }: UseNetworkMediaParams) {
  const {
    slides: items,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    totalResults,
  } = useTmdbMedia({
    mediaType: 'tv',
    networkId,
    sortQuery: NETWORK_SORT_QUERIES[sort],
    infinite: true,
  });

  const observerRef = useInfiniteScroll({
    hasMore,
    loading,
    loadingMore,
    onLoadMore: loadMore,
  });

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    totalResults,
    observerRef,
  };
}

export default useNetworkMedia;
