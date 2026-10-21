import { getStoredConfig, subscribeStoredConfig, updateStoredConfig } from '@/lib/storage/app-config';

export function getShowNsfw(): boolean {
  return getStoredConfig().showNsfw === true;
}

export function setShowNsfw(value: boolean): void {
  updateStoredConfig({ showNsfw: value });
}

export function getReduceMotion(): boolean {
  return getStoredConfig().reduceMotion === true;
}

export function setReduceMotion(value: boolean): void {
  updateStoredConfig({ reduceMotion: value });
}

// True when either the in-app setting or the OS-level preference asks for reduced motion.
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return getReduceMotion() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const subscribeContentPreferences = subscribeStoredConfig;
