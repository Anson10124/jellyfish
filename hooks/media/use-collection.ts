'use client';

import { useEffect, useState } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { CollectionDetails, MediaItem } from '@/types/media';

export interface UseCollectionReturn {
  collection: CollectionDetails | null;
  parts: MediaItem[];
  loading: boolean;
  error: Error | null;
}

export function useCollection(
  collectionId: number | string | undefined | null,
  initialCollection?: CollectionDetails
): UseCollectionReturn {
  const { tmdbLanguage } = useTranslation();
  const [collection, setCollection] = useState<CollectionDetails | null>(
    initialCollection || null
  );
  const [parts, setParts] = useState<MediaItem[]>(() => {
    if (!initialCollection?.parts) return [];
    return [...initialCollection.parts].sort((a, b) => {
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
    });
  });
  const [loading, setLoading] = useState<boolean>(!initialCollection && !!collectionId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionId) return;

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    TmdbApi.getCollection<CollectionDetails>(collectionId, tmdbLanguage)
      .then((data) => {
        if (!isMounted) return;
        setCollection(data);

        const sortedParts = (data.parts || []).slice().sort((a, b) => {
          if (!a.release_date) return 1;
          if (!b.release_date) return -1;
          return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
        });
        setParts(sortedParts);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(`Failed to fetch collection ${collectionId}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to load collection'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [collectionId, tmdbLanguage]);

  return { collection, parts, loading, error };
}

export default useCollection;
