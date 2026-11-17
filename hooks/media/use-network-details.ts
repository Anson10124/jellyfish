'use client';

import { useEffect, useState } from 'react';
import { TmdbApi } from '@/lib/api/tmdb';
import type { NetworkDetails } from '@/types/media';

export interface UseNetworkDetailsReturn {
  network: NetworkDetails | null;
  loading: boolean;
  error: Error | null;
}

export function useNetworkDetails(networkId: number | undefined | null): UseNetworkDetailsReturn {
  const [network, setNetwork] = useState<NetworkDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(!!networkId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!networkId) return;

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    TmdbApi.getNetworkDetails<NetworkDetails>(networkId)
      .then((data) => {
        if (isMounted) setNetwork(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(`Failed to fetch network ${networkId}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to load network'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [networkId]);

  return { network, loading, error };
}

export default useNetworkDetails;
