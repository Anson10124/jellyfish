const ID = '[a-zA-Z0-9_-]+';
const ROUTES = [
  { method: 'GET', pattern: /^System\/Info\/Public$/i },
  { method: 'POST', pattern: /^Users\/AuthenticateByName$/i },
  { method: 'POST', pattern: /^QuickConnect\/Initiate$/i },
  { method: 'GET', pattern: /^QuickConnect\/Connect$/i },
  { method: 'GET', pattern: /^Users\/Me$/i },
  { method: 'GET', pattern: new RegExp(`^Users/${ID}/(?:Views|Items(?:/(?:Resume|${ID}))?|Images/Primary)$`, 'i') },
  { method: 'GET', pattern: new RegExp(`^Shows/(?:NextUp|${ID}/Episodes)$`, 'i') },
  { method: 'GET', pattern: new RegExp(`^Items/${ID}/Images/(?:Primary|Backdrop|Thumb|Logo)$`, 'i') },
  { method: 'POST', pattern: new RegExp(`^Items/${ID}/PlaybackInfo$`, 'i') },
  { method: 'POST', pattern: /^Sessions\/Playing(?:\/(?:Progress|Stopped))?$/i },
  { method: 'GET', pattern: new RegExp(`^Videos/${ID}/[a-zA-Z0-9_./-]+$`, 'i') },
];

export function isAllowedJellyfinRoute(method: string, path: string): boolean {
  if (path.length > 1024 || path.includes('..') || path.includes('\\')) return false;
  return ROUTES.some((rule) => rule.method === method && rule.pattern.test(path));
}

export function rewriteJellyfinPlaylist(playlist: string, upstreamUrl: URL, baseUrl: URL): string {
  const basePath = baseUrl.pathname.replace(/\/+$/, '') + '/';
  const rewrite = (uri: string) => {
    const target = new URL(uri, upstreamUrl);
    if (target.origin !== baseUrl.origin || !target.pathname.startsWith(basePath)) {
      throw new Error('Jellyfin playlist contains an external media URL.');
    }
    const path = target.pathname.slice(basePath.length);
    if (!isAllowedJellyfinRoute('GET', path)) throw new Error('Unsupported Jellyfin playlist media path.');
    const token = upstreamUrl.searchParams.get('api_key');
    if (token && !target.searchParams.has('api_key')) target.searchParams.set('api_key', token);
    return `/api/jellyfin/${encodeURIComponent(baseUrl.toString().replace(/\/+$/, ''))}/${path}${target.search}`;
  };
  return playlist.split('\n').map((line) => {
    if (!line.trim()) return line;
    if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, uri: string) => `URI="${rewrite(uri)}"`);
    return rewrite(line.trim());
  }).join('\n');
}
