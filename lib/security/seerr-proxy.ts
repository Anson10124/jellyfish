import { validateProxyTarget } from './proxy-target';
export { ProxyValidationError as SeerrProxyValidationError, isBlockedProxyAddress as isBlockedSeerrAddress } from './proxy-target';
export type { ValidatedProxyTarget as ValidatedSeerrTarget } from './proxy-target';

const ROUTE_RULES: ReadonlyArray<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^status$/ },
  { method: 'GET', pattern: /^auth\/me$/ },
  { method: 'POST', pattern: /^auth\/(?:jellyfin|local)$/ },
  { method: 'GET', pattern: /^(?:movie|tv)\/\d+$/ },
  { method: 'GET', pattern: /^request(?:\/\d+)?$/ },
  { method: 'POST', pattern: /^request$/ },
  { method: 'DELETE', pattern: /^request\/\d+$/ },
];

export function isAllowedSeerrRoute(method: string, path: string): boolean {
  if (!path || path.length > 200 || path.includes('..') || path.includes('\\')) return false;
  return ROUTE_RULES.some((rule) => rule.method === method && rule.pattern.test(path));
}

export function validateSeerrTarget(rawUrl: string) {
  return validateProxyTarget(rawUrl, 'Seerr');
}
