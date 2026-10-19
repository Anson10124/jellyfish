'use client';

import { useRef, useState } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { useTranslation } from '@/hooks/ui/use-translation';
import { toast } from '@/components/ui/toast';
import { SeerrService } from '@/services/seerr.service';
import type { MediaItem } from '@/types/media';

type RequestStatus = 'requested' | 'available';

export function useCollectionRequests(collectionId: string) {
  const { seerrConfig } = useServerConfig();
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>({});
  const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());
  const busy = useRef(false);
  const scope = JSON.stringify([collectionId, seerrConfig?.serverUrl, seerrConfig?.apiKey, seerrConfig?.username]);
  const getStatus = (id: MediaItem['id']) => statuses[`${scope}:${id}`];

  const requestMovies = async (movies: MediaItem[]) => {
    if (busy.current || movies.length === 0) return;
    if (!seerrConfig?.isConnected) {
      toast.info('Seerr', t('seerr.connectToRequest', 'Connect to Seerr from the user menu to request movies.'));
      return;
    }

    const pending = movies.filter((movie) => !getStatus(movie.id));
    if (pending.length === 0) return;
    busy.current = true;
    setRequestingIds(new Set(pending.map((movie) => `${scope}:${movie.id}`)));
    let failed = 0;

    try {
      // Keep submissions sequential so large collections do not flood Seerr.
      for (const movie of pending) {
        try {
          const mediaId = Number(movie.id);
          if (!Number.isSafeInteger(mediaId) || mediaId <= 0) throw new Error('Invalid movie ID');
          const info = await SeerrService.getMediaDetails(
            seerrConfig.serverUrl, seerrConfig.apiKey, mediaId, 'movie', seerrConfig.useProxy,
          );
          let status: RequestStatus;
          if (info?.status === 4 || info?.status === 5) {
            status = 'available';
          } else if (info?.status === 2 || info?.status === 3) {
            status = 'requested';
          } else {
            await SeerrService.createRequest(
              seerrConfig.serverUrl, seerrConfig.apiKey,
              { mediaType: 'movie', mediaId }, seerrConfig.useProxy,
            );
            status = 'requested';
          }
          setStatuses((previous) => ({ ...previous, [`${scope}:${movie.id}`]: status }));
        } catch {
          failed += 1;
        }
      }

      if (failed > 0) {
        toast.error('Seerr', t('seerr.collectionRequestFailed', 'Could not request {count} movie(s). Please try again.', { count: failed }));
      } else {
        toast.success('Seerr', t('seerr.collectionRequestSuccess', 'Movies requested. Available and previously requested movies were skipped.'));
      }
    } finally {
      busy.current = false;
      setRequestingIds(new Set());
    }
  };

  return {
    getStatus,
    requestMovies,
    isRequesting: requestingIds.size > 0,
    isRequestingMovie: (id: MediaItem['id']) => requestingIds.has(`${scope}:${id}`),
  };
}
