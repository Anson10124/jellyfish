import { NextRequest, NextResponse } from 'next/server';
import { Agent, fetch as undiciFetch } from 'undici';
import {
  isAllowedSeerrRoute,
  SeerrProxyValidationError,
  validateSeerrTarget,
} from '@/lib/security/seerr-proxy';

export const runtime = 'nodejs';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitEntries = new Map<string, RateLimitEntry>();

function errorResponse(message: string, status: number, extraHeaders: HeadersInit = {}) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...extraHeaders,
      },
    }
  );
}

function getClientIdentifier(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function checkRateLimit(request: NextRequest): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (rateLimitEntries.size > 5_000) {
    for (const [entryKey, entry] of rateLimitEntries) {
      if (entry.resetAt <= now) rateLimitEntries.delete(entryKey);
    }
  }

  const clientIdentifier = getClientIdentifier(request);
  const key = rateLimitEntries.has(clientIdentifier) || rateLimitEntries.size < 10_000
    ? clientIdentifier
    : 'overflow';
  const current = rateLimitEntries.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitEntries.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  return { allowed: true, retryAfter: 0 };
}

function hasAllowedQuery(path: string, searchParams: URLSearchParams): boolean {
  if (searchParams.size === 0) return true;
  if (path !== 'request' || searchParams.toString().length > 1_024) return false;

  const allowedKeys = new Set(['take', 'skip', 'filter']);
  for (const [key, value] of searchParams) {
    if (!allowedKeys.has(key)) return false;
    if ((key === 'take' || key === 'skip') && !/^\d{1,6}$/.test(value)) return false;
    if (key === 'filter' && (value.length > 64 || /[\r\n]/.test(value))) return false;
  }
  return true;
}

async function readRequestBody(request: NextRequest): Promise<Uint8Array | undefined> {
  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new SeerrProxyValidationError('Request body is too large.');
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_REQUEST_BYTES) {
    throw new SeerrProxyValidationError('Request body is too large.');
  }
  return body.byteLength > 0 ? body : undefined;
}

async function readLimitedResponse(response: Response): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new SeerrProxyValidationError('Seerr response is too large.');
  }
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.byteLength;
    if (totalLength > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new SeerrProxyValidationError('Seerr response is too large.');
    }
    chunks.push(value);
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function proxyToSeerr(request: NextRequest, pathSegments: string[], method: string) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return errorResponse('Cross-site proxy requests are not allowed.', 403);
  }

  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return errorResponse('Too many Seerr proxy requests. Please try again shortly.', 429, {
      'Retry-After': String(rateLimit.retryAfter),
    });
  }

  const path = pathSegments.join('/');
  if (!isAllowedSeerrRoute(method, path)) {
    return errorResponse('This Seerr API operation is not allowed by the proxy.', 405, {
      Allow: 'GET, POST, DELETE',
    });
  }
  if (!hasAllowedQuery(path, request.nextUrl.searchParams)) {
    return errorResponse('This Seerr API query is not allowed by the proxy.', 400);
  }

  const rawSeerrUrl = request.headers.get('X-Seerr-Url');
  if (!rawSeerrUrl) return errorResponse('Missing X-Seerr-Url header.', 400);

  let dispatcher: Agent | undefined;
  try {
    const target = await validateSeerrTarget(rawSeerrUrl);
    const targetUrl = new URL(target.baseUrl.toString());
    targetUrl.pathname = `${targetUrl.pathname.replace(/\/+$/, '')}/api/v1/${path}`;
    targetUrl.search = request.nextUrl.search;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const apiKey = request.headers.get('X-Seerr-Key');
    if (apiKey) {
      if (apiKey.length > 512) return errorResponse('Invalid Seerr API key.', 400);
      headers['X-Api-Key'] = apiKey;
    }

    const authorization = request.headers.get('Authorization');
    if (authorization) {
      if (!/^Bearer [\x21-\x7e]{1,4096}$/.test(authorization)) {
        return errorResponse('Invalid authorization header.', 400);
      }
      headers.Authorization = authorization;
    }

    const body = method === 'GET' ? undefined : await readRequestBody(request);
    const pinnedAddress = target.address;
    const pinnedFamily = target.family;
    dispatcher = new Agent({
      connect: {
        lookup: (_hostname, _options, callback) => callback(null, pinnedAddress, pinnedFamily),
      },
    });

    const upstream = await undiciFetch(targetUrl, {
      method,
      headers,
      body,
      dispatcher,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      return errorResponse('Seerr redirects are not allowed by the proxy.', 502);
    }

    const data = await readLimitedResponse(upstream as unknown as Response);
    const contentType = upstream.headers.get('content-type');
    const responseBody = new ArrayBuffer(data.byteLength);
    new Uint8Array(responseBody).set(data);
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': contentType?.startsWith('application/json')
          ? contentType
          : 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof SeerrProxyValidationError) return errorResponse(error.message, 400);

    console.error('Seerr API proxy error:', error);
    const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return errorResponse(
      isTimeout
        ? 'Connection to Seerr server timed out.'
        : 'Failed to connect to Seerr server. Please check the URL and ensure the server is reachable.',
      502
    );
  } finally {
    if (dispatcher) await dispatcher.close();
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToSeerr(request, (await context.params).path, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToSeerr(request, (await context.params).path, 'POST');
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToSeerr(request, (await context.params).path, 'PUT');
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToSeerr(request, (await context.params).path, 'DELETE');
}
