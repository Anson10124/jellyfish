import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

// Load the application's TS modules with its @/ alias without adding a test runtime dependency.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
function load(relative) {
  let filename = path.resolve(root, relative);
  if (!path.extname(filename)) filename += '.ts';
  if (!existsSync(filename)) throw new Error(`Missing test module: ${filename}`);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const nativeRequire = createRequire(filename);
  const localRequire = (specifier) => specifier.startsWith('@/')
    ? load(specifier.slice(2))
    : specifier.startsWith('.') ? load(path.resolve(path.dirname(filename), specifier)) : nativeRequire(specifier);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  new Function('require', 'module', 'exports', outputText)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { validateProxyTarget, isBlockedProxyAddress } = load('lib/security/proxy-target.ts');
const { isAllowedJellyfinRoute, rewriteJellyfinPlaylist } = load('lib/security/jellyfin-proxy.ts');
const { getJellyfinBaseUrl, getJellyfinResourceUrl } = load('lib/api/jellyfin-url.ts');
const { serverFetch } = load('lib/api/fetch-client.ts');
const { NextRequest } = createRequire(import.meta.url)('next/server');
const route = load('app/api/jellyfin/[server]/[...path]/route.ts');

test('connection errors preserve useful JSON messages and hide HTML or error objects', async () => {
  const { readApiError } = load('lib/api/error-message.ts');
  for (const body of ['<html>Bad gateway</html>', '{"error":{"stack":"internal details"}}', '{"error":"<h1>Bad gateway</h1>"}']) {
    assert.equal(await readApiError(new Response(body), 'Please check the server address.'), 'Please check the server address.');
  }
  assert.match(await readApiError(Response.json({ error: 'This server is not allowed by the proxy configuration.' }), 'fallback'), /not enabled for proxy access/);
  assert.match(await readApiError(Response.json({ error: 'The Jellyfin proxy requires JELLYFIN_PROXY_ALLOWED_ORIGINS in production.' }), 'fallback'), /Try Direct mode/);
  const nativeFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: 'Configure the allowed Jellyfin origin.' }, { status: 400 });
    await assert.rejects(serverFetch('https://jellyfin.example', '/System/Info/Public'), { message: 'Configure the allowed Jellyfin origin.', status: 400 });
    globalThis.fetch = async () => new Response('<html>Internal stack trace</html>', { status: 502 });
    await assert.rejects(serverFetch('https://jellyfin.example', '/System/Info/Public'), (error) => error.status === 502 && !error.message.includes('<html>'));
  } finally { globalThis.fetch = nativeFetch; }
});

test('Seerr requires a valid API key even when the public status endpoint succeeds', async () => {
  const { SeerrService } = load('services/seerr.service.ts');
  const nativeFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => url.endsWith('/status')
      ? Response.json({ appName: 'Seerr', version: '1.0' })
      : Response.json({ message: 'Invalid API key.' }, { status: 401 });
    const result = await SeerrService.testConnection('https://seerr.example', 'invalid-key');
    assert.equal(result.success, false);
    assert.equal(result.error, 'Invalid API key.');
    globalThis.fetch = async () => Response.json({ error: { message: 'internal' } }, { status: 400 });
    const failed = await SeerrService.testConnection('https://seerr.example');
    assert.equal(typeof failed.error, 'string');
    assert.match(failed.error, /check the server address/);
  } finally { globalThis.fetch = nativeFetch; }
});

test('proxy rejects private targets, mapped addresses, credentials, and unlisted origins', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', '::ffff:127.0.0.1', '::ffff:7f00:1']) {
    assert.equal(isBlockedProxyAddress(address), true, address);
  }
  assert.equal(isBlockedProxyAddress('8.8.8.8'), false);
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.JELLYFIN_PROXY_ALLOW_PRIVATE_NETWORKS = 'false';
    process.env.JELLYFIN_PROXY_ALLOW_UNLISTED_PUBLIC_ORIGINS = 'false';
    delete process.env.JELLYFIN_PROXY_ALLOWED_ORIGINS;
    await assert.rejects(validateProxyTarget('https://8.8.8.8', 'Jellyfin'), /requires JELLYFIN_PROXY_ALLOWED_ORIGINS/);
    process.env.JELLYFIN_PROXY_ALLOWED_ORIGINS = 'http://127.0.0.1:8096';
    await assert.rejects(validateProxyTarget('http://127.0.0.1:8096', 'Jellyfin'), /Private or reserved/);
    await assert.rejects(validateProxyTarget('https://8.8.8.8', 'Jellyfin'), /not allowed/);
    await assert.rejects(validateProxyTarget('http://user:pass@127.0.0.1:8096', 'Jellyfin'), /credentials/);
    await assert.rejects(validateProxyTarget('file:///etc/passwd', 'Jellyfin'), /HTTP and HTTPS/);
    // Opting Jellyfin into LAN access does not loosen Seerr's configuration.
    process.env.JELLYFIN_PROXY_ALLOW_PRIVATE_NETWORKS = 'true';
    assert.equal((await validateProxyTarget('http://127.0.0.1:8096', 'Jellyfin')).address, '127.0.0.1');
    process.env.SEERR_PROXY_ALLOWED_ORIGINS = 'http://127.0.0.1:8096';
    process.env.SEERR_PROXY_ALLOW_PRIVATE_NETWORKS = 'false';
    await assert.rejects(validateProxyTarget('http://127.0.0.1:8096', 'Seerr'), /Private or reserved/);
  } finally { process.env = previous; }
});

test('only client operations are proxied and playlist URIs retain server base paths and tokens', () => {
  assert.equal(isAllowedJellyfinRoute('POST', 'Users/AuthenticateByName'), true);
  assert.equal(isAllowedJellyfinRoute('GET', 'Videos/abc/hls1/main/0.mp4'), true);
  for (const [method, endpoint] of [['POST', 'System/Shutdown'], ['GET', 'Videos/abc/../System'], ['DELETE', 'Users/abc']]) {
    assert.equal(isAllowedJellyfinRoute(method, endpoint), false);
  }
  const base = new URL('https://jellyfin.example/jellyfin');
  const upstream = new URL('https://jellyfin.example/jellyfin/Videos/abc/main.m3u8?api_key=secret');
  const result = rewriteJellyfinPlaylist('#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\nsegment.ts\n/jellyfin/Videos/abc/other.m3u8', upstream, base);
  assert.match(result, /URI="\/api\/jellyfin\/https%3A%2F%2Fjellyfin.example%2Fjellyfin\/Videos\/abc\/init.mp4\?api_key=secret"/);
  assert.match(result, /segment.ts\?api_key=secret/);
  assert.throws(() => rewriteJellyfinPlaylist('https://evil.example/segment.ts', upstream, base), /external/);
  assert.throws(() => rewriteJellyfinPlaylist('/System/Info/Public', upstream, base), /external/);
});

test('saved mode selects each server and account, and setup overrides saved settings', async () => {
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.window = { dispatchEvent() {} };
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    values.set('jellyfish_config', JSON.stringify({ servers: { activeServerId: 'proxy', servers: [
      { id: 'direct', serverUrl: 'https://jellyfin.example', accessToken: 'direct-token' },
      { id: 'proxy', serverUrl: 'https://jellyfin.example', accessToken: 'proxy-token', useProxy: true },
    ] } }));
    assert.equal(getJellyfinBaseUrl('https://jellyfin.example'), '/api/jellyfin/https%3A%2F%2Fjellyfin.example');
    assert.equal(getJellyfinBaseUrl('https://jellyfin.example', undefined, 'direct-token'), 'https://jellyfin.example');
    assert.equal(getJellyfinBaseUrl('https://jellyfin.example', false), 'https://jellyfin.example');
    assert.equal(getJellyfinBaseUrl('https://old-server.example'), 'https://old-server.example');
    assert.equal(getJellyfinResourceUrl('https://jellyfin.example/base', '/base/Videos/abc/master.m3u8'), 'https://jellyfin.example/base/Videos/abc/master.m3u8');
    assert.throws(() => getJellyfinResourceUrl('https://jellyfin.example', 'https://evil.example/video'), /outside/);
  } finally { globalThis.window = previousWindow; globalThis.localStorage = previousStorage; }
});

test('proxy forwards auth and JSON, streams byte ranges, rewrites HLS, and preserves empty responses', async () => {
  const previous = { ...process.env };
  let received;
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    received = { url: request.url, headers: request.headers, body: Buffer.concat(chunks).toString() };
    if (request.url.includes('/Videos/abc/stream')) {
      response.writeHead(206, { 'content-type': 'video/mp4', 'content-range': 'bytes 2-4/10', 'accept-ranges': 'bytes', 'content-length': 3 });
      response.end('234');
    } else if (request.url.includes('.m3u8')) {
      response.writeHead(200, { 'content-type': 'application/vnd.apple.mpegurl' });
      response.end('#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\nsegment.ts');
    } else if (request.url.includes('/Sessions/')) {
      response.writeHead(204); response.end();
    } else if (request.url.includes('/QuickConnect/')) {
      response.writeHead(302, { location: 'http://169.254.169.254' }); response.end();
    } else {
      response.writeHead(200, { 'content-type': 'application/json' }); response.end('{"ServerName":"Test"}');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/jellyfin`;
  process.env.JELLYFIN_PROXY_ALLOWED_ORIGINS = new URL(base).origin;
  process.env.JELLYFIN_PROXY_ALLOW_PRIVATE_NETWORKS = 'true';
  const request = async (endpoint, init = {}) => {
    const [pathname, query = ''] = endpoint.split('?');
    const context = { params: Promise.resolve({ server: base, path: pathname.split('/') }) };
    const req = new NextRequest(`http://jellyfish.test/api/jellyfin/${encodeURIComponent(base)}/${pathname}?${query}`, init);
    return route[init.method || 'GET'](req, context);
  };
  try {
    let response = await request('Users/AuthenticateByName', { method: 'POST', headers: { 'x-emby-authorization': 'MediaBrowser Token="secret"', cookie: 'do-not-forward=1' }, body: '{"Username":"tester"}' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ServerName, 'Test');
    assert.equal(received.url, '/jellyfin/Users/AuthenticateByName');
    assert.equal(received.headers['x-emby-authorization'], 'MediaBrowser Token="secret"');
    assert.equal(received.headers.cookie, undefined);
    assert.equal(received.body, '{"Username":"tester"}');
    response = await request('Videos/abc/stream?api_key=secret', { headers: { range: 'bytes=2-4' } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), 'bytes 2-4/10');
    assert.equal(await response.text(), '234');
    assert.equal(received.headers.range, 'bytes=2-4');
    response = await request('Videos/abc/main.m3u8?api_key=secret');
    assert.match(await response.text(), /\/api\/jellyfin\/.*\/Videos\/abc\/segment.ts\?api_key=secret/);
    response = await request('Sessions/Playing/Progress', { method: 'POST', body: '{}' });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal((await request('QuickConnect/Connect')).status, 502);
    assert.equal((await request('System/Shutdown', { method: 'POST' })).status, 405);
    assert.equal((await request('System/Info/Public', { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
    assert.equal((await request('Users/AuthenticateByName', { method: 'POST', body: 'x'.repeat(65537) })).status, 400);
    // Exercise the real client fetch wrapper through the route too.
    const nativeFetch = globalThis.fetch;
    try {
      globalThis.fetch = (url, init) => {
        assert.match(url, /^\/api\/jellyfin\//);
        return request(url.split(encodeURIComponent(base) + '/')[1], init);
      };
      assert.equal((await serverFetch(base, '/System/Info/Public', { useProxy: true })).ServerName, 'Test');
    } finally { globalThis.fetch = nativeFetch; }
  } finally {
    process.env = previous;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('connection preflight detects mixed content and LAN targets from public pages', () => {
  const { getConnectionPreflight } = load('lib/api/connection-mode.ts');
  const hosted = { protocol: 'https:', hostname: 'jellyfish.kollod.dev' };
  assert.deepEqual(getConnectionPreflight('http://192.168.1.10:8096', hosted), { mixedContent: true, localNetwork: true });
  assert.deepEqual(getConnectionPreflight('jellyfin.example.com', hosted), { mixedContent: true, localNetwork: false });
  assert.deepEqual(getConnectionPreflight('https://jellyfin.local', hosted), { mixedContent: false, localNetwork: true });
  assert.deepEqual(getConnectionPreflight('http://localhost:8096', hosted), { mixedContent: false, localNetwork: true });
  assert.deepEqual(getConnectionPreflight('http://192.168.1.10:8096', { protocol: 'http:', hostname: '192.168.1.5' }), { mixedContent: false, localNetwork: false });
});

test('Auto mode falls back only when the first route cannot reach the server', async () => {
  const { connectWithMode } = load('lib/api/connection-mode.ts');
  const page = { protocol: 'https:', hostname: 'jellyfish.kollod.dev' };
  const run = async (mode, url, results, options = {}) => {
    const calls = [];
    const outcome = await connectWithMode(mode, url, async (useProxy) => {
      calls.push(useProxy);
      return results[useProxy ? 'proxy' : 'direct'];
    }, { page, ...options });
    return { calls, outcome };
  };
  const ok = { success: true };
  const blocked = { success: false, networkError: true, error: 'blocked' };
  const notFound = { success: false, error: 'not found' };
  const proxyRejected = { success: false, error: 'proxy rejected' };

  let { calls, outcome } = await run('auto', 'https://jf.example', { direct: blocked, proxy: ok });
  assert.deepEqual(calls, [false, true]);
  assert.equal(outcome.useProxy, true);

  ({ calls, outcome } = await run('auto', 'https://jf.example', { direct: notFound, proxy: ok }));
  assert.deepEqual(calls, [false]);
  assert.equal(outcome.result.error, 'not found');

  ({ calls } = await run('auto', 'http://jf.example', { direct: ok, proxy: ok }));
  assert.deepEqual(calls, [true]);

  ({ calls, outcome } = await run('direct', 'http://jf.example', { direct: ok, proxy: ok }));
  assert.deepEqual(calls, []);
  assert.equal(outcome.result, undefined);

  ({ calls, outcome } = await run('auto', 'https://seerr.example', { direct: blocked, proxy: proxyRejected }, { preferProxy: true }));
  assert.deepEqual(calls, [true, false]);
  assert.equal(outcome.result.error, 'proxy rejected');
  assert.equal(outcome.triedDirect && outcome.triedProxy, true);
});
