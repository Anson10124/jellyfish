'use client';

import { useEffect, useState } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import { useTranslation } from '@/hooks/ui/use-translation';
import { toast } from '@/components/ui/toast';
import type { PersonDetails, PersonCastCredit, PersonCrewCredit } from '@/types/media';

export interface UsePersonDetailsReturn {
  person: PersonDetails | null;
  loading: boolean;
  error: Error | null;
  topBackdropUrl: string | null;
  knownForCredits: (PersonCastCredit | PersonCrewCredit)[];
  actingCredits: PersonCastCredit[];
  crewCredits: PersonCrewCredit[];
}

export function usePersonDetails(id: string | number | undefined): UsePersonDetailsReturn {
  const { t, tmdbLanguage } = useTranslation();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    TmdbApi.getPersonDetails<PersonDetails>(id, tmdbLanguage)
      .then((data) => {
        if (!isMounted) return;
        setPerson(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch person details:', err);
        const errObj = err instanceof Error ? err : new Error('Failed to load person details');
        setError(errObj);
        toast.error(
          t('errors.fetchFailed', 'Failed to load data'),
          errObj.message
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, tmdbLanguage, t]);

  const allCast = person?.combined_credits?.cast || [];
  const allCrew = person?.combined_credits?.crew || [];

  const actingCredits = [...allCast].sort((a, b) => {
    const scoreA = (a.vote_count || 0) * (a.vote_average || 0);
    const scoreB = (b.vote_count || 0) * (b.vote_average || 0);
    return scoreB - scoreA;
  });

  const crewCredits = [...allCrew].sort((a, b) => {
    const scoreA = (a.vote_count || 0) * (a.vote_average || 0);
    const scoreB = (b.vote_count || 0) * (b.vote_average || 0);
    return scoreB - scoreA;
  });

  const combined = [...allCast, ...allCrew];
  const uniqueItemsMap = new Map<string, PersonCastCredit | PersonCrewCredit>();
  combined.forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, item);
    }
  });

  const knownForCredits = Array.from(uniqueItemsMap.values())
    .filter((item) => item.poster_path || item.backdrop_path)
    .sort((a, b) => {
      const popA = (a.vote_count || 0) + ((a.popularity as number | undefined) || 0);
      const popB = (b.vote_count || 0) + ((b.popularity as number | undefined) || 0);
      return popB - popA;
    })
    .slice(0, 16);

  const topItemWithBackdrop = Array.from(uniqueItemsMap.values())
    .filter((item) => item.backdrop_path)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))[0];

  const topBackdropUrl = topItemWithBackdrop?.backdrop_path || null;

  return {
    person,
    loading,
    error,
    topBackdropUrl,
    knownForCredits,
    actingCredits,
    crewCredits,
  };
}

export default usePersonDetails;
