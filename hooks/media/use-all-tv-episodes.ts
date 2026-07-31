'use client';

import { useEffect, useState, useMemo } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { Episode, Season, TvSeasonDetails } from '@/types/media';

export interface UseAllTvEpisodesReturn {
  episodes: Episode[];
  seasonIndices: Record<number, number>;
  loading: boolean;
  error: Error | null;
}

export function useAllTvEpisodes(
  tvId: string | number | undefined,
  seasons: Season[] | undefined
): UseAllTvEpisodesReturn {
  const { tmdbLanguage } = useTranslation();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasonIndices, setSeasonIndices] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const regularSeasons = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    return seasons.filter((s) => s.season_number > 0);
  }, [seasons]);

  const seasonNumbersKey = useMemo(() => {
    return regularSeasons.map((s) => s.season_number).join(',');
  }, [regularSeasons]);

  useEffect(() => {
    if (!tvId || regularSeasons.length === 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all(
      regularSeasons.map((s) =>
        TmdbApi.getTvSeasonDetails<TvSeasonDetails>(tvId, s.season_number, tmdbLanguage).catch(
          (err) => {
            console.warn(`Failed to fetch season ${s.season_number} details:`, err);
            return null;
          }
        )
      )
    )
      .then((results) => {
        if (!isMounted) return;

        const allEps: Episode[] = [];
        const indices: Record<number, number> = {};

        results.forEach((res, i) => {
          const seasonNum = regularSeasons[i].season_number;
          indices[seasonNum] = allEps.length;

          if (res && res.episodes && res.episodes.length > 0) {
            const epsWithSeason = res.episodes.map((ep) => ({
              ...ep,
              season_number: ep.season_number ?? seasonNum,
            }));
            allEps.push(...epsWithSeason);
          }
        });

        setEpisodes(allEps);
        setSeasonIndices(indices);
      })
      .catch((err) => {
        console.error('Failed to fetch all seasons episodes:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setEpisodes([]);
          setSeasonIndices({});
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tvId, seasonNumbersKey, tmdbLanguage]);

  return { episodes, seasonIndices, loading, error };
}

export default useAllTvEpisodes;
