import { useState, useEffect, useRef } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import type { MediaItem } from '@/types/media';
import { useTranslation } from '@/hooks/ui/use-translation';

export interface SearchResult {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
}

export function useSearch(query: string, debounceMs = 300) {
  const { tmdbLanguage } = useTranslation();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await TmdbApi.searchMulti<MediaItem>(trimmed, 1, tmdbLanguage);

        if (controller.signal.aborted) return;

        const filtered: SearchResult[] = (res.results || [])
          .filter(
            (item) =>
              item.media_type === 'movie' || item.media_type === 'tv'
          )
          .slice(0, 8)
          .map((item) => ({
            id: Number(item.id),
            title: (item.title || item.name || 'Unknown') as string,
            media_type: item.media_type as 'movie' | 'tv',
            poster_path: item.poster_path,
            release_date: item.release_date || item.first_air_date,
            vote_average: item.vote_average,
          }));

        setResults(filtered);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Search error:', err);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, tmdbLanguage, debounceMs]);

  const clearResults = () => {
    setResults([]);
    setLoading(false);
  };

  return { results, loading, clearResults };
}
