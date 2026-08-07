import { normalizeServerUrl } from '@/lib/api/fetch-client';
import type {
  SeerrServerStatus,
  SeerrUser,
  SeerrTestResult,
  SeerrMediaInfo,
  SeerrRequest,
  CreateRequestPayload,
} from '@/types/seerr';

export class SeerrApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SeerrApiError';
    this.status = status;
  }
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

function buildHeaders(
  serverUrl: string,
  apiKey?: string,
  useProxy: boolean = true,
  sessionToken?: string
): HeadersInit {
  const normalized = normalizeServerUrl(serverUrl);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useProxy) {
    headers['X-Seerr-Url'] = normalized;
    if (apiKey) {
      headers['X-Seerr-Key'] = apiKey.trim();
    }
  } else {
    if (apiKey) {
      headers['X-Api-Key'] = apiKey.trim();
    }
  }

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  return headers;
}

function buildUrl(serverUrl: string, apiPath: string, useProxy: boolean = true): string {
  if (useProxy) {
    return `/api/seerr/${apiPath}`;
  }
  return `${normalizeServerUrl(serverUrl)}/api/v1/${apiPath}`;
}

export class SeerrService {
  static async testConnection(
    serverUrl: string,
    apiKey?: string,
    useProxy: boolean = true
  ): Promise<SeerrTestResult> {
    const normalized = normalizeServerUrl(serverUrl);
    if (!normalized) {
      return { success: false, error: 'Please enter a valid Seerr server URL.' };
    }

    try {
      const statusRes = await fetch(buildUrl(serverUrl, 'status', useProxy), {
        headers: buildHeaders(serverUrl, apiKey, useProxy),
        signal: AbortSignal.timeout(15000),
      });

      if (!statusRes.ok) {
        if (statusRes.status === 401 || statusRes.status === 403) {
          return {
            success: false,
            error: 'Authentication failed. Please verify your API Key.',
          };
        }
        let detail = '';
        try {
          const body = await statusRes.json();
          detail = body?.error || '';
        } catch {
          // ignore
        }
        return {
          success: false,
          error: detail || `Seerr server returned status ${statusRes.status}`,
        };
      }

      const statusData: SeerrServerStatus = await statusRes.json();
      let user: SeerrUser | undefined;

      if (apiKey) {
        try {
          const userRes = await fetch(buildUrl(serverUrl, 'auth/me', useProxy), {
            headers: buildHeaders(serverUrl, apiKey, useProxy),
            signal: AbortSignal.timeout(8000),
          });
          if (userRes.ok) {
            user = await userRes.json();
          }
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        appName: statusData.appName || 'Seerr',
        version: statusData.version || 'Unknown',
        user,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not connect to Seerr server.';
      return {
        success: false,
        error:
          msg.includes('fetch') || msg.includes('timeout') || msg.includes('Timeout')
            ? 'Unable to connect to Seerr server. Please check the URL and ensure the server is reachable.'
            : msg,
      };
    }
  }

  static async authenticateWithJellyfin(
    serverUrl: string,
    jellyfinHost: string,
    username: string,
    password?: string,
    useProxy: boolean = true
  ): Promise<SeerrUser> {
    const normalizedSeerr = normalizeServerUrl(serverUrl);
    const normalizedJellyfin = normalizeServerUrl(jellyfinHost);

    if (!normalizedSeerr) {
      throw new SeerrApiError('Invalid Seerr server URL.');
    }

    const credentials = {
      username: username.trim(),
      password: password || '',
    };

    const res = await fetch(buildUrl(serverUrl, 'auth/jellyfin', useProxy), {
      method: 'POST',
      headers: buildHeaders(serverUrl, undefined, useProxy),
      body: JSON.stringify({ ...credentials, hostname: normalizedJellyfin }),
    });

    if (res.ok) return await res.json();

    let errorMsg = await extractErrorMessage(res, `Jellyfin authentication failed (HTTP ${res.status})`);

    if (errorMsg.includes('hostname already configured')) {
      const retryRes = await fetch(buildUrl(serverUrl, 'auth/jellyfin', useProxy), {
        method: 'POST',
        headers: buildHeaders(serverUrl, undefined, useProxy),
        body: JSON.stringify(credentials),
      });

      if (retryRes.ok) return await retryRes.json();
      errorMsg = await extractErrorMessage(retryRes, errorMsg);
    }

    try {
      const localRes = await fetch(buildUrl(serverUrl, 'auth/local', useProxy), {
        method: 'POST',
        headers: buildHeaders(serverUrl, undefined, useProxy),
        body: JSON.stringify({ email: credentials.username, password: credentials.password }),
      });

      if (localRes.ok) return await localRes.json();
    } catch {
      
    }

    throw new SeerrApiError(errorMsg, res.status);
  }

  static async getCurrentUser(
    serverUrl: string,
    apiKey?: string,
    useProxy: boolean = true
  ): Promise<SeerrUser> {
    const res = await fetch(buildUrl(serverUrl, 'auth/me', useProxy), {
      headers: buildHeaders(serverUrl, apiKey, useProxy),
    });

    if (!res.ok) {
      throw new SeerrApiError('Failed to fetch user profile from Seerr.', res.status);
    }
    return await res.json();
  }

  static async getMediaDetails(
    serverUrl: string,
    apiKey: string | undefined,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    useProxy: boolean = true
  ): Promise<SeerrMediaInfo | null> {
    try {
      const res = await fetch(buildUrl(serverUrl, `${mediaType}/${tmdbId}`, useProxy), {
        headers: buildHeaders(serverUrl, apiKey, useProxy),
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new SeerrApiError(`Failed to fetch ${mediaType} details from Seerr`, res.status);
      }

      const data = await res.json();
      return data.mediaInfo || null;
    } catch (err) {
      console.warn(`Seerr getMediaDetails error for ${mediaType}/${tmdbId}:`, err);
      return null;
    }
  }

  static async createRequest(
    serverUrl: string,
    apiKey: string | undefined,
    payload: CreateRequestPayload,
    useProxy: boolean = true
  ): Promise<SeerrRequest> {
    const res = await fetch(buildUrl(serverUrl, 'request', useProxy), {
      method: 'POST',
      headers: buildHeaders(serverUrl, apiKey, useProxy),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new SeerrApiError(
        errText || `Failed to submit request to Seerr (HTTP ${res.status})`,
        res.status
      );
    }

    return await res.json();
  }

  static async deleteRequest(
    serverUrl: string,
    apiKey: string | undefined,
    requestId: number,
    useProxy: boolean = true
  ): Promise<boolean> {
    const res = await fetch(buildUrl(serverUrl, `request/${requestId}`, useProxy), {
      method: 'DELETE',
      headers: buildHeaders(serverUrl, apiKey, useProxy),
    });

    if (!res.ok) {
      throw new SeerrApiError(`Failed to cancel request #${requestId}`, res.status);
    }
    return true;
  }

  static async getRequests(
    serverUrl: string,
    apiKey: string | undefined,
    options: { take?: number; skip?: number; filter?: string } = {},
    useProxy: boolean = true
  ): Promise<{ pageInfo: { pages: number; pageSize: number; results: number; page: number }; results: SeerrRequest[] }> {
    const params = new URLSearchParams();
    if (options.take) params.set('take', options.take.toString());
    if (options.skip) params.set('skip', options.skip.toString());
    if (options.filter) params.set('filter', options.filter);

    const queryString = params.toString();
    const res = await fetch(buildUrl(serverUrl, `request${queryString ? `?${queryString}` : ''}`, useProxy), {
      headers: buildHeaders(serverUrl, apiKey, useProxy),
    });

    if (!res.ok) {
      throw new SeerrApiError('Failed to load requests from Seerr.', res.status);
    }

    return await res.json();
  }
}
