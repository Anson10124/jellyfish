import { getStoredDeviceId } from '@/lib/storage/server-storage';
import { getJellyfinBaseUrl } from './jellyfin-url';
import { readApiError } from './error-message';

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
      let formattedMessage = `Jellyfin could not complete this request (HTTP ${response.status}). Please check the server address and try again.`;
      if (response.status === 401) {
        formattedMessage = 'Authentication required. Please check your username and password.';
      } else if (response.status === 403) {
        formattedMessage = 'Access denied. Please check your account permissions.';
      } else if (response.status === 404) {
        formattedMessage = 'Jellyfin could not find this resource. Please check the server address, including its base path.';
      } else if (response.status >= 500) {
        formattedMessage = 'Jellyfin is unavailable. Please check that the server is online and try again.';
      }

      throw new ApiError(await readApiError(response, formattedMessage), response.status, response.statusText, url);
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
        normalizedBase.startsWith('/api/jellyfin/')
          ? 'Unable to connect through the proxy. Please check the server address and try again.'
          : 'Unable to connect directly. Check the server address and that it is online, or try Proxied mode if CORS blocks browser access.',
        0,
        'NetworkError',
        url
      );
    }
    throw new ApiError(err instanceof Error ? err.message : 'An unknown network error occurred.', undefined, undefined, url);
  }
}
