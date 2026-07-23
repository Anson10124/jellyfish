'use client';

import { useEffect, useState } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import { useTranslation } from '@/hooks/use-translation';
import type { Episode, TvSeasonDetails } from '@/types/media';

export interface UseTvSeasonDetailsReturn {
  episodes: Episode[];
  loading: boolean;
  error: Error | null;
}

export function useTvSeasonDetails(
  tvId: string | number | undefined,
  seasonNumber: number | undefined
): UseTvSeasonDetailsReturn {
  const { tmdbLanguage } = useTranslation();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tvId || seasonNumber === undefined) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    TmdbApi.getTvSeasonDetails<TvSeasonDetails>(tvId, seasonNumber, tmdbLanguage)
      .then((data) => {
        if (!isMounted) return;
        setEpisodes(data.episodes || []);
      })
      .catch((err) => {
        console.error('Failed to fetch season episodes:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setEpisodes([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tvId, seasonNumber, tmdbLanguage]);

  return { episodes, loading, error };
}

export default useTvSeasonDetails;
