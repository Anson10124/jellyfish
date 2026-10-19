// Never surface an HTML error page or a serialized error object in the connection UI.
export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return fallback;
    for (const key of ['error', 'message']) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim() && value.length <= 600 && !/<[^>]+>/.test(value)) {
        const message = value.trim();
        if (/_PROXY_ALLOWED_ORIGINS/.test(message)) {
          return 'Proxy access has not been configured on this Jellyfish deployment. Try Direct mode, or ask the Jellyfish host to enable it.';
        }
        if (/not allowed by the proxy configuration/i.test(message)) {
          return 'This server is not enabled for proxy access. Try Direct mode, or ask the Jellyfish host to allow it.';
        }
        if (/private.*(?:disabled|not allowed)/i.test(message)) {
          return 'This Jellyfish deployment does not allow proxy access to private-network servers. Try Direct mode, or contact the Jellyfish host.';
        }
        return message;
      }
    }
  } catch { /* The upstream may return an HTML page or an empty body. */ }
  return fallback;
}
