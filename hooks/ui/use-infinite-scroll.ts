import { useEffect, useRef } from 'react';

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
      { rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, onLoadMore, rootMargin]);

  return observerRef;
}

export default useInfiniteScroll;
