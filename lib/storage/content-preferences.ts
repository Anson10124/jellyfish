import { getStoredConfig, subscribeStoredConfig, updateStoredConfig } from '@/lib/storage/app-config';

export function getShowNsfw(): boolean {
  return getStoredConfig().showNsfw === true;
}

export function setShowNsfw(value: boolean): void {
  updateStoredConfig({ showNsfw: value });
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Until the user flips the switch, follow the OS-level reduced motion preference.
export function getReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = getStoredConfig().reduceMotion;
  if (stored !== undefined) return stored;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function setReduceMotion(value: boolean): void {
  updateStoredConfig({ reduceMotion: value });
}

export function subscribeReduceMotion(callback: () => void): () => void {
  const unsubscribeConfig = subscribeStoredConfig(callback);
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => {
    unsubscribeConfig();
    mediaQuery.removeEventListener('change', callback);
  };
}

// Off unless the user turns it on: the glass renderer filters live page content, which costs GPU time.
export function getLiquidGlass(): boolean {
  return getStoredConfig().liquidGlass === true;
}

export function setLiquidGlass(value: boolean): void {
  updateStoredConfig({ liquidGlass: value });
}

export const subscribeContentPreferences = subscribeStoredConfig;
