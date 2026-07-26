import { serverFetch, normalizeServerUrl } from '@/lib/api/fetch-client';
import { JellyfinAuthResult, JellyfinPublicSystemInfo, JellyfinQuickConnectResult, JellyfinUserView } from '@/types/jellyfin';
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

  // Get User Libraries/Views
  async getUserViews(serverUrl: string, userId: string, token: string): Promise<JellyfinUserView[]> {
    const res = await serverFetch<{ Items: JellyfinUserView[]; TotalRecordCount: number }>(
      serverUrl,
      `/Users/${userId}/Views`,
      { token }
    );
    return res.Items || [];
  },

  // Construct stream URL
  getStreamUrl(serverUrl: string, itemId: string, token: string): string {
    const base = normalizeServerUrl(serverUrl);
    return `${base}/Videos/${itemId}/stream?static=true&api_key=${token}`;
  },

  // Construct primary image URL
  getImageUrl(serverUrl: string, itemId: string, options: { width?: number; height?: number; tag?: string; type?: 'Primary' | 'Backdrop' | 'Thumb' } = {}): string {
    const base = normalizeServerUrl(serverUrl);
    const imgType = options.type || 'Primary';
    let url = `${base}/Items/${itemId}/Images/${imgType}`;
    const params = new URLSearchParams();
    if (options.width) params.set('fillWidth', options.width.toString());
    if (options.height) params.set('fillHeight', options.height.toString());
    if (options.tag) params.set('tag', options.tag);
    
    const query = params.toString();
    return query ? `${url}?${query}` : url;
  },
};
