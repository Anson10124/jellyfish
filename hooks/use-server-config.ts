import { useServerContext } from '@/context/server-context';

export function useServerConfig() {
  const {
    jellyfinConfig,
    seerrConfig,
    connectionState,
    isInitialized,
    verifyServerUrl,
    connectWithPassword,
    connectWithQuickConnect,
    disconnectJellyfin,
    saveSeerrConfig,
  } = useServerContext();

  return {
    jellyfinConfig,
    seerrConfig,
    connectionState,
    isInitialized,
    isConnected: !!jellyfinConfig?.accessToken,
    verifyServerUrl,
    connectWithPassword,
    connectWithQuickConnect,
    disconnectJellyfin,
    saveSeerrConfig,
  };
}
