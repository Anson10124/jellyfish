import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const blockedNetworks = new BlockList();

[
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([address, prefix]) => blockedNetworks.addSubnet(address as string, prefix as number, 'ipv4'));

blockedNetworks.addAddress('::', 'ipv6');
blockedNetworks.addAddress('::1', 'ipv6');
blockedNetworks.addSubnet('fc00::', 7, 'ipv6');
blockedNetworks.addSubnet('fe80::', 10, 'ipv6');
blockedNetworks.addSubnet('ff00::', 8, 'ipv6');
blockedNetworks.addSubnet('2001:db8::', 32, 'ipv6');
blockedNetworks.addSubnet('64:ff9b::', 96, 'ipv6');
blockedNetworks.addSubnet('64:ff9b:1::', 48, 'ipv6');
blockedNetworks.addSubnet('2001::', 32, 'ipv6');
blockedNetworks.addSubnet('2001:2::', 48, 'ipv6');
blockedNetworks.addSubnet('2002::', 16, 'ipv6');

export interface ValidatedProxyTarget {
  baseUrl: URL;
  address: string;
  family: 4 | 6;
}

export class ProxyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProxyValidationError';
  }
}

function envFlag(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true';
}

function normalizeIpAddress(address: string): { address: string; family: 4 | 6 } {
  const unwrapped = address.startsWith('[') && address.endsWith(']') ? address.slice(1, -1) : address;
  const mappedIpv4 = unwrapped.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedIpv4) return { address: mappedIpv4[1], family: 4 };
  const mappedHexIpv4 = unwrapped.match(/^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/i);
  if (mappedHexIpv4) {
    const high = Number.parseInt(mappedHexIpv4[1], 16);
    const low = Number.parseInt(mappedHexIpv4[2], 16);
    return {
      address: `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`,
      family: 4,
    };
  }

  const family = isIP(unwrapped);
  if (family !== 4 && family !== 6) {
    throw new ProxyValidationError(`The proxy host did not resolve to a valid IP address.`);
  }
  return { address: unwrapped, family };
}

export function isBlockedProxyAddress(address: string): boolean {
  const normalized = normalizeIpAddress(address);
  return blockedNetworks.check(normalized.address, normalized.family === 4 ? 'ipv4' : 'ipv6');
}

function getAllowedOrigins(prefix: string): Set<string> {
  const configured = process.env[`${prefix}_PROXY_ALLOWED_ORIGINS`];
  if (!configured) return new Set();

  return new Set(
    configured.split(',').map((value) => value.trim()).filter(Boolean).map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        throw new ProxyValidationError(`${prefix}_PROXY_ALLOWED_ORIGINS contains an invalid URL.`);
      }
    })
  );
}

export async function validateProxyTarget(rawUrl: string, service: 'Seerr' | 'Jellyfin'): Promise<ValidatedProxyTarget> {
  const prefix = service.toUpperCase();
  if (!rawUrl || rawUrl.length > 2048) {
    throw new ProxyValidationError(`Missing or invalid ${service} server URL.`);
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    throw new ProxyValidationError(`The ${service} server URL is invalid.`);
  }

  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new ProxyValidationError(`Only HTTP and HTTPS ${service} URLs are supported.`);
  }
  if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new ProxyValidationError(`The ${service} server URL must not contain credentials, a query, or a fragment.`);
  }

  const allowedOrigins = getAllowedOrigins(prefix);
  if (
    process.env.NODE_ENV === 'production' &&
    allowedOrigins.size === 0 &&
    !envFlag(`${prefix}_PROXY_ALLOW_UNLISTED_PUBLIC_ORIGINS`)
  ) {
    throw new ProxyValidationError(
      `The ${service} proxy requires ${prefix}_PROXY_ALLOWED_ORIGINS in production.`
    );
  }
  if (allowedOrigins.size > 0 && !allowedOrigins.has(baseUrl.origin)) {
    throw new ProxyValidationError(`This ${service} server is not allowed by the proxy configuration.`);
  }

  const hostname = baseUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if ((hostname === 'localhost' || hostname.endsWith('.localhost')) && !envFlag(`${prefix}_PROXY_ALLOW_PRIVATE_NETWORKS`)) {
    throw new ProxyValidationError(`Private-network ${service} servers are disabled on this deployment.`);
  }

  let addresses: Array<{ address: string; family: number }>;
  const literalFamily = isIP(hostname);
  if (literalFamily === 4 || literalFamily === 6) {
    addresses = [{ address: hostname, family: literalFamily }];
  } else {
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new ProxyValidationError(`The ${service} hostname could not be resolved.`);
    }
  }

  if (addresses.length === 0) {
    throw new ProxyValidationError(`The ${service} hostname did not resolve to an address.`);
  }

  const normalized = addresses.map(({ address }) => normalizeIpAddress(address));
  if (!envFlag(`${prefix}_PROXY_ALLOW_PRIVATE_NETWORKS`) && normalized.some(({ address }) => isBlockedProxyAddress(address))) {
    throw new ProxyValidationError(`Private or reserved ${service} network addresses are disabled on this deployment.`);
  }

  return { baseUrl, address: normalized[0].address, family: normalized[0].family };
}
