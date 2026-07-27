import { useEffect, useState } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export interface UseJellyfinAvailabilityOptions {
  id: string;
  title?: string;
  year?: number | null;
  mediaType?: 'movie' | 'tv';
}

export function useJellyfinAvailability({
  id,
  title,
  year,
  mediaType = 'movie',
}: UseJellyfinAvailabilityOptions) {
  const { jellyfinConfig, isConnected } = useServerConfig();
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [jellyfinItem, setJellyfinItem] = useState<JellyfinBaseItem | null>(null);

  useEffect(() => {
    if (!isConnected || !jellyfinConfig || !jellyfinConfig.serverUrl || !jellyfinConfig.userId || !jellyfinConfig.accessToken || !id) {
      setIsAvailable(false);
      setJellyfinItem(null);
      setIsChecking(false);
      return;
    }

    let isMounted = true;
    setIsChecking(true);

    const { serverUrl, userId, accessToken } = jellyfinConfig;
    const includeType = mediaType === 'tv' ? 'Series' : 'Movie';

    async function checkAvailability() {
      // 1. If id looks like a Jellyfin GUID, try direct getItem
      if (/^[a-f0-9]{32}$/i.test(id) || /^[a-f0-9-]{36}$/i.test(id)) {
        try {
          const directItem = await JellyfinService.getItem(serverUrl, userId, accessToken, id);
          if (directItem && directItem.Id && isMounted) {
            setJellyfinItem(directItem);
            setIsAvailable(true);
            setIsChecking(false);
            return;
          }
        } catch {
          // ignore & continue to ProviderId search
        }
      }

      // 2. Search Jellyfin items by TMDB ProviderId & Title
      try {
        const providerRes = await JellyfinService.searchByProviderId(
          serverUrl,
          userId,
          accessToken,
          'tmdb',
          id,
          includeType,
          title
        );

        if (providerRes?.Items && providerRes.Items.length > 0 && isMounted) {
          setJellyfinItem(providerRes.Items[0]);
          setIsAvailable(true);
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.warn('ProviderId search failed:', err);
      }

      // 3. Fallback search by Title & Year
      if (title) {
        try {
          const titleRes = await JellyfinService.getItems(serverUrl, userId, accessToken, {
            includeItemTypes: includeType,
            recursive: true,
            limit: 20,
          });

          const cleanTitle = title.toLowerCase().trim();
          const match = (titleRes?.Items || []).find((item) => {
            const itemTitle = item.Name?.toLowerCase().trim();
            const yearMatch = !year || !item.ProductionYear || item.ProductionYear === year;
            return itemTitle === cleanTitle && yearMatch;
          });

          if (match && isMounted) {
            setJellyfinItem(match);
            setIsAvailable(true);
            setIsChecking(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      if (isMounted) {
        setIsAvailable(false);
        setJellyfinItem(null);
        setIsChecking(false);
      }
    }

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [isConnected, jellyfinConfig, id, title, year, mediaType]);

  return { isAvailable, isChecking, jellyfinItem };
}

export default useJellyfinAvailability;
