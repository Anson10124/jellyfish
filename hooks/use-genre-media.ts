import { use } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useTmdbMedia } from '@/hooks/use-tmdb-media';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
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

  const observerRef = useInfiniteScroll({
    hasMore,
    loading,
    loadingMore,
    onLoadMore: loadMore,
  });

  const fallbackTitle = mediaType === 'tv' ? t('tv.title', 'TV Shows') : t('common.movies', 'Movies');
  const genreTitle = validGenreId ? getGenreName(validGenreId, t) : fallbackTitle;

  return {
    genreTitle,
    items,
    loading,
    loadingMore,
    hasMore,
    observerRef,
  };
}

export default useGenreMedia;
