'use client';

import { useEffect, useState } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getOfficialTrailerKey } from '@/lib/utils/media-format';
import { useTranslation } from '@/hooks/use-translation';
import type { MovieDetails, VideoItem } from '@/types/media';

export interface UseMediaDetailsReturn<T = MovieDetails> {
  media: T | null;
  logoUrl: string | null;
  trailerKey: string | null;
  loading: boolean;
}

export function useMediaDetails<T = MovieDetails>(
  id: string | number | undefined,
  mediaType: 'movie' | 'tv' = 'movie'
): UseMediaDetailsReturn<T> {
  const { tmdbLanguage } = useTranslation();
  const [media, setMedia] = useState<T | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);

    const isoLang = tmdbLanguage.split('-')[0];

    TmdbApi.getMediaDetails<T>(mediaType, id, tmdbLanguage)
      .then((data) => {
        if (!isMounted) return;
        setMedia(data);

        const castData = data as unknown as MovieDetails;
        if (castData.videos?.results) {
          const key = getOfficialTrailerKey(castData.videos.results as VideoItem[]);
          if (key) setTrailerKey(key);
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch ${mediaType} details:`, err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    TmdbApi.getImages(mediaType, id, tmdbLanguage)
      .then((res) => {
        if (!isMounted) return;
        if (res?.logos && res.logos.length > 0) {
          const matchedLogo =
            res.logos.find((l) => l.iso_639_1 === isoLang) ||
            res.logos.find((l) => l.iso_639_1 === 'en') ||
            res.logos[0];
          if (matchedLogo?.file_path) {
            setLogoUrl(getTmdbImage(matchedLogo.file_path, 'w500'));
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [id, mediaType, tmdbLanguage]);

  return { media, logoUrl, trailerKey, loading };
}

export default useMediaDetails;
