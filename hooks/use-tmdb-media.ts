import { useCallback, useEffect, useRef, useState } from 'react';
import { TmdbApi, type TmdbPaginatedResponse } from '@/lib/api/tmdb';
import type { MediaItem } from '@/components/media/carousel';
import { MOVIE_TO_TV_GENRE_MAP, TV_TO_MOVIE_GENRE_MAP } from '@/constants/genres';

export interface UseTmdbMediaOptions {
  type?: 'popular' | 'trending';
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
  infinite = true,
  initialItems,
}: UseTmdbMediaOptions) {
  const [fetchedSlides, setFetchedSlides] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(() => !initialItems || initialItems.length === 0);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(infinite);

  const slides = initialItems && initialItems.length > 0 ? initialItems : fetchedSlides;

  const isFetchingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreToLoadRef = useRef(infinite);

  const fetchData = useCallback(
    async (page: number) => {
      let res: TmdbPaginatedResponse<MediaItem>;

      if (genreId) {
        if (mediaType === 'all') {
          const movieGenreId = TV_TO_MOVIE_GENRE_MAP[genreId] || genreId;
          const tvGenreId = MOVIE_TO_TV_GENRE_MAP[genreId] || genreId;

          const [movieRes, tvRes] = await Promise.all([
            TmdbApi.getByGenre<MediaItem>('movie', movieGenreId, page).catch(() => ({
              results: [],
              page: 1,
              total_pages: 1,
              total_results: 0,
            })),
            TmdbApi.getByGenre<MediaItem>('tv', tvGenreId, page).catch(() => ({
              results: [],
              page: 1,
              total_pages: 1,
              total_results: 0,
            })),
          ]);

          const movies = (movieRes.results || []).map((m) => ({ ...m, media_type: 'movie' }));
          const tvs = (tvRes.results || []).map((t) => ({ ...t, media_type: 'tv' }));

          const combined: MediaItem[] = [];
          const maxLen = Math.max(movies.length, tvs.length);
          for (let i = 0; i < maxLen; i++) {
            if (i < movies.length) combined.push(movies[i]);
            if (i < tvs.length) combined.push(tvs[i]);
          }

          res = {
            page,
            results: combined,
            total_pages: Math.max(movieRes.total_pages || 1, tvRes.total_pages || 1),
            total_results: (movieRes.total_results || 0) + (tvRes.total_results || 0),
          };
        } else if (mediaType === 'tv') {
          const tvGenreId = MOVIE_TO_TV_GENRE_MAP[genreId] || genreId;
          res = await TmdbApi.getByGenre<MediaItem>('tv', tvGenreId, page);
        } else {
          const movieGenreId = TV_TO_MOVIE_GENRE_MAP[genreId] || genreId;
          res = await TmdbApi.getByGenre<MediaItem>('movie', movieGenreId, page);
        }
      } else if (type === 'trending') {
        res = await TmdbApi.getTrending<MediaItem>(mediaType, timeWindow, page);
      } else if (mediaType === 'tv') {
        res = await TmdbApi.getPopularTV<MediaItem>(page);
      } else {
        res = await TmdbApi.getPopularMovies<MediaItem>(page);
      }

      return res;
    },
    [type, mediaType, timeWindow, genreId]
  );

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    pageRef.current = 1;
    hasMoreToLoadRef.current = infinite;
    setHasMoreToLoad(infinite);

    const fetchInitialData = async () => {
      try {
        const res = await fetchData(1);

        if (isMounted && res?.results) {
          setFetchedSlides(res.results);
          if (res.page >= res.total_pages || res.results.length === 0) {
            setHasMoreToLoad(false);
            hasMoreToLoadRef.current = false;
          }
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
  }, [fetchData, initialItems, infinite]);

  const fetchMoreData = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreToLoadRef.current || !infinite || initialItems) return;

    isFetchingRef.current = true;
    const nextPage = pageRef.current + 1;

    try {
      const res = await fetchData(nextPage);

      if (res?.results && res.results.length > 0) {
        pageRef.current = nextPage;
        setFetchedSlides((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNew = res.results.filter((item) => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
        if (res.page >= res.total_pages) {
          setHasMoreToLoad(false);
          hasMoreToLoadRef.current = false;
        }
      } else {
        setHasMoreToLoad(false);
        hasMoreToLoadRef.current = false;
      }
    } catch (err) {
      console.error('Failed to load more media items:', err);
      setHasMoreToLoad(false);
      hasMoreToLoadRef.current = false;
    } finally {
      isFetchingRef.current = false;
    }
  }, [fetchData, infinite, initialItems]);

  return {
    slides,
    loading,
    hasMoreToLoad,
    fetchMoreData,
  };
}
