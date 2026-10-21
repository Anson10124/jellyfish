import type { JellyfinConfig, MultiServerStore } from '@/types/server';

const CONFIG_KEY = 'jellyfish_config';
export const CONFIG_CHANGE_EVENT = 'jellyfish:config';

// Keys that used to be stored separately and are folded into CONFIG_KEY on first read.
const LEGACY_LOCALE_KEY = 'jellyfish_locale';
const LEGACY_SHOW_NSFW_KEY = 'jellyfish_show_nsfw';
const LEGACY_SERVERS_KEY = 'jellyfish_servers';
const LEGACY_JELLYFIN_CONFIG_KEY = 'jellyfish_jellyfin_config';

export interface JellyfishConfig {
  locale?: string;
  showNsfw?: boolean;
  servers?: MultiServerStore;
}

export function generateServerId(): string {
  return `srv-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
}

function readLegacyServers(): MultiServerStore | undefined {
  const raw = localStorage.getItem(LEGACY_SERVERS_KEY);
  if (raw) return JSON.parse(raw);

  const legacyRaw = localStorage.getItem(LEGACY_JELLYFIN_CONFIG_KEY);
  if (legacyRaw) {
    const legacy = JSON.parse(legacyRaw) as Omit<JellyfinConfig, 'id'> & { id?: string };
    const id = legacy.id || generateServerId();
    return { servers: [{ ...legacy, id }], activeServerId: id };
  }
  return undefined;
}

function migrateLegacyConfig(): JellyfishConfig {
  const config: JellyfishConfig = {};
  const locale = localStorage.getItem(LEGACY_LOCALE_KEY);
  if (locale) config.locale = locale;
  const showNsfw = localStorage.getItem(LEGACY_SHOW_NSFW_KEY);
  if (showNsfw !== null) config.showNsfw = showNsfw === 'true';
  try {
    const servers = readLegacyServers();
    if (servers) config.servers = servers;
  } catch (e) {
    console.error('Failed to migrate legacy server store:', e);
  }

  if (Object.keys(config).length > 0) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    for (const key of [LEGACY_LOCALE_KEY, LEGACY_SHOW_NSFW_KEY, LEGACY_SERVERS_KEY, LEGACY_JELLYFIN_CONFIG_KEY]) {
      localStorage.removeItem(key);
    }
  }
  return config;
}

export function getStoredConfig(): JellyfishConfig {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
    return migrateLegacyConfig();
  } catch (e) {
    console.error('Failed to read config:', e);
    return {};
  }
}

export function updateStoredConfig(patch: Partial<JellyfishConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...getStoredConfig(), ...patch }));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
  window.dispatchEvent(new Event(CONFIG_CHANGE_EVENT));
}

export function subscribeStoredConfig(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONFIG_KEY) callback();
  };
  window.addEventListener(CONFIG_CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CONFIG_CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}
