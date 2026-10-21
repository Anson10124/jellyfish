import { normalizeJellyfinUrl } from './jellyfin-url';

export type ConnectionMode = 'auto' | 'direct' | 'proxy';

export interface ConnectionPreflight {
  // An https page cannot call an http server; the browser blocks it before CORS applies.
  mixedContent: boolean;
  // A public page calling a LAN address may be blocked or need browser permission.
  localNetwork: boolean;
}

export interface ConnectionAttemptResult {
  success: boolean;
  error?: string;
  // The request never got an HTTP response (CORS, mixed content, DNS, timeout).
  networkError?: boolean;
}

export interface ConnectionOutcome<T extends ConnectionAttemptResult> {
  mode: ConnectionMode;
  result?: T;
  useProxy: boolean;
  preflight: ConnectionPreflight;
  triedDirect: boolean;
  triedProxy: boolean;
}

interface PageLocation {
  protocol: string;
  hostname: string;
}

function currentPage(): PageLocation | undefined {
  return typeof window === 'undefined' ? undefined : window.location;
}

function stripBrackets(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, '');
}

// Browsers treat loopback as a secure context, so http://localhost is not mixed content.
function isLoopbackHostname(hostname: string): boolean {
  const host = stripBrackets(hostname);
  return host === 'localhost' || host.endsWith('.localhost') || host === '::1' || /^127\.\d+\.\d+\.\d+$/.test(host);
}

export function isLocalNetworkHostname(hostname: string): boolean {
  const host = stripBrackets(hostname);
  if (isLoopbackHostname(host)) return true;
  if (/\.(?:local|lan|home|internal|home\.arpa)$/.test(host)) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
  }
  if (host.includes(':')) return /^f[cd][0-9a-f]{0,2}:/.test(host) || /^fe[89ab][0-9a-f]?:/.test(host);
  // Single-label names such as "jellyfin" only resolve on a local network.
  return !host.includes('.');
}

export function getConnectionPreflight(rawUrl: string, page: PageLocation | undefined = currentPage()): ConnectionPreflight {
  const normalized = normalizeJellyfinUrl(rawUrl);
  if (!normalized || !page) return { mixedContent: false, localNetwork: false };
  let target: URL;
  try {
    target = new URL(normalized);
  } catch {
    return { mixedContent: false, localNetwork: false };
  }
  return {
    mixedContent: page.protocol === 'https:' && target.protocol === 'http:' && !isLoopbackHostname(target.hostname),
    localNetwork: isLocalNetworkHostname(target.hostname) && !isLocalNetworkHostname(page.hostname),
  };
}

// Resolves which route to use. Auto tries the preferred route first and falls back to the
// other when the first one could not reach the server. Direct is skipped when the browser
// would block it as mixed content.
export async function connectWithMode<T extends ConnectionAttemptResult>(
  mode: ConnectionMode,
  rawUrl: string,
  attempt: (useProxy: boolean) => Promise<T>,
  options: { preferProxy?: boolean; page?: PageLocation } = {}
): Promise<ConnectionOutcome<T>> {
  const preflight = getConnectionPreflight(rawUrl, 'page' in options ? options.page : currentPage());
  const order = mode === 'direct' ? [false]
    : mode === 'proxy' || preflight.mixedContent ? [true]
    : options.preferProxy ? [true, false] : [false, true];

  const outcome: ConnectionOutcome<T> = { mode, useProxy: order[0], preflight, triedDirect: false, triedProxy: false };
  if (mode === 'direct' && preflight.mixedContent) return outcome;

  let proxyFailure: T | undefined;
  for (const useProxy of order) {
    const result = await attempt(useProxy);
    Object.assign(outcome, { result, useProxy, [useProxy ? 'triedProxy' : 'triedDirect']: true });
    if (result.success) return outcome;
    if (useProxy) proxyFailure = result;
    // The server answered directly, so the proxy would not change the outcome.
    else if (!result.networkError) return outcome;
  }
  // A failed direct request only says "blocked"; the proxy's error explains more.
  if (proxyFailure) Object.assign(outcome, { result: proxyFailure, useProxy: true });
  return outcome;
}

type Translate = (key: string, defaultText?: string, params?: Record<string, string | number>) => string;

export function describeConnectionFailure(
  outcome: ConnectionOutcome<ConnectionAttemptResult>,
  service: 'Jellyfin' | 'Seerr',
  t: Translate,
  fallback: string
): string {
  const { result, preflight } = outcome;
  if (!result) {
    return t('connect.errors.mixedContent',
      'This page uses HTTPS, so your browser blocks http:// servers. Use an https:// address for your {service} server, or choose Auto or Proxied.',
      { service });
  }

  let message = result.error || fallback;
  if (outcome.triedDirect && outcome.triedProxy) {
    message = t('connect.errors.autoBothFailed', 'Could not connect directly or through the proxy. {error}', { error: message });
  } else if (outcome.mode === 'auto' && preflight.mixedContent) {
    message = t('connect.errors.mixedContentProxied',
      'Your browser blocks http:// servers on this HTTPS page, so Jellyfish tried the proxy instead. {error}',
      { error: message });
  }

  const unreachable = outcome.triedProxy || result.networkError;
  if (preflight.localNetwork && unreachable) {
    message += ` ${t('connect.errors.localNetworkHint',
      'This is a local network address. Allow local network access if your browser asks, use an address reachable from the internet, or run Jellyfish on the same network.')}`;
  }
  return message;
}
