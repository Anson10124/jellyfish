'use client';

import { useState, useEffect, useCallback } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { getErrorMessage } from '@/lib/utils';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export type JellyfinSectionFetcher = (
  serverUrl: string,
  userId: string,
  token: string,
  limit: number
) => Promise<JellyfinBaseItem[]>;

export function useJellyfinSection(fetcher: JellyfinSectionFetcher, limit: number = 12) {
  const { jellyfinConfig, isConnected } = useServerConfig();
  const [items, setItems] = useState<JellyfinBaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!jellyfinConfig || !jellyfinConfig.serverUrl || !jellyfinConfig.userId || !jellyfinConfig.accessToken) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetcher(
        jellyfinConfig.serverUrl,
        jellyfinConfig.userId,
        jellyfinConfig.accessToken,
        limit
      );
      setItems(data);
    } catch (err: unknown) {
      console.error('Failed to fetch Jellyfin section items:', err);
      setError(getErrorMessage(err) || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [jellyfinConfig, fetcher, limit]);

  useEffect(() => {
    if (isConnected) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [isConnected, fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    isConnected,
    serverUrl: jellyfinConfig?.serverUrl,
  };
}

export default useJellyfinSection;
