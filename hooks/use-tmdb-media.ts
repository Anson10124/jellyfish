import { useCallback, useEffect, useState } from 'react';
import { TmdbApi, type TmdbPaginatedResponse } from '@/lib/api/tmdb';
import type { MediaItem } from '@/types/media';
import { MOVIE_TO_TV_GENRE_MAP, TV_TO_MOVIE_GENRE_MAP } from '@/constants/genres';
import { useTranslation } from '@/hooks/use-translation';
import { interleaveMediaItems } from '@/lib/utils/media-format';

export interface UseTmdbMediaOptions {
  type?: 'popular' | 'trending' | 'top_rated';
  timeWindow?: 'day' | 'week';
  mediaType?: 'movie' | 'tv' | 'all';
  genreId?: number;
  infinite?: boolean;
  initialItems?: MediaItem[];
}

export function useTmdbMedia({
  type = 'popular',
  timeWindow = 'day',
  mediaType = 'movie',
  genreId,
  initialItems,
}: UseTmdbMediaOptions) {
  const { tmdbLanguage } = useTranslation();
  const [fetchedSlides, setFetchedSlides] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(() => !initialItems || initialItems.length === 0);

  const slides = initialItems && initialItems.length > 0 ? initialItems : fetchedSlides;

  const fetchData = useCallback(
    async (page: number) => {
      let res: TmdbPaginatedResponse<MediaItem>;

      if (genreId) {
        if (mediaType === 'all') {
          const movieGenreId = TV_TO_MOVIE_GENRE_MAP[genreId] || genreId;
          const tvGenreId = MOVIE_TO_TV_GENRE_MAP[genreId] || genreId;

          const [movieRes, tvRes] = await Promise.all([
            TmdbApi.getByGenre<MediaItem>('movie', movieGenreId, page, tmdbLanguage).catch(() => ({
              results: [],
              page: 1,
              total_pages: 1,
              total_results: 0,
            })),
            TmdbApi.getByGenre<MediaItem>('tv', tvGenreId, page, tmdbLanguage).catch(() => ({
              results: [],
              page: 1,
              total_pages: 1,
              total_results: 0,
            })),
          ]);

          const movies = (movieRes.results || []).map((m) => ({ ...m, media_type: 'movie' }));
          const tvs = (tvRes.results || []).map((t) => ({ ...t, media_type: 'tv' }));

          res = {
            page,
            results: interleaveMediaItems(movies, tvs),
            total_pages: Math.max(movieRes.total_pages || 1, tvRes.total_pages || 1),
            total_results: (movieRes.total_results || 0) + (tvRes.total_results || 0),
          };
        } else if (mediaType === 'tv') {
          const tvGenreId = MOVIE_TO_TV_GENRE_MAP[genreId] || genreId;
          res = await TmdbApi.getByGenre<MediaItem>('tv', tvGenreId, page, tmdbLanguage);
        } else {
          const movieGenreId = TV_TO_MOVIE_GENRE_MAP[genreId] || genreId;
          res = await TmdbApi.getByGenre<MediaItem>('movie', movieGenreId, page, tmdbLanguage);
        }
      } else if (type === 'trending') {
        res = await TmdbApi.getTrending<MediaItem>(mediaType, timeWindow, page, tmdbLanguage);
      } else if (type === 'top_rated') {
        if (mediaType === 'all') {
          const [movieRes, tvRes] = await Promise.all([
            TmdbApi.getTopRated<MediaItem>('movie', page, tmdbLanguage).catch(() => ({
              results: [],
              page: 1,
              total_pages: 1,
              total_results: 0,
            })),
            TmdbApi.getTopRated<MediaItem>('tv', page, tmdbLanguage).catch(() => ({
              results: [],
              page: 1,
              total_pages: 1,
              total_results: 0,
            })),
          ]);

          const movies = (movieRes.results || []).map((m) => ({ ...m, media_type: 'movie' }));
          const tvs = (tvRes.results || []).map((t) => ({ ...t, media_type: 'tv' }));

          res = {
            page,
            results: interleaveMediaItems(movies, tvs),
            total_pages: Math.max(movieRes.total_pages || 1, tvRes.total_pages || 1),
            total_results: (movieRes.total_results || 0) + (tvRes.total_results || 0),
          };
        } else {
          res = await TmdbApi.getTopRated<MediaItem>(mediaType, page, tmdbLanguage);
        }
      } else if (mediaType === 'tv') {
        res = await TmdbApi.getPopularTV<MediaItem>(page, tmdbLanguage);
      } else {
        res = await TmdbApi.getPopularMovies<MediaItem>(page, tmdbLanguage);
      }

      return res;
    },
    [type, mediaType, timeWindow, genreId, tmdbLanguage]
  );

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      return;
    }

    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const res = await fetchData(1);

        if (isMounted && res?.results) {
          setFetchedSlides(res.results);
        }
      } catch (err) {
        console.error('Failed to fetch media items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchData, initialItems]);

  return {
    slides,
    loading,
  };
}
