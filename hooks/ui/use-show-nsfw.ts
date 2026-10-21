'use client';

import { useSyncExternalStore } from 'react';
import { getShowNsfw, setShowNsfw, subscribeContentPreferences } from '@/lib/storage/content-preferences';

export function useShowNsfw(): [boolean, (value: boolean) => void] {
  const showNsfw = useSyncExternalStore(subscribeContentPreferences, getShowNsfw, () => false);
  return [showNsfw, setShowNsfw];
}
