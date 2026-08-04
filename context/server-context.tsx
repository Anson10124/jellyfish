'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { JellyfinConfig, SeerrConfig, ServerConnectionState } from '@/types/server';
import { useI18n } from '@/context/i18n-context';
import {
  getStoredServers,
  setStoredServers,
  addStoredServer,
  removeStoredServer,
  setActiveStoredServerId,
  getStoredDeviceId,
  getStoredSeerrConfig,
  setStoredSeerrConfig,
  generateServerId,
} from '@/lib/storage/server-storage';
import { JellyfinService } from '@/services/jellyfin.service';
import { JellyfinPublicSystemInfo } from '@/types/jellyfin';
import { normalizeServerUrl } from '@/lib/api/fetch-client';
import { getErrorMessage } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface ServerContextType {
  servers: JellyfinConfig[];
  activeServerId: string | null;
  activeServer: JellyfinConfig | null;
  jellyfinConfig: JellyfinConfig | null;
  connectionState: ServerConnectionState;
  isInitialized: boolean;

  seerrConfig: SeerrConfig | null;
  serverStatuses: Record<string, 'online' | 'offline' | 'checking'>;

  verifyServerUrl: (url: string) => Promise<{ success: boolean; info?: JellyfinPublicSystemInfo; error?: string }>;
  connectWithPassword: (serverUrl: string, username: string, password?: string) => Promise<boolean>;
  connectWithQuickConnect: (serverUrl: string, secret: string) => Promise<boolean>;
  switchServer: (serverId: string) => void;
  removeServer: (serverId: string) => void;
  disconnectJellyfin: () => void;
  saveSeerrConfig: (config: SeerrConfig) => void;
  checkServersStatus: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [servers, setServers] = useState<JellyfinConfig[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [seerrConfig, setSeerrConfig] = useState<SeerrConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionState, setConnectionState] = useState<ServerConnectionState>({
    status: 'disconnected',
  });
  const [serverStatuses, setServerStatuses] = useState<Record<string, 'online' | 'offline' | 'checking'>>({});

  const activeServer = useMemo(
    () => servers.find((s) => s.id === activeServerId) ?? null,
    [servers, activeServerId]
  );

  const checkServersStatus = useCallback(async () => {
    const store = getStoredServers();
    if (store.servers.length === 0) return;

    setServerStatuses((prev) => {
      const next = { ...prev };
      store.servers.forEach((s) => {
        next[s.id] = 'checking';
      });
      return next;
    });

    await Promise.all(
      store.servers.map(async (server) => {
        try {
          await JellyfinService.testConnection(server.serverUrl);
          setServerStatuses((prev) => ({ ...prev, [server.id]: 'online' }));
          
          if (server.id === store.activeServerId) {
            setConnectionState({
              status: 'connected',
              serverName: server.serverName,
              version: server.version,
            });
          }
        } catch (err) {
          console.warn(`Server ${server.serverUrl} status check failed:`, err);
          setServerStatuses((prev) => ({ ...prev, [server.id]: 'offline' }));
          
          if (server.id === store.activeServerId) {
            setConnectionState({
              status: 'offline',
              serverName: server.serverName,
              version: server.version,
              error: 'Server is unreachable',
            });
          }
        }
      })
    );
  }, []);

  useEffect(() => {
    const store = getStoredServers();
    const storedSeerr = getStoredSeerrConfig();

    if (store.servers.length > 0) {
      setServers(store.servers);
      setActiveServerId(store.activeServerId);

      const active = store.servers.find((s) => s.id === store.activeServerId);
      if (active) {
        setConnectionState({
          status: 'connected',
          serverName: active.serverName,
          version: active.version,
        });
      }

      checkServersStatus();
    }

    if (storedSeerr) {
      setSeerrConfig(storedSeerr);
    }

    setIsInitialized(true);
  }, [checkServersStatus]);

  // Check active server status on page navigation / pathname changes
  useEffect(() => {
    if (!isInitialized || !activeServer) return;

    const checkActive = async () => {
      try {
        await JellyfinService.testConnection(activeServer.serverUrl);
        setServerStatuses((prev) => ({ ...prev, [activeServer.id]: 'online' }));
        setConnectionState({
          status: 'connected',
          serverName: activeServer.serverName,
          version: activeServer.version,
        });
      } catch (err) {
        console.warn(`Active server ${activeServer.serverUrl} is offline:`, err);
        setServerStatuses((prev) => ({ ...prev, [activeServer.id]: 'offline' }));
        setConnectionState({
          status: 'offline',
          serverName: activeServer.serverName,
          version: activeServer.version,
          error: 'Server is unreachable',
        });
      }
    };

    checkActive();
  }, [pathname, activeServer, isInitialized]);

  const persistState = useCallback((newServers: JellyfinConfig[], newActiveId: string | null) => {
    setServers(newServers);
    setActiveServerId(newActiveId);
    setStoredServers({ servers: newServers, activeServerId: newActiveId });
  }, []);

  const verifyServerUrl = useCallback(async (url: string) => {
    const normalized = normalizeServerUrl(url);
    if (!normalized) {
      return { success: false, error: 'Please enter a valid server URL.' };
    }

    setConnectionState((prev) => ({ ...prev, status: 'testing', error: null }));

    try {
      const info = await JellyfinService.testConnection(normalized);
      setConnectionState({
        status: 'disconnected',
        serverName: info.ServerName,
        version: info.Version,
        publicInfo: info,
        error: null,
      });
      return { success: true, info };
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Could not connect to Jellyfin server.';
      setConnectionState({
        status: 'error',
        error: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const connectWithPassword = useCallback(
    async (serverUrl: string, username: string, password?: string) => {
      const normalized = normalizeServerUrl(serverUrl);
      setConnectionState((prev) => ({ ...prev, status: 'testing', error: null }));

      try {
        const authResult = await JellyfinService.authenticateByName(normalized, username, password);
        const info = await JellyfinService.testConnection(normalized).catch(() => undefined);
        const existingServer = servers.find(
          (s) => s.serverUrl === normalized && s.userId === authResult.User.Id
        );

        const newConfig: JellyfinConfig = {
          id: existingServer?.id || generateServerId(),
          serverUrl: normalized,
          username: authResult.User.Name,
          accessToken: authResult.AccessToken,
          userId: authResult.User.Id,
          deviceId: getStoredDeviceId(),
          serverName: info?.ServerName || authResult.ServerId,
          version: info?.Version,
          userPrimaryImageTag: authResult.User.PrimaryImageTag,
        };

        const updatedServers = existingServer
          ? servers.map((s) => (s.id === existingServer.id ? newConfig : s))
          : [...servers, newConfig];

        persistState(updatedServers, newConfig.id);
        addStoredServer(newConfig);
        setServerStatuses((prev) => ({ ...prev, [newConfig.id]: 'online' }));

        setConnectionState({
          status: 'connected',
          serverName: newConfig.serverName,
          version: newConfig.version,
          error: null,
        });

        return true;
      } catch (err: unknown) {
        const errMessage = getErrorMessage(err);
        const errorMsg =
          errMessage === 'AUTH_INVALID_CREDENTIALS'
            ? t('connect.errors.invalidCredentials', 'Incorrect username or password')
            : errMessage || 'Authentication failed. Please check your username and password.';
        setConnectionState({
          status: 'error',
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }
    },
    [servers, persistState, t]
  );

  const connectWithQuickConnect = useCallback(
    async (serverUrl: string, secret: string) => {
      const normalized = normalizeServerUrl(serverUrl);
      setConnectionState((prev) => ({ ...prev, status: 'testing', error: null }));

      try {
        const check = await JellyfinService.checkQuickConnect(normalized, secret);
        if (!check.Authenticated || !check.Authentication) {
          throw new Error('Quick connect is not yet authorized on your Jellyfin server.');
        }

        const token = check.Authentication;
        const info = await JellyfinService.testConnection(normalized).catch(() => undefined);
        const deviceId = getStoredDeviceId();

        const userRes = await fetch(`${normalized}/Users/Me`, {
          headers: {
            'X-Emby-Authorization': `MediaBrowser Client="Jellyfish", Device="Web", DeviceId="${deviceId}", Version="0.1.0", Token="${token}"`,
          },
        });

        if (!userRes.ok) {
          throw new Error('Failed to retrieve user profile after Quick Connect.');
        }

        const userData = await userRes.json();
        const existingServer = servers.find(
          (s) => s.serverUrl === normalized && s.userId === userData.Id
        );

        const newConfig: JellyfinConfig = {
          id: existingServer?.id || generateServerId(),
          serverUrl: normalized,
          username: userData.Name,
          accessToken: token,
          userId: userData.Id,
          deviceId,
          serverName: info?.ServerName,
          version: info?.Version,
          userPrimaryImageTag: userData.PrimaryImageTag,
        };

        const updatedServers = existingServer
          ? servers.map((s) => (s.id === existingServer.id ? newConfig : s))
          : [...servers, newConfig];

        persistState(updatedServers, newConfig.id);
        addStoredServer(newConfig);
        setServerStatuses((prev) => ({ ...prev, [newConfig.id]: 'online' }));

        setConnectionState({
          status: 'connected',
          serverName: newConfig.serverName,
          version: newConfig.version,
          error: null,
        });

        return true;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err) || 'Quick connect authentication failed.';
        setConnectionState({
          status: 'error',
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }
    },
    [servers, persistState]
  );

  const switchServer = useCallback(
    (serverId: string) => {
      const target = servers.find((s) => s.id === serverId);
      if (!target) return;

      setActiveServerId(serverId);
      setActiveStoredServerId(serverId);
      setConnectionState({
        status: 'connected',
        serverName: target.serverName,
        version: target.version,
        error: null,
      });

      const checkActive = async () => {
        try {
          await JellyfinService.testConnection(target.serverUrl);
          setServerStatuses((prev) => ({ ...prev, [target.id]: 'online' }));
          setConnectionState({
            status: 'connected',
            serverName: target.serverName,
            version: target.version,
          });
        } catch (err) {
          setServerStatuses((prev) => ({ ...prev, [target.id]: 'offline' }));
          const msg = t('errors.serverUnreachable', 'Server is unreachable. Please verify network access.');
          setConnectionState({
            status: 'offline',
            serverName: target.serverName,
            version: target.version,
            error: msg,
          });
          toast.error(target.serverName || 'Server', msg);
        }
      };
      checkActive();
    },
    [servers, t]
  );

  const removeServerHandler = useCallback(
    (serverId: string) => {
      const updatedServers = servers.filter((s) => s.id !== serverId);
      const newActiveId =
        activeServerId === serverId
          ? updatedServers.length > 0
            ? updatedServers[0].id
            : null
          : activeServerId;

      persistState(updatedServers, newActiveId);
      removeStoredServer(serverId);

      if (newActiveId) {
        const newActive = updatedServers.find((s) => s.id === newActiveId);
        if (newActive) {
          setConnectionState({
            status: 'connected',
            serverName: newActive.serverName,
            version: newActive.version,
            error: null,
          });
        }
      } else {
        setConnectionState({ status: 'disconnected' });
      }
    },
    [servers, activeServerId, persistState]
  );

  const disconnectJellyfin = useCallback(() => {
    if (activeServerId) {
      removeServerHandler(activeServerId);
    }
  }, [activeServerId, removeServerHandler]);

  const saveSeerrConfig = useCallback((config: SeerrConfig) => {
    setStoredSeerrConfig(config);
    setSeerrConfig(config);
  }, []);

  const value = useMemo<ServerContextType>(
    () => ({
      servers,
      activeServerId,
      activeServer,
      jellyfinConfig: activeServer,
      connectionState,
      isInitialized,
      seerrConfig,
      serverStatuses,
      verifyServerUrl,
      connectWithPassword,
      connectWithQuickConnect,
      switchServer,
      removeServer: removeServerHandler,
      disconnectJellyfin,
      saveSeerrConfig,
      checkServersStatus,
    }),
    [
      servers,
      activeServerId,
      activeServer,
      connectionState,
      isInitialized,
      seerrConfig,
      serverStatuses,
      verifyServerUrl,
      connectWithPassword,
      connectWithQuickConnect,
      switchServer,
      removeServerHandler,
      disconnectJellyfin,
      saveSeerrConfig,
      checkServersStatus,
    ]
  );

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServerContext must be used within a ServerProvider');
  }
  return context;
}
