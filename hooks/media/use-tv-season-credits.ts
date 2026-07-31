'use client';

import { useEffect, useState } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { CastMember, CrewMember } from '@/types/media';

export interface TvSeasonCredits {
  cast?: CastMember[];
  crew?: CrewMember[];
}

export interface UseTvSeasonCreditsReturn {
  credits: TvSeasonCredits | null;
  loading: boolean;
  error: Error | null;
}

export function useTvSeasonCredits(
  tvId: string | number | undefined,
  seasonNumber: number | undefined | null
): UseTvSeasonCreditsReturn {
  const { tmdbLanguage } = useTranslation();
  const [credits, setCredits] = useState<TvSeasonCredits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tvId || seasonNumber === undefined || seasonNumber === null) {
      return;
    }

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    TmdbApi.getTvSeasonCredits<TvSeasonCredits>(tvId, seasonNumber, tmdbLanguage)
      .then((data) => {
        if (!isMounted) return;
        setCredits(data);
      })
      .catch((err) => {
        console.error('Failed to fetch season credits:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setCredits(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tvId, seasonNumber, tmdbLanguage]);

  return { credits, loading, error };
}

export default useTvSeasonCredits;
