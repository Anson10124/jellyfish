import { getStoredDeviceId } from '@/lib/storage/server-storage';
import { getJellyfinBaseUrl } from './jellyfin-url';

export class ApiError extends Error {
  status?: number;
  statusText?: string;
  url?: string;

  constructor(message: string, status?: number, statusText?: string, url?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

export { normalizeJellyfinUrl as normalizeServerUrl } from './jellyfin-url';

export function buildEmbyAuthHeader(token?: string, deviceId?: string): string {
  const devId = deviceId || getStoredDeviceId();
  let auth = `MediaBrowser Client="Jellyfish", Device="Web", DeviceId="${devId}", Version="0.1.0"`;
  if (token) {
    auth += `, Token="${token}"`;
  }
  return auth;
}

export interface ApiFetchOptions extends RequestInit {
  token?: string;
  deviceId?: string;
  timeoutMs?: number;
  useProxy?: boolean;
}

export async function serverFetch<T>(
  baseUrl: string,
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { token, deviceId, useProxy, timeoutMs = 12000, headers = {}, ...restOptions } = options;
  const normalizedBase = getJellyfinBaseUrl(baseUrl, useProxy, token);
  if (!normalizedBase) {
    throw new ApiError('Server URL is empty or invalid.');
  }

  const url = `${normalizedBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...restOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': buildEmbyAuthHeader(token, deviceId),
        ...(token ? { 'MediaBrowser-Token': token } : {}),
        ...headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = response.statusText;
      }

      let formattedMessage = `Server returned status ${response.status}: ${errorText || response.statusText}`;
      if (response.status === 401) {
        formattedMessage = `Server returned status 401: Authentication required or invalid credentials.`;
      } else if (response.status === 403) {
        formattedMessage = `Server returned status 403: Access forbidden to this resource.`;
      } else if (response.status === 404) {
        formattedMessage = `Server returned status 404: Resource not found.`;
      } else if (response.status >= 500) {
        formattedMessage = `Server error ${response.status}: Jellyfin server internal error.`;
      }

      throw new ApiError(formattedMessage, response.status, response.statusText, url);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Connection timed out. Please verify your server URL and network accessibility.', 408, 'Timeout', url);
    }
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new ApiError(
        'Unable to connect to server. Please check that the URL is correct, the server is online, and CORS headers are configured.',
        0,
        'NetworkError',
        url
      );
    }
    throw new ApiError(err instanceof Error ? err.message : 'An unknown network error occurred.', undefined, undefined, url);
  }
}
