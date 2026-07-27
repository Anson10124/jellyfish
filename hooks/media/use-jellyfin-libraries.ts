'use client';

import { useState, useEffect, useCallback } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import type { JellyfinUserView } from '@/types/jellyfin';

export function useJellyfinLibraries() {
  const { jellyfinConfig, isConnected } = useServerConfig();
  const [libraries, setLibraries] = useState<JellyfinUserView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLibraries = useCallback(async () => {
    if (!jellyfinConfig || !jellyfinConfig.serverUrl || !jellyfinConfig.userId || !jellyfinConfig.accessToken) {
      setLibraries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const views = await JellyfinService.getUserViews(
        jellyfinConfig.serverUrl,
        jellyfinConfig.userId,
        jellyfinConfig.accessToken
      );
      const filtered = views.filter((lib) => {
        const type = lib.CollectionType?.toLowerCase();
        return type === 'movies' || type === 'tvshows';
      });
      setLibraries(filtered);
    } catch (err: any) {
      console.error('Failed to fetch Jellyfin libraries:', err);
      setError(err?.message || 'Failed to load libraries');
    } finally {
      setLoading(false);
    }
  }, [jellyfinConfig]);

  useEffect(() => {
    if (isConnected) {
      fetchLibraries();
    } else {
      setLibraries([]);
      setLoading(false);
    }
  }, [isConnected, fetchLibraries]);

  return {
    libraries,
    loading,
    error,
    refetch: fetchLibraries,
    isConnected,
    serverUrl: jellyfinConfig?.serverUrl,
  };
}
