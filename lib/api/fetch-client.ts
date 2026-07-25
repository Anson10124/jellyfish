import { getStoredDeviceId } from '@/lib/storage/server-storage';

export function normalizeServerUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

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
}

export async function serverFetch<T>(
  baseUrl: string,
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const normalizedBase = normalizeServerUrl(baseUrl);
  if (!normalizedBase) {
    throw new Error('Server URL is empty or invalid.');
  }

  const url = `${normalizedBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const { token, deviceId, timeoutMs = 12000, headers = {}, ...restOptions } = options;

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
      throw new Error(`Server returned status ${response.status}: ${errorText || response.statusText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Connection timed out. Please verify your server URL and network accessibility.');
    }
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Unable to connect to server. Please check that the URL is correct, the server is online, and CORS headers are configured.'
      );
    }
    throw err;
  }
}
