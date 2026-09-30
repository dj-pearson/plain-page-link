/**
 * The visitor's IP address, as far as our own proxy can vouch for it (US-214).
 *
 * Every per-IP rate limit and every login-lockout bucket keys on this value,
 * so it must be one the client cannot choose. Both earlier versions could be
 * chosen: they took the LEFTMOST X-Forwarded-For entry, which is whatever the
 * client sent, and one fell back to cf-connecting-ip, which only Cloudflare
 * can be trusted to set — and functions.agentbio.net is not behind Cloudflare
 * (it resolves straight to the Contabo host; Traefik is the only proxy, see
 * docs/deploy/edge-functions.md). A visitor could send a fresh address with
 * every request and never be rate-limited, or send a victim's address and
 * exhaust that victim's buckets.
 *
 * X-Forwarded-For grows by one entry per proxy, each appending the address it
 * saw, so the trustworthy entry is counted from the RIGHT: with one trusted
 * proxy (Traefik) it is the last one. Deployments with more proxies set
 * TRUSTED_PROXY_HOPS; if the functions host is ever put behind Cloudflare, set
 * TRUST_CF_CONNECTING_IP=true.
 */

export interface ClientIpOptions {
  /** Proxies we run that each append to X-Forwarded-For. Default 1 (Traefik). */
  trustedProxyHops?: number;
  /** Only when every request provably passes through Cloudflare. */
  trustCfConnectingIp?: boolean;
}

function envOptions(): ClientIpOptions {
  // Read lazily and defensively so this module also runs under vitest.
  const env = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env;
  const hops = Number.parseInt(env?.get('TRUSTED_PROXY_HOPS') ?? '', 10);
  return {
    trustedProxyHops: Number.isFinite(hops) && hops > 0 ? hops : 1,
    trustCfConnectingIp: env?.get('TRUST_CF_CONNECTING_IP') === 'true',
  };
}

export function getClientIP(req: Request, options: ClientIpOptions = envOptions()): string {
  const hops = options.trustedProxyHops && options.trustedProxyHops > 0 ? options.trustedProxyHops : 1;

  if (options.trustCfConnectingIp) {
    const cf = req.headers.get('cf-connecting-ip')?.trim();
    if (cf) return cf;
  }

  const forwarded = (req.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (forwarded.length > 0) {
    // Fewer entries than trusted hops means a proxy did not append: take the
    // leftmost we have, which is still one our proxy wrote, not the client.
    return forwarded[Math.max(0, forwarded.length - hops)];
  }

  // Traefik overwrites X-Real-Ip with the address it saw.
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
