'use client';

import { useSyncExternalStore } from 'react';
import { getReduceMotion, setReduceMotion, subscribeContentPreferences } from '@/lib/storage/content-preferences';

export function useReduceMotion(): [boolean, (value: boolean) => void] {
  const reduceMotion = useSyncExternalStore(subscribeContentPreferences, getReduceMotion, () => false);
  return [reduceMotion, setReduceMotion];
}
