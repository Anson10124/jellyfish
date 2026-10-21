import { useEffect, useRef } from 'react';
import { getScrollRoot } from '@/lib/utils/scroll-root';

export interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
  rootMargin = '400px',
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      // Observe against the glass scroll container when there is one, so rootMargin preloads inside it
      { root: getScrollRoot(), rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, onLoadMore, rootMargin]);

  return observerRef;
}

export default useInfiniteScroll;
