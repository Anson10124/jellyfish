import { getStoredServers } from '@/lib/storage/server-storage';

export function normalizeJellyfinUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  return (/^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`).replace(/\/+$/, '');
}

// Keep the original address in saved configurations and Seerr authentication.
// Only browser request URLs are changed to the same-origin proxy.
export function getJellyfinBaseUrl(rawUrl: string, useProxy?: boolean, token?: string): string {
  const base = normalizeJellyfinUrl(rawUrl);
  if (!base) return '';
  if (useProxy === undefined) {
    const store = getStoredServers();
    const matches = store.servers.filter((server) => normalizeJellyfinUrl(server.serverUrl) === base);
    const server = (token ? matches.find((server) => server.accessToken === token) : undefined)
      ?? matches.find((server) => server.id === store.activeServerId)
      ?? matches[0];
    useProxy = server?.useProxy ?? false;
  }
  return useProxy ? `/api/jellyfin/${encodeURIComponent(base)}` : base;
}

export function getJellyfinResourceUrl(rawUrl: string, resource: string, token?: string): string {
  const base = new URL(normalizeJellyfinUrl(rawUrl));
  const basePath = base.pathname.replace(/\/+$/, '') + '/';
  // Jellyfin can return paths relative to its configured URL or its origin.
  const target = /^https?:\/\//i.test(resource) || resource.startsWith(basePath)
    ? new URL(resource, base)
    : new URL(resource.replace(/^\/+/, ''), `${base.toString().replace(/\/+$/, '')}/`);
  if (target.origin !== base.origin || !target.pathname.startsWith(basePath)) {
    throw new Error('Jellyfin returned a media URL outside the configured server.');
  }
  return `${getJellyfinBaseUrl(rawUrl, undefined, token)}/${target.pathname.slice(basePath.length)}${target.search}`;
}
