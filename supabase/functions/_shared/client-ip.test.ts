/**
 * US-214: the rate-limit key must be the address our proxy saw, not one the
 * client wrote into a header.
 */
import { describe, it, expect } from 'vitest';
import { getClientIP } from './client-ip.ts';
import { getClientIP as fromValidation } from './validation.ts';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const req = (headers: Record<string, string>) => new Request('https://functions.test/x', { headers });

describe('getClientIP', () => {
  it('takes the entry Traefik appended, not the one the client sent', () => {
    // Client sent "X-Forwarded-For: 6.6.6.6"; Traefik appended the real peer.
    expect(getClientIP(req({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('a spoofed X-Forwarded-For does not change the resolved address', () => {
    const real = '203.0.113.9';
    const a = getClientIP(req({ 'x-forwarded-for': `1.1.1.1, ${real}` }));
    const b = getClientIP(req({ 'x-forwarded-for': `9.9.9.9, 8.8.8.8, ${real}` }));
    expect(a).toBe(real);
    expect(b).toBe(real);
  });

  it('ignores cf-connecting-ip unless the deployment says Cloudflare is in front', () => {
    const r = req({ 'cf-connecting-ip': '6.6.6.6', 'x-forwarded-for': '203.0.113.9' });
    expect(getClientIP(r)).toBe('203.0.113.9');
    expect(getClientIP(r, { trustCfConnectingIp: true })).toBe('6.6.6.6');
  });

  it('counts further from the right when more proxies are trusted', () => {
    const r = req({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 10.0.0.2' });
    expect(getClientIP(r, { trustedProxyHops: 2 })).toBe('203.0.113.9');
  });

  it('falls back to X-Real-Ip, then "unknown"', () => {
    expect(getClientIP(req({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
    expect(getClientIP(req({}))).toBe('unknown');
  });

  it('validation.ts re-exports the same implementation', () => {
    expect(fromValidation).toBe(getClientIP);
  });

  it('no edge function reads the leftmost X-Forwarded-For entry itself', () => {
    // auth.ts imports from esm.sh and cannot load under vitest, so this is a
    // source check: the only reader of x-forwarded-for is client-ip.ts.
    const root = join(__dirname, '..');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.ts$/.test(e) && !/\.test\.ts$/.test(e) && !p.endsWith('client-ip.ts')) {
          if (/x-forwarded-for/i.test(readFileSync(p, 'utf8'))) offenders.push(p.slice(root.length + 1));
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
