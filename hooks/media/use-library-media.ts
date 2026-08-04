import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { useInfiniteScroll } from '@/hooks/ui/use-infinite-scroll';
import type { JellyfinBaseItem } from '@/types/jellyfin';
import { getErrorMessage } from '@/lib/utils';

export interface UseLibraryMediaParams {
  params: Promise<{ id: string }>;
}

export function useLibraryMedia({ params }: UseLibraryMediaParams) {
  const resolvedParams = use(params);
  const libraryId = resolvedParams.id;
  const { jellyfinConfig, isConnected, isInitialized } = useServerConfig();

  const [libraryTitle, setLibraryTitle] = useState<string>('Library');
  const [items, setItems] = useState<JellyfinBaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const includeItemTypesRef = useRef<string | undefined>(undefined);
  const limit = 30;

  useEffect(() => {
    let isMounted = true;

    if (!jellyfinConfig || !jellyfinConfig.serverUrl || !jellyfinConfig.userId || !jellyfinConfig.accessToken || !libraryId) {
      Promise.resolve().then(() => {
        if (isMounted) setLoading(false);
      });
      return;
    }

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    async function loadInitialData() {
      if (!jellyfinConfig) return;

      const userViews = await JellyfinService.getUserViews(
        jellyfinConfig.serverUrl,
        jellyfinConfig.userId,
        jellyfinConfig.accessToken
      ).catch(() => []);

      const matchedView = userViews.find((v) => v.Id === libraryId);
      let collectionType = matchedView?.CollectionType?.toLowerCase();
      let title = matchedView?.Name || 'Library';

      if (!matchedView) {
        const singleItem = await JellyfinService.getItem(
          jellyfinConfig.serverUrl,
          jellyfinConfig.userId,
          jellyfinConfig.accessToken,
          libraryId
        ).catch(() => null);
        if (singleItem) {
          if (singleItem.Name) title = singleItem.Name;
          if (singleItem.CollectionType) {
            collectionType = singleItem.CollectionType.toLowerCase();
          }
        }
      }

      let includeTypes: string | undefined = undefined;
      if (collectionType === 'movies') {
        includeTypes = 'Movie';
      } else if (collectionType === 'tvshows') {
        includeTypes = 'Series';
      }
      includeItemTypesRef.current = includeTypes;

      const itemsRes = await JellyfinService.getItems(
        jellyfinConfig.serverUrl,
        jellyfinConfig.userId,
        jellyfinConfig.accessToken,
        {
          parentId: libraryId,
          startIndex: 0,
          limit,
          includeItemTypes: includeTypes,
        }
      );

      if (!isMounted) return;

      setLibraryTitle(title);
      const fetchedItems = itemsRes.Items || [];
      const filteredItems = fetchedItems.filter(
        (item) => item.Type !== 'Folder' && item.Type !== 'CollectionFolder' && item.Type !== 'UserView'
      );

      setItems(filteredItems);
      setTotalCount(itemsRes.TotalRecordCount || 0);
      setHasMore(fetchedItems.length < (itemsRes.TotalRecordCount || 0));
    }

    loadInitialData()
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to load library items:', err);
        setError(getErrorMessage(err) || 'Failed to load library items');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [jellyfinConfig, libraryId]);

  const loadMore = useCallback(async () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      !jellyfinConfig ||
      !jellyfinConfig.serverUrl ||
      !jellyfinConfig.userId ||
      !jellyfinConfig.accessToken ||
      !libraryId
    ) {
      return;
    }

    setLoadingMore(true);
    try {
      const startIndex = items.length;
      const res = await JellyfinService.getItems(
        jellyfinConfig.serverUrl,
        jellyfinConfig.userId,
        jellyfinConfig.accessToken,
        {
          parentId: libraryId,
          startIndex,
          limit,
          includeItemTypes: includeItemTypesRef.current,
        }
      );
      const fetchedItems = res.Items || [];
      const filteredItems = fetchedItems.filter(
        (item) => item.Type !== 'Folder' && item.Type !== 'CollectionFolder' && item.Type !== 'UserView'
      );

      setItems((prev) => [...prev, ...filteredItems]);
      const updatedTotal = items.length + fetchedItems.length;
      setHasMore(updatedTotal < res.TotalRecordCount);
    } catch (err: unknown) {
      console.error('Failed to load more items:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, jellyfinConfig, libraryId, items.length]);

  const observerRef = useInfiniteScroll({
    hasMore,
    loading,
    loadingMore,
    onLoadMore: loadMore,
  });

  return {
    libraryTitle,
    items,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    error,
    observerRef,
    serverUrl: jellyfinConfig?.serverUrl,
    isConnected,
    isInitialized,
  };
}

export default useLibraryMedia;
