import { JellyfinConfig, MultiServerStore, SeerrConfig } from '@/types/server';
import { generateServerId, getStoredConfig, updateStoredConfig } from '@/lib/storage/app-config';

const SEERR_CONFIG_KEY = 'jellyfish_seerr_config';
const JELLYFIN_DEVICE_ID_KEY = 'jellyfish_device_id';

export { generateServerId };

export function getStoredDeviceId(): string {
  if (typeof window === 'undefined') return 'jellyfish-web-client';
  
  let deviceId = localStorage.getItem(JELLYFIN_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `jellyfish-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    localStorage.setItem(JELLYFIN_DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getStoredServers(): MultiServerStore {
  return getStoredConfig().servers ?? { servers: [], activeServerId: null };
}

export function setStoredServers(store: MultiServerStore): void {
  updateStoredConfig({ servers: store });
}

export function addStoredServer(config: JellyfinConfig): void {
  const store = getStoredServers();
  const existingIndex = store.servers.findIndex(
    (s) => s.serverUrl === config.serverUrl && s.userId === config.userId
  );
  if (existingIndex !== -1) {
    store.servers[existingIndex] = config;
  } else {
    store.servers.push(config);
  }
  store.activeServerId = config.id;
  setStoredServers(store);
}

export function removeStoredServer(serverId: string): void {
  const store = getStoredServers();
  store.servers = store.servers.filter((s) => s.id !== serverId);
  if (store.activeServerId === serverId) {
    store.activeServerId = store.servers.length > 0 ? store.servers[0].id : null;
  }
  setStoredServers(store);
}

export function setActiveStoredServerId(serverId: string | null): void {
  const store = getStoredServers();
  store.activeServerId = serverId;
  setStoredServers(store);
}

function getSeerrStorageKey(serverId?: string | null): string {
  return serverId ? `${SEERR_CONFIG_KEY}_${serverId}` : SEERR_CONFIG_KEY;
}

export function getStoredSeerrConfig(serverId?: string | null): SeerrConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    if (serverId) {
      const raw = localStorage.getItem(getSeerrStorageKey(serverId));
      if (raw) return JSON.parse(raw);
    }
    // Fallback to legacy global key
    const legacyRaw = localStorage.getItem(SEERR_CONFIG_KEY);
    return legacyRaw ? JSON.parse(legacyRaw) : null;
  } catch (e) {
    console.error('Failed to parse stored Seerr config:', e);
    return null;
  }
}

export function setStoredSeerrConfig(config: SeerrConfig | null, serverId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getSeerrStorageKey(serverId);
    if (config) {
      const payload: SeerrConfig = { ...config, serverId: serverId || config.serverId };
      localStorage.setItem(key, JSON.stringify(payload));
      if (!serverId) {
        localStorage.setItem(SEERR_CONFIG_KEY, JSON.stringify(payload));
      }
    } else {
      localStorage.removeItem(key);
      if (!serverId) {
        localStorage.removeItem(SEERR_CONFIG_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to save Seerr config:', e);
  }
}
