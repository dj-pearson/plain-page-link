/**
 * /sitemap-profiles.xml (US-262): the agents' pages were in no sitemap.
 *
 * Runs the Pages route itself against a stubbed global fetch, the way
 * username-route.test.ts does. What matters most is what it never does: answer
 * an upstream failure with an empty 200, which would tell Google every agent's
 * page had gone.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { onRequestGet } from '../sitemap-profiles.xml';
import { PAGE_SIZE, profilePaths } from '../_lib/profile-sitemap';
import { isReservedSegment } from '../_lib/social-meta';

const ENV = { VITE_SUPABASE_URL: 'https://api.example.test/', VITE_SUPABASE_ANON_KEY: 'anon-key' };
const REQUEST = () => new Request('https://agentbio.net/sitemap-profiles.xml');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const run = (env: Record<string, string> = ENV) => onRequestGet({ request: REQUEST(), env });

describe('/sitemap-profiles.xml', () => {
  it('lists every published username as an absolute, URL-encoded loc', async () => {
    fetchMock.mockResolvedValueOnce(
      json([{ username: 'jane' }, { username: 'dana-rivers' }, { username: 'josé' }])
    );
    const response = await run();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/xml/);
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
    const xml = await response.text();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://agentbio.net/jane</loc>');
    expect(xml).toContain('<loc>https://agentbio.net/dana-rivers</loc>');
    expect(xml).toContain('<loc>https://agentbio.net/jos%C3%A9</loc>');
    expect(xml).not.toContain('<lastmod>');
  });

  it('asks for published profiles only, with the anon key, ordered for stable paging', async () => {
    fetchMock.mockResolvedValueOnce(json([{ username: 'jane' }]));
    await run();

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://api.example.test/rest/v1/profiles');
    expect(parsed.searchParams.get('select')).toBe('username');
    expect(parsed.searchParams.get('is_published')).toBe('is.true');
    expect(parsed.searchParams.get('order')).toBe('username.asc');
    expect(parsed.searchParams.get('limit')).toBe(String(PAGE_SIZE));
    expect(parsed.searchParams.get('offset')).toBe('0');
    expect(new Headers(init?.headers).get('apikey')).toBe('anon-key');
  });

  it('pages by 1000 until a short page', async () => {
    const page = (start: number, n: number) =>
      Array.from({ length: n }, (_, i) => ({ username: `agent${start + i}` }));
    fetchMock
      .mockResolvedValueOnce(json(page(0, 1000)))
      .mockResolvedValueOnce(json(page(1000, 1000)))
      .mockResolvedValueOnce(json(page(2000, 3)));
    const response = await run();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(([u]) => new URL(u).searchParams.get('offset'))).toEqual([
      '0',
      '1000',
      '2000',
    ]);
    const xml = await response.text();
    expect(xml.match(/<loc>/g)).toHaveLength(2003);
  });

  it('answers 503, not an empty or partial 200, when any page fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(Array.from({ length: 1000 }, (_, i) => ({ username: `agent${i}` })))
      )
      .mockResolvedValueOnce(json({ message: 'upstream down' }, 500));
    const response = await run();

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).not.toContain('<urlset');
  });

  it('answers 503 when the network throws or the body is not a list', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    expect((await run()).status).toBe(503);

    fetchMock.mockResolvedValueOnce(json({ not: 'a list' }));
    expect((await run()).status).toBe(503);
  });

  it('answers 503 rather than an empty sitemap when nothing is published', async () => {
    fetchMock.mockResolvedValueOnce(json([]));
    expect((await run()).status).toBe(503);
  });

  it('answers 503 without a Supabase binding, and does not fetch', async () => {
    expect((await run({})).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('profilePaths', () => {
  it('normalises, de-duplicates and skips app routes', () => {
    expect(profilePaths(['Jane', 'jane', ' dana ', 'dashboard', '', null, 7, 'a&b'])).toEqual([
      '/jane',
      '/dana',
      '/a%26b',
    ]);
  });
});

describe('the sitemap is reachable', () => {
  it('is never mistaken for a username by functions/[username].ts', () => {
    expect(isReservedSegment('sitemap-profiles.xml')).toBe(true);
  });

  it('robots.txt names it next to the build sitemap', () => {
    const robots = readFileSync(join(__dirname, '..', '..', 'public', 'robots.txt'), 'utf8');
    const sitemaps = robots
      .split('\n')
      .filter((l) => /^sitemap:/i.test(l.trim()))
      .map((l) => l.trim().slice('sitemap:'.length).trim());
    expect(sitemaps).toEqual([
      'https://agentbio.net/sitemap.xml',
      'https://agentbio.net/sitemap-profiles.xml',
    ]);
  });
});
