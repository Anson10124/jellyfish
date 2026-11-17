'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  addBookmark,
  getBookmarkKey,
  getBookmarks,
  getServerBookmarks,
  removeBookmark,
  subscribeBookmarks,
  type Bookmark,
  type BookmarkMediaType,
} from '@/lib/storage/bookmarks';

export type { Bookmark, BookmarkMediaType };

export function useBookmarks(): Bookmark[] {
  return useSyncExternalStore(subscribeBookmarks, getBookmarks, getServerBookmarks);
}

export interface BookmarkTarget {
  id: string | number;
  mediaType: BookmarkMediaType;
  title: string;
  posterPath?: string | null;
  year?: number | null;
}

/** Whether one title is bookmarked, plus a toggle that returns the new state. */
export function useBookmark(target: BookmarkTarget | null) {
  const bookmarks = useBookmarks();
  const key = target ? getBookmarkKey(target.mediaType, target.id) : null;
  const isBookmarked = key !== null && bookmarks.some((b) => getBookmarkKey(b.mediaType, b.id) === key);

  const toggle = useCallback((): boolean => {
    if (!target) return false;
    if (isBookmarked) {
      removeBookmark(target.mediaType, target.id);
      return false;
    }
    addBookmark(target);
    return true;
  }, [target, isBookmarked]);

  return { isBookmarked, toggle };
}
