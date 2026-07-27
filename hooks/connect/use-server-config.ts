import { useServerContext } from '@/context/server-context';

export function useServerConfig() {
  const {
    // Multi-server state
    servers,
    activeServerId,
    activeServer,

    // Backwards-compatible alias
    jellyfinConfig,

    // Connection & init
    connectionState,
    isInitialized,

    // Seerr
    seerrConfig,

    // Actions
    verifyServerUrl,
    connectWithPassword,
    connectWithQuickConnect,
    switchServer,
    removeServer,
    disconnectJellyfin,
    saveSeerrConfig,
  } = useServerContext();

  return {
    // Backwards-compatible (operates on active server)
    jellyfinConfig,
    isConnected: !!jellyfinConfig?.accessToken,

    // Multi-server
    servers,
    activeServerId,
    activeServer,
    switchServer,
    removeServer,

    // Pass-through
    seerrConfig,
    connectionState,
    isInitialized,
    verifyServerUrl,
    connectWithPassword,
    connectWithQuickConnect,
    disconnectJellyfin,
    saveSeerrConfig,
  };
}
