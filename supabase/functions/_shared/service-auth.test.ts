/**
 * US-656 (US-644): isServiceRoleRequest gates process-account-deletions,
 * notify-lead and every scheduler. It compared the bearer token to
 * SUPABASE_SERVICE_ROLE_KEY with ===, so an empty variable let
 * `Authorization: Bearer ` through.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isServiceRoleRequest, constantTimeEqual, MIN_SERVICE_KEY_LENGTH } from './service-auth.ts';

const env: Record<string, string> = {};
const KEY = 'eyJhbGciOiJIUzI1NiJ9.' + 'a'.repeat(80) + '.signature-part-xyz';

const req = (authorization?: string) =>
  new Request('https://functions.example/x', {
    method: 'POST',
    headers: authorization === undefined ? {} : { Authorization: authorization },
  });

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
  (globalThis as Record<string, unknown>).Deno = { env: { get: (k: string) => env[k] } };
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).Deno;
});

describe('isServiceRoleRequest', () => {
  it('accepts the exact key as a bearer token', () => {
    env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    expect(isServiceRoleRequest(req(`Bearer ${KEY}`))).toBe(true);
    expect(isServiceRoleRequest(req(`bearer ${KEY}`))).toBe(true);
  });

  it('refuses everything when the key is unset', () => {
    expect(isServiceRoleRequest(req('Bearer '))).toBe(false);
    expect(isServiceRoleRequest(req('Bearer undefined'))).toBe(false);
    expect(isServiceRoleRequest(req(''))).toBe(false);
  });

  it('refuses an empty bearer when the key is set but empty', () => {
    env.SUPABASE_SERVICE_ROLE_KEY = '';
    expect(isServiceRoleRequest(req('Bearer '))).toBe(false);
    expect(isServiceRoleRequest(req('Bearer'))).toBe(false);
    expect(isServiceRoleRequest(req(''))).toBe(false);
  });

  it('refuses when the key is whitespace or too short to be a key', () => {
    env.SUPABASE_SERVICE_ROLE_KEY = '   ';
    expect(isServiceRoleRequest(req('Bearer    '))).toBe(false);
    const short = 'x'.repeat(MIN_SERVICE_KEY_LENGTH - 1);
    env.SUPABASE_SERVICE_ROLE_KEY = short;
    expect(isServiceRoleRequest(req(`Bearer ${short}`))).toBe(false);
  });

  it('refuses a wrong, truncated or extended token', () => {
    env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    expect(isServiceRoleRequest(req(`Bearer ${KEY.slice(0, -1)}`))).toBe(false);
    expect(isServiceRoleRequest(req(`Bearer ${KEY}x`))).toBe(false);
    expect(isServiceRoleRequest(req(`Bearer ${KEY.slice(0, -1)}Z`))).toBe(false);
  });

  it('requires a Bearer scheme, not a bare key or another scheme', () => {
    env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    expect(isServiceRoleRequest(req(KEY))).toBe(false);
    expect(isServiceRoleRequest(req(`Basic ${KEY}`))).toBe(false);
    expect(isServiceRoleRequest(req(`Bearer ${KEY} extra`))).toBe(false);
    expect(isServiceRoleRequest(req())).toBe(false);
  });
});

describe('constantTimeEqual', () => {
  it('matches equal strings and rejects any difference, including length', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    expect(constantTimeEqual('', 'a')).toBe(false);
    expect(constantTimeEqual('', '')).toBe(true);
    expect(constantTimeEqual('é', 'e')).toBe(false);
  });

  it('does not short-circuit, and the === comparison is gone (source check)', () => {
    const src = readFileSync(resolve(__dirname, 'service-auth.ts'), 'utf8');
    const fn = src.slice(
      src.indexOf('export function constantTimeEqual'),
      src.indexOf('export function isServiceRoleRequest'),
    );
    expect(fn).not.toMatch(/return false/);
    expect(src).not.toMatch(/token === serviceRoleKey/);
  });
});
