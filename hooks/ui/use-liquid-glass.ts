'use client';

import { useSyncExternalStore } from 'react';
import { getLiquidGlass, setLiquidGlass, subscribeContentPreferences } from '@/lib/storage/content-preferences';

export function useLiquidGlass(): [boolean, (value: boolean) => void] {
  const liquidGlass = useSyncExternalStore(subscribeContentPreferences, getLiquidGlass, () => false);
  return [liquidGlass, setLiquidGlass];
}
