import { NextRequest, NextResponse } from 'next/server';
import { Agent, fetch as undiciFetch } from 'undici';
import { ProxyValidationError, validateProxyTarget } from '@/lib/security/proxy-target';
import { isAllowedJellyfinRoute, rewriteJellyfinPlaylist } from '@/lib/security/jellyfin-proxy';

export const runtime = 'nodejs';

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_METADATA_BYTES = 10 * 1024 * 1024;
const clients = new Map<string, { count: number; resetAt: number }>();

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function rateLimited(request: NextRequest, media: boolean): boolean {
  const now = Date.now();
  if (clients.size > 5000) {
    for (const [key, value] of clients) if (value.resetAt <= now) clients.delete(key);
  }
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const key = `${ip}:${media ? 'media' : 'api'}`;
  if (!clients.has(key) && clients.size >= 10000) return true;
  let entry = clients.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + 60000 };
    clients.set(key, entry);
  }
  return ++entry.count > (media ? 3600 : 120);
}

async function readLimited(body: ReadableStream<Uint8Array> | null, limit: number): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new ProxyValidationError('Jellyfin proxy payload is too large.');
    }
    chunks.push(value);
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
  return output;
}

type RouteContext = { params: Promise<{ server: string; path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return errorResponse('Cross-site proxy requests are not allowed.', 403);
  const { server, path: segments } = await context.params;
  const path = segments.join('/');
  if (!isAllowedJellyfinRoute(request.method, path)) return errorResponse('This Jellyfin API operation is not allowed by the proxy.', 405);
  if (request.nextUrl.search.length > 8192) return errorResponse('Jellyfin query is too large.', 400);
  const media = /^(?:Videos\/|(?:Items|Users)\/[^/]+\/Images\/)/i.test(path);
  if (rateLimited(request, media)) return errorResponse('Too many Jellyfin proxy requests. Please try again shortly.', 429);

  let dispatcher: Agent | undefined;
  let streaming = false;
  try {
    const target = await validateProxyTarget(server, 'Jellyfin');
    const url = new URL(target.baseUrl);
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/${path}`;
    url.search = request.nextUrl.search;
    const headers: Record<string, string> = {};
    for (const name of ['accept', 'content-type', 'x-emby-authorization', 'mediabrowser-token', 'range', 'if-range']) {
      const value = request.headers.get(name);
      if (value) {
        if (value.length > 4096) return errorResponse('Invalid Jellyfin request header.', 400);
        headers[name] = value;
      }
    }
    const body = request.method === 'POST' ? await readLimited(request.body, MAX_REQUEST_BYTES) : undefined;
    dispatcher = new Agent({
      connect: { timeout: 10000, lookup: (_hostname, _options, callback) => callback(null, target.address, target.family) },
      headersTimeout: 15000,
      bodyTimeout: 60000,
    });
    const upstream = await undiciFetch(url, {
      method: request.method, headers, body, dispatcher, redirect: 'manual', signal: request.signal,
    });
    if (upstream.status >= 300 && upstream.status < 400 && upstream.status !== 304) {
      await upstream.body?.cancel();
      return errorResponse('Jellyfin redirects are not allowed by the proxy.', 502);
    }
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const safeType = /^(?:application\/(?:json|octet-stream|(?:vnd\.apple\.|x-)mpegurl)|video\/|audio\/|image\/(?:png|jpeg|webp|gif|avif)|text\/vtt)/i.test(contentType);
    responseHeaders.set('Content-Type', safeType ? contentType : 'text/plain; charset=utf-8');
    if (upstream.status === 204 || upstream.status === 304) {
      await upstream.body?.cancel();
      return new NextResponse(null, { status: upstream.status, headers: responseHeaders });
    }
    if (!media || /\.m3u8$/i.test(path)) {
      const data = await readLimited(upstream.body as ReadableStream<Uint8Array> | null, MAX_METADATA_BYTES);
      const output = /\.m3u8$/i.test(path) && upstream.ok
        ? rewriteJellyfinPlaylist(new TextDecoder().decode(data), url, target.baseUrl)
        : data;
      return new NextResponse(typeof output === 'string' ? output : Buffer.from(output), { status: upstream.status, headers: responseHeaders });
    }
    for (const name of ['content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    if (!upstream.headers.has('content-encoding') && upstream.headers.has('content-length')) {
      responseHeaders.set('Content-Length', upstream.headers.get('content-length')!);
    }
    if (!upstream.body) return new NextResponse(null, { status: upstream.status, headers: responseHeaders });
    // Keep the dispatcher alive until playback finishes or the player cancels.
    const reader = upstream.body.getReader();
    const agent = dispatcher;
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) { controller.close(); await agent.close(); }
          else controller.enqueue(value);
        } catch (error) { controller.error(error); await agent.destroy(); }
      },
      async cancel() { try { await reader.cancel(); } finally { await agent.destroy(); } },
    });
    streaming = true;
    return new NextResponse(stream, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    if (error instanceof ProxyValidationError) return errorResponse(error.message, 400);
    console.error('Jellyfin proxy request failed:', error instanceof Error ? error.name : 'UnknownError');
    return errorResponse('Failed to connect to Jellyfin. Check the server URL and proxy configuration.', 502);
  } finally {
    if (dispatcher && !streaming) await dispatcher.destroy();
  }
}

export const GET = proxy;
export const POST = proxy;
