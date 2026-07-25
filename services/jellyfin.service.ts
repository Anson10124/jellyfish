import { serverFetch, normalizeServerUrl } from '@/lib/api/fetch-client';
import { JellyfinAuthResult, JellyfinPublicSystemInfo, JellyfinQuickConnectResult } from '@/types/jellyfin';
import { getStoredDeviceId } from '@/lib/storage/server-storage';

export const JellyfinService = {
  // Test connection
  async testConnection(serverUrl: string): Promise<JellyfinPublicSystemInfo> {
    return serverFetch<JellyfinPublicSystemInfo>(serverUrl, '/System/Info/Public', {
      timeoutMs: 8000,
    });
  },

  // Authenticate using username & password
  async authenticateByName(
    serverUrl: string,
    username: string,
    password?: string
  ): Promise<JellyfinAuthResult> {
    const deviceId = getStoredDeviceId();
    try {
      return await serverFetch<JellyfinAuthResult>(serverUrl, '/Users/AuthenticateByName', {
        method: 'POST',
        deviceId,
        body: JSON.stringify({
          Username: username,
          Pw: password || '',
        }),
      });
    } catch (err: any) {
      if (err?.message?.includes('Server returned status 401')) {
        throw new Error('AUTH_INVALID_CREDENTIALS');
      }
      throw err;
    }
  },

  // Initiate Quick Connect session
  async initiateQuickConnect(serverUrl: string): Promise<JellyfinQuickConnectResult> {
    const deviceId = getStoredDeviceId();
    return serverFetch<JellyfinQuickConnectResult>(serverUrl, '/QuickConnect/Initiate', {
      method: 'POST',
      deviceId,
    });
  },

  // Check status of Quick Connect session
  async checkQuickConnect(serverUrl: string, secret: string): Promise<JellyfinQuickConnectResult> {
    const deviceId = getStoredDeviceId();
    return serverFetch<JellyfinQuickConnectResult>(
      serverUrl,
      `/QuickConnect/Connect?secret=${encodeURIComponent(secret)}`,
      {
        method: 'GET',
        deviceId,
      }
    );
  },

  // Construct stream URL
  getStreamUrl(serverUrl: string, itemId: string, token: string): string {
    const base = normalizeServerUrl(serverUrl);
    return `${base}/Videos/${itemId}/stream?static=true&api_key=${token}`;
  },

  // Construct primary image URL
  getImageUrl(serverUrl: string, itemId: string, options: { width?: number; height?: number; tag?: string } = {}): string {
    const base = normalizeServerUrl(serverUrl);
    let url = `${base}/Items/${itemId}/Images/Primary`;
    const params = new URLSearchParams();
    if (options.width) params.set('fillWidth', options.width.toString());
    if (options.height) params.set('fillHeight', options.height.toString());
    if (options.tag) params.set('tag', options.tag);
    
    const query = params.toString();
    return query ? `${url}?${query}` : url;
  },
};
