import { getStoredConfig, subscribeStoredConfig, updateStoredConfig } from '@/lib/storage/app-config';

export function getShowNsfw(): boolean {
  return getStoredConfig().showNsfw === true;
}

export function setShowNsfw(value: boolean): void {
  updateStoredConfig({ showNsfw: value });
}

export const subscribeContentPreferences = subscribeStoredConfig;
