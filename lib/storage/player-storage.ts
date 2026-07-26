export interface PlayerConfig {
  volume: number;
  muted: boolean;
}

const PLAYER_CONFIG_KEY = 'jellyfish_player_config';
const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  volume: 1.0,
  muted: false,
};

export function getStoredPlayerConfig(): PlayerConfig {
  if (typeof window === 'undefined') return DEFAULT_PLAYER_CONFIG;
  try {
    const raw = localStorage.getItem(PLAYER_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 1.0,
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
      };
    }
  } catch (e) {
    console.error('Failed to parse stored player config:', e);
  }
  return DEFAULT_PLAYER_CONFIG;
}

export function setStoredPlayerConfig(config: Partial<PlayerConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredPlayerConfig();
    const updated: PlayerConfig = {
      ...current,
      ...config,
    };
    localStorage.setItem(PLAYER_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save player config:', e);
  }
}
