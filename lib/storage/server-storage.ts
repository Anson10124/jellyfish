import { JellyfinConfig, MultiServerStore, SeerrConfig } from '@/types/server';

const SERVERS_KEY = 'jellyfish_servers';
const LEGACY_JELLYFIN_CONFIG_KEY = 'jellyfish_jellyfin_config';
const SEERR_CONFIG_KEY = 'jellyfish_seerr_config';
const JELLYFIN_DEVICE_ID_KEY = 'jellyfish_device_id';

export function generateServerId(): string {
  return `srv-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
}

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
  if (typeof window === 'undefined') return { servers: [], activeServerId: null };

  try {
    const raw = localStorage.getItem(SERVERS_KEY);
    if (raw) {
      const parsed: MultiServerStore = JSON.parse(raw);
      return parsed;
    }

    const legacyRaw = localStorage.getItem(LEGACY_JELLYFIN_CONFIG_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Omit<JellyfinConfig, 'id'> & { id?: string };
      const id = legacy.id || generateServerId();
      const migratedServer: JellyfinConfig = { ...legacy, id };
      const store: MultiServerStore = {
        servers: [migratedServer],
        activeServerId: id,
      };

      localStorage.setItem(SERVERS_KEY, JSON.stringify(store));
      localStorage.removeItem(LEGACY_JELLYFIN_CONFIG_KEY);
      return store;
    }
  } catch (e) {
    console.error('Failed to read server store:', e);
  }

  return { servers: [], activeServerId: null };
}

export function setStoredServers(store: MultiServerStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save server store:', e);
  }
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
