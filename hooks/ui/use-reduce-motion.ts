'use client';

import { useSyncExternalStore } from 'react';
import { getReduceMotion, setReduceMotion, subscribeReduceMotion } from '@/lib/storage/content-preferences';

export function useReduceMotion(): [boolean, (value: boolean) => void] {
  const reduceMotion = useSyncExternalStore(subscribeReduceMotion, getReduceMotion, () => false);
  return [reduceMotion, setReduceMotion];
}
