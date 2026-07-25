'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JellyfinConfig, SeerrConfig, ServerConnectionState } from '@/types/server';
import {
  getStoredJellyfinConfig,
  setStoredJellyfinConfig,
  getStoredSeerrConfig,
  setStoredSeerrConfig,
  getStoredDeviceId,
} from '@/lib/storage/server-storage';
import { JellyfinService } from '@/services/jellyfin.service';
import { JellyfinPublicSystemInfo } from '@/types/jellyfin';
import { normalizeServerUrl } from '@/lib/api/fetch-client';

interface ServerContextType {
  jellyfinConfig: JellyfinConfig | null;
  seerrConfig: SeerrConfig | null;
  connectionState: ServerConnectionState;
  isInitialized: boolean;
  verifyServerUrl: (url: string) => Promise<{ success: boolean; info?: JellyfinPublicSystemInfo; error?: string }>;
  connectWithPassword: (serverUrl: string, username: string, password?: string) => Promise<boolean>;
  connectWithQuickConnect: (serverUrl: string, secret: string) => Promise<boolean>;
  disconnectJellyfin: () => void;
  saveSeerrConfig: (config: SeerrConfig) => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [jellyfinConfig, setJellyfinConfig] = useState<JellyfinConfig | null>(null);
  const [seerrConfig, setSeerrConfig] = useState<SeerrConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionState, setConnectionState] = useState<ServerConnectionState>({
    status: 'disconnected',
  });

  useEffect(() => {
    const storedJf = getStoredJellyfinConfig();
    const storedSeerr = getStoredSeerrConfig();

    if (storedJf) {
      setJellyfinConfig(storedJf);
      setConnectionState({
        status: 'connected',
        serverName: storedJf.serverName,
        version: storedJf.version,
      });
    }

    if (storedSeerr) {
      setSeerrConfig(storedSeerr);
    }

    setIsInitialized(true);
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
    } catch (err: any) {
      const errorMsg = err?.message || 'Could not connect to Jellyfin server.';
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

        const newConfig: JellyfinConfig = {
          serverUrl: normalized,
          username: authResult.User.Name,
          accessToken: authResult.AccessToken,
          userId: authResult.User.Id,
          deviceId: getStoredDeviceId(),
          serverName: info?.ServerName || authResult.ServerId,
          version: info?.Version,
          userPrimaryImageTag: authResult.User.PrimaryImageTag,
        };

        setStoredJellyfinConfig(newConfig);
        setJellyfinConfig(newConfig);
        setConnectionState({
          status: 'connected',
          serverName: newConfig.serverName,
          version: newConfig.version,
          error: null,
        });

        return true;
      } catch (err: any) {
        const errorMsg = err?.message || 'Authentication failed. Please check your username and password.';
        setConnectionState({
          status: 'error',
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }
    },
    []
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

        // Token is returned in Authentication or Secret after approval
        const token = check.Authentication;
        const info = await JellyfinService.testConnection(normalized).catch(() => undefined);
        const deviceId = getStoredDeviceId();

        // Get user details using token
        const userRes = await fetch(`${normalized}/Users/Me`, {
          headers: {
            'X-Emby-Authorization': `MediaBrowser Client="Jellyfish", Device="Web", DeviceId="${deviceId}", Version="0.1.0", Token="${token}"`,
          },
        });

        if (!userRes.ok) {
          throw new Error('Failed to retrieve user profile after Quick Connect.');
        }

        const userData = await userRes.json();

        const newConfig: JellyfinConfig = {
          serverUrl: normalized,
          username: userData.Name,
          accessToken: token,
          userId: userData.Id,
          deviceId,
          serverName: info?.ServerName,
          version: info?.Version,
          userPrimaryImageTag: userData.PrimaryImageTag,
        };

        setStoredJellyfinConfig(newConfig);
        setJellyfinConfig(newConfig);
        setConnectionState({
          status: 'connected',
          serverName: newConfig.serverName,
          version: newConfig.version,
          error: null,
        });

        return true;
      } catch (err: any) {
        const errorMsg = err?.message || 'Quick connect authentication failed.';
        setConnectionState({
          status: 'error',
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }
    },
    []
  );

  const disconnectJellyfin = useCallback(() => {
    setStoredJellyfinConfig(null);
    setJellyfinConfig(null);
    setConnectionState({
      status: 'disconnected',
    });
  }, []);

  const saveSeerrConfig = useCallback((config: SeerrConfig) => {
    setStoredSeerrConfig(config);
    setSeerrConfig(config);
  }, []);

  return (
    <ServerContext.Provider
      value={{
        jellyfinConfig,
        seerrConfig,
        connectionState,
        isInitialized,
        verifyServerUrl,
        connectWithPassword,
        connectWithQuickConnect,
        disconnectJellyfin,
        saveSeerrConfig,
      }}
    >
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
