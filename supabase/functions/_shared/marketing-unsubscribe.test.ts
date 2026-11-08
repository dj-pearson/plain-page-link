/**
 * US-425: the free-tool drips' unsubscribe link went to a route that did not
 * exist, the bio drip had none, and nothing checked for an opt-out.
 *
 * These pin the parts that decide whether an opt-out works: tokens that cannot
 * be forged or moved to another capture, links that reach both the page and
 * the RFC 8058 endpoint, and a suppression check that blocks a send (and
 * refuses to guess when the database cannot answer).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isSuppressed,
  parseUnsubscribeRequest,
  signUnsubscribe,
  unsubscribeFooterHtml,
  unsubscribeHeaders,
  unsubscribeLinks,
  unsubscribeSecret,
  verifyUnsubscribe,
  type SuppressionClient,
} from './marketing-unsubscribe.ts';
import { emailLookupHash } from './spam-guard.ts';

const SECRET = 'test-secret-value';
const CAPTURE = '3f2b6c1e-9a4d-4e8b-8c2f-1a2b3c4d5e6f';
const OTHER = '11111111-2222-4333-8444-555555555555';
const ORIGINS = { siteUrl: 'https://agentbio.net', functionsUrl: 'https://functions.agentbio.net' };

afterEach(() => {
  delete (globalThis as Record<string, unknown>).Deno;
});

describe('unsubscribe tokens', () => {
  it('verifies a token for the list and capture it was made for', async () => {
    const token = await signUnsubscribe('listing', CAPTURE, SECRET);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(await verifyUnsubscribe('listing', CAPTURE, token, SECRET)).toBe(true);
    expect(await verifyUnsubscribe('listing', CAPTURE.toUpperCase(), token, SECRET)).toBe(true);
  });

  it('rejects the token on another capture, another list, or another key', async () => {
    const token = await signUnsubscribe('listing', CAPTURE, SECRET);
    expect(await verifyUnsubscribe('listing', OTHER, token, SECRET)).toBe(false);
    expect(await verifyUnsubscribe('bio', CAPTURE, token, SECRET)).toBe(false);
    expect(await verifyUnsubscribe('listing', CAPTURE, token, 'another-secret')).toBe(false);
  });

  it('rejects malformed tokens and capture ids without throwing', async () => {
    expect(await verifyUnsubscribe('listing', CAPTURE, 'abc', SECRET)).toBe(false);
    expect(await verifyUnsubscribe('listing', 'not-a-uuid', 'a'.repeat(64), SECRET)).toBe(false);
  });

  it('is not the same value as the lead email hash made with the same key', async () => {
    const token = await signUnsubscribe('listing', CAPTURE, SECRET);
    expect(token).not.toBe(await emailLookupHash(`listing:${CAPTURE}`, SECRET));
  });
});

describe('unsubscribeLinks / headers / footer', () => {
  it('points the body link at /unsubscribe and the header at the one-click function', async () => {
    const links = await unsubscribeLinks('bio', CAPTURE, SECRET, ORIGINS);
    const page = new URL(links.pageUrl);
    expect(page.origin + page.pathname).toBe('https://agentbio.net/unsubscribe');
    expect(page.searchParams.get('l')).toBe('bio');
    expect(page.searchParams.get('c')).toBe(CAPTURE);
    const oneClick = new URL(links.oneClickUrl);
    expect(oneClick.origin + oneClick.pathname).toBe('https://functions.agentbio.net/email-unsubscribe');
    expect(oneClick.search).toBe(page.search);
    expect(await verifyUnsubscribe('bio', CAPTURE, page.searchParams.get('t')!, SECRET)).toBe(true);
  });

  it('sends RFC 8058 one-click headers', async () => {
    const links = await unsubscribeLinks('listing', CAPTURE, SECRET, ORIGINS);
    expect(unsubscribeHeaders(links)).toEqual({
      'List-Unsubscribe': `<${links.oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });

  it('escapes the ampersands in the footer href', async () => {
    const links = await unsubscribeLinks('listing', CAPTURE, SECRET, ORIGINS);
    const html = unsubscribeFooterHtml(links, 'Because.');
    expect(html).toContain(links.pageUrl.replace(/&/g, '&amp;'));
    expect(html).toContain('>Unsubscribe</a>');
  });
});

describe('parseUnsubscribeRequest', () => {
  const token = 'a'.repeat(64);

  it('reads a one-click POST from the query string', () => {
    const url = new URL(`https://functions.agentbio.net/email-unsubscribe?l=listing&c=${CAPTURE}&t=${token}`);
    expect(parseUnsubscribeRequest(url, null)).toEqual({ list: 'listing', captureId: CAPTURE, token });
  });

  it('reads the page POST from the JSON body', () => {
    const url = new URL('https://functions.agentbio.net/email-unsubscribe');
    expect(parseUnsubscribeRequest(url, { list: 'bio', captureId: CAPTURE, token })).toEqual({
      list: 'bio',
      captureId: CAPTURE,
      token,
    });
  });

  it('refuses an unknown list, a bad id or a bad token', () => {
    const url = new URL('https://functions.agentbio.net/email-unsubscribe');
    expect(parseUnsubscribeRequest(url, { list: 'agents', captureId: CAPTURE, token })).toBeNull();
    expect(parseUnsubscribeRequest(url, { list: 'bio', captureId: 'x', token })).toBeNull();
    expect(parseUnsubscribeRequest(url, { list: 'bio', captureId: CAPTURE, token: 'zz' })).toBeNull();
    expect(parseUnsubscribeRequest(url, null)).toBeNull();
  });
});

describe('unsubscribeSecret', () => {
  it('uses the PII key, falling back to ENCRYPTION_KEY, and is undefined when neither is set', () => {
    const env: Record<string, string> = {};
    (globalThis as Record<string, unknown>).Deno = { env: { get: (k: string) => env[k] } };
    expect(unsubscribeSecret()).toBeUndefined();
    env.ENCRYPTION_KEY = 'fallback';
    expect(unsubscribeSecret()).toBe('fallback');
    env.PII_ENCRYPTION_KEY = 'primary';
    expect(unsubscribeSecret()).toBe('primary');
  });
});

function fakeClient(rows: string[], error: { message: string } | null = null) {
  const seen: Array<{ table: string; column: string; value: string }> = [];
  const client: SuppressionClient = {
    from: (table) => ({
      select: () => ({
        eq: (column, value) => ({
          maybeSingle: async () => {
            seen.push({ table, column, value });
            return { data: rows.includes(value) ? { email_hash: value } : null, error };
          },
        }),
      }),
    }),
  };
  return { client, seen };
}

describe('isSuppressed', () => {
  it('looks the address up by its keyed hash, case- and space-insensitively', async () => {
    const hash = await emailLookupHash('dana@example.com', SECRET);
    const { client, seen } = fakeClient([hash]);
    expect(await isSuppressed(client, '  Dana@Example.com ', SECRET)).toBe(true);
    expect(seen).toEqual([{ table: 'email_suppressions', column: 'email_hash', value: hash }]);
    expect(seen[0].value).not.toContain('dana');
  });

  it('is false for an address that never opted out', async () => {
    const { client } = fakeClient([]);
    expect(await isSuppressed(client, 'sam@example.com', SECRET)).toBe(false);
  });

  it('throws rather than answering false when the lookup fails', async () => {
    const { client } = fakeClient([], { message: 'connection refused' });
    await expect(isSuppressed(client, 'sam@example.com', SECRET)).rejects.toThrow(/email_suppressions/);
  });
});

describe('every free-tool drip sender checks for an opt-out and links one', () => {
  const senders = [
    'send-listing-generator-email',
    'send-scheduled-listing-emails',
    'send-bio-analyzer-email',
    'send-scheduled-bio-emails',
  ];
  for (const name of senders) {
    it(name, () => {
      const src = readFileSync(join(process.cwd(), 'supabase/functions', name, 'index.ts'), 'utf-8');
      expect(src).toContain('isSuppressed(');
      expect(src).toContain('unsubscribeLinks(');
      expect(src).toContain('unsubscribeHeaders(');
      // The old dead link, with no parameters, must not come back.
      expect(src).not.toMatch(/\/unsubscribe["'`]/);
    });
  }
});
