'use client';

import { useCallback } from 'react';
import { JellyfinService } from '@/services/jellyfin.service';
import { useJellyfinSection } from './use-jellyfin-section';

export function useContinueWatching(limit: number = 12) {
  const fetcher = useCallback(
    (serverUrl: string, userId: string, token: string, limitVal: number) =>
      JellyfinService.getResumeItems(serverUrl, userId, token, { limit: limitVal }),
    []
  );
  return useJellyfinSection(fetcher, limit);
}

export default useContinueWatching;
