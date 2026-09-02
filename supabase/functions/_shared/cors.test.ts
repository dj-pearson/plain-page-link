/**
 * US-123: getCorsHeaders answered `Access-Control-Allow-Origin: *` to any
 * request that arrived without an Origin header, on the reasoning that such a
 * request must be a webhook. A server-to-server caller does not read ACAO at
 * all, so the header bought nothing — and a request with no Origin is exactly
 * the shape an attacker controls. Seven functions (get-sessions, revoke-session,
 * login-security, audit-log, rate-limit, gdpr-export, gdpr-deletion) also used a
 * module-level static `corsHeaders` pinned to https://agentbio.net, so a visitor
 * on www.agentbio.net was refused by the browser on the sessions and GDPR pages.
 *
 * Runs under vitest via the supabase/functions tests include; cors.ts reads
 * Deno.env at module scope, so the stub is installed before the import.
 */
import { describe, it, expect, beforeAll } from 'vitest';

let getCorsHeaders: (origin: string | null, methods?: string) => Record<string, string>;
let handleCorsPreFlight: (origin: string | null) => Response;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).Deno = { env: { get: () => undefined } };
  const mod = await import('./cors.ts');
  getCorsHeaders = mod.getCorsHeaders;
  handleCorsPreFlight = mod.handleCorsPreFlight;
});

describe('getCorsHeaders', () => {
  it('sends no Access-Control-Allow-Origin at all when there is no Origin header', () => {
    const headers = getCorsHeaders(null);
    expect('Access-Control-Allow-Origin' in headers).toBe(false);
    // And specifically not the wildcard it used to send.
    expect(Object.values(headers)).not.toContain('*');
  });

  it('does not claim credentials are allowed when it named no origin', () => {
    expect('Access-Control-Allow-Credentials' in getCorsHeaders(null)).toBe(false);
  });

  it('echoes an allowed origin, including the www host', () => {
    for (const origin of ['https://agentbio.net', 'https://www.agentbio.net']) {
      const headers = getCorsHeaders(origin);
      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    }
  });

  it('does not echo an origin outside the whitelist', () => {
    const headers = getCorsHeaders('https://evil.example');
    expect(headers['Access-Control-Allow-Origin']).not.toBe('https://evil.example');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://agentbio.net');
  });

  it('names the methods it was asked to allow, and only then', () => {
    expect(getCorsHeaders('https://agentbio.net')['Access-Control-Allow-Methods']).toBeUndefined();
    expect(getCorsHeaders('https://agentbio.net', 'GET, OPTIONS')['Access-Control-Allow-Methods']).toBe(
      'GET, OPTIONS'
    );
  });
});

describe('handleCorsPreFlight', () => {
  it('answers a browser preflight with that browser origin', () => {
    const res = handleCorsPreFlight('https://www.agentbio.net');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://www.agentbio.net');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
  });

  it('answers an origin-less preflight without an ACAO header', () => {
    expect(handleCorsPreFlight(null).headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
