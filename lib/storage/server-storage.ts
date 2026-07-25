import { JellyfinConfig, SeerrConfig } from '@/types/server';

const JELLYFIN_CONFIG_KEY = 'jellyfish_jellyfin_config';
const SEERR_CONFIG_KEY = 'jellyfish_seerr_config';
const JELLYFIN_DEVICE_ID_KEY = 'jellyfish_device_id';

export function getStoredDeviceId(): string {
  if (typeof window === 'undefined') return 'jellyfish-web-client';
  
  let deviceId = localStorage.getItem(JELLYFIN_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `jellyfish-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    localStorage.setItem(JELLYFIN_DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getStoredJellyfinConfig(): JellyfinConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(JELLYFIN_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to parse stored Jellyfin config:', e);
    return null;
  }
}

export function setStoredJellyfinConfig(config: JellyfinConfig | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (config) {
      localStorage.setItem(JELLYFIN_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(JELLYFIN_CONFIG_KEY);
    }
  } catch (e) {
    console.error('Failed to save Jellyfin config:', e);
  }
}

export function getStoredSeerrConfig(): SeerrConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SEERR_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to parse stored Seerr config:', e);
    return null;
  }
}

export function setStoredSeerrConfig(config: SeerrConfig | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (config) {
      localStorage.setItem(SEERR_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(SEERR_CONFIG_KEY);
    }
  } catch (e) {
    console.error('Failed to save Seerr config:', e);
  }
}
