import { use, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useTmdbMedia } from '@/hooks/use-tmdb-media';
import { getGenreName } from '@/constants/genres';

export interface UseGenreMediaParams {
  params: Promise<{ id: string }>;
  mediaType: 'movie' | 'tv';
}

export function useGenreMedia({ params, mediaType }: UseGenreMediaParams) {
  const resolvedParams = use(params);
  const genreIdNum = parseInt(resolvedParams.id, 10);
  const validGenreId = isNaN(genreIdNum) ? undefined : genreIdNum;

  const { t } = useTranslation();
  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    slides: items,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useTmdbMedia({
    type: 'popular',
    mediaType,
    genreId: validGenreId,
    infinite: true,
  });

  const fallbackTitle = mediaType === 'tv' ? t('tv.title', 'TV Shows') : t('common.movies', 'Movies');
  const genreTitle = validGenreId ? getGenreName(validGenreId, t) : fallbackTitle;

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  return {
    genreTitle,
    items,
    loading,
    loadingMore,
    hasMore,
    observerRef,
  };
}
