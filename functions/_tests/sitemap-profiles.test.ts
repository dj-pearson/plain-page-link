/**
 * /sitemap-profiles.xml (US-262): the agents' pages were in no sitemap.
 * US-372: neither were their listing pages (/:username/listing/:id).
 *
 * Runs the Pages route itself against a stubbed global fetch, the way
 * username-route.test.ts does. The stub answers by table, because the route
 * reads profiles, listings and user_settings in parallel. What matters most is
 * what it never does: answer an upstream failure with an empty 200, which
 * would tell Google every agent's page had gone, or list a listing the agent
 * has hidden.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { onRequestGet } from '../sitemap-profiles.xml';
import { PAGE_SIZE, profilePaths, sitemapEntries } from '../_lib/profile-sitemap';
import { isReservedSegment } from '../_lib/social-meta';

const ENV = { VITE_SUPABASE_URL: 'https://api.example.test/', VITE_SUPABASE_ANON_KEY: 'anon-key' };
const REQUEST = () => new Request('https://agentbio.net/sitemap-profiles.xml');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

type Table = 'profiles' | 'listings' | 'user_settings';
type Answer = Response | Error | ((offset: number) => Response | Error);

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

/** Answer each table's query; a table not given answers an empty list. */
function serve(answers: Partial<Record<Table, Answer>>) {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(input);
    const table = url.pathname.split('/').pop() as Table;
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const answer = answers[table] ?? json([]);
    const resolved = typeof answer === 'function' ? answer(offset) : answer;
    if (resolved instanceof Error) throw resolved;
    return resolved.clone();
  });
}

const callsTo = (table: Table) =>
  fetchMock.mock.calls.map(([u]) => new URL(u)).filter((u) => u.pathname.endsWith(`/${table}`));

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
    serve({
      profiles: json([{ username: 'jane' }, { username: 'dana-rivers' }, { username: 'josé' }]),
    });
    const response = await run();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/xml/);
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
    const xml = await response.text();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://agentbio.net/jane</loc>');
    expect(xml).toContain('<loc>https://agentbio.net/dana-rivers</loc>');
    expect(xml).toContain('<loc>https://agentbio.net/jos%C3%A9</loc>');
    // profiles.updated_at is not anon-readable, so a profile never claims a date.
    expect(xml).not.toContain('<lastmod>');
  });

  it('asks for published profiles only, with the anon key, ordered for stable paging', async () => {
    serve({ profiles: json([{ id: 'u1', username: 'jane' }]) });
    await run();

    const [parsed] = callsTo('profiles');
    expect(parsed.origin + parsed.pathname).toBe('https://api.example.test/rest/v1/profiles');
    expect(parsed.searchParams.get('select')).toBe('id,username');
    expect(parsed.searchParams.get('is_published')).toBe('is.true');
    expect(parsed.searchParams.get('order')).toBe('username.asc');
    expect(parsed.searchParams.get('limit')).toBe(String(PAGE_SIZE));
    expect(parsed.searchParams.get('offset')).toBe('0');
    const init = fetchMock.mock.calls.find(([u]) => u.includes('/profiles'))?.[1];
    expect(new Headers(init?.headers).get('apikey')).toBe('anon-key');
  });

  it('pages by 1000 until a short page', async () => {
    const page = (start: number, n: number) =>
      Array.from({ length: n }, (_, i) => ({ username: `agent${start + i}` }));
    serve({ profiles: (offset) => json(page(offset, offset < 2000 ? 1000 : 3)) });
    const response = await run();

    expect(callsTo('profiles').map((u) => u.searchParams.get('offset'))).toEqual([
      '0',
      '1000',
      '2000',
    ]);
    const xml = await response.text();
    expect(xml.match(/<loc>/g)).toHaveLength(2003);
  });

  it('answers 503, not an empty or partial 200, when any page fails', async () => {
    serve({
      profiles: (offset) =>
        offset === 0
          ? json(Array.from({ length: 1000 }, (_, i) => ({ username: `agent${i}` })))
          : json({ message: 'upstream down' }, 500),
    });
    const response = await run();

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).not.toContain('<urlset');
  });

  it('answers 503 when the network throws or the body is not a list', async () => {
    serve({ profiles: new Error('timeout') });
    expect((await run()).status).toBe(503);

    serve({ profiles: json({ not: 'a list' }) });
    expect((await run()).status).toBe(503);
  });

  it('answers 503 rather than an empty sitemap when nothing is published', async () => {
    serve({ profiles: json([]) });
    expect((await run()).status).toBe(503);
  });

  it('answers 503 without a Supabase binding, and does not fetch', async () => {
    expect((await run({})).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/sitemap-profiles.xml listing pages (US-372)', () => {
  const PROFILES = [
    { id: 'u-jane', username: 'Jane' },
    { id: 'u-dana', username: 'dana' },
  ];

  it("lists each visible listing after its agent's page, with lastmod from updated_at", async () => {
    serve({
      profiles: json(PROFILES),
      listings: json([
        { id: 'l-1', user_id: 'u-jane', status: 'active', updated_at: '2026-10-01T12:30:00+00:00' },
        {
          id: 'l-2',
          user_id: 'u-dana',
          status: 'sold',
          updated_at: '2026-09-15T08:00:00.123456+00:00',
        },
        { id: 'l-3', user_id: 'u-jane', status: 'under_contract', updated_at: null },
      ]),
    });
    const response = await run();
    expect(response.status).toBe(200);
    const xml = await response.text();

    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([
      'https://agentbio.net/jane',
      'https://agentbio.net/jane/listing/l-1',
      'https://agentbio.net/jane/listing/l-3',
      'https://agentbio.net/dana',
      'https://agentbio.net/dana/listing/l-2',
    ]);
    expect(xml).toContain(
      '<loc>https://agentbio.net/jane/listing/l-1</loc>\n    <lastmod>2026-10-01T12:30:00.000Z</lastmod>'
    );
    expect(xml).toContain('<lastmod>2026-09-15T08:00:00.123Z</lastmod>');
    // No updated_at, no date: l-3's entry goes straight to changefreq.
    expect(xml).toContain(
      '<loc>https://agentbio.net/jane/listing/l-3</loc>\n    <changefreq>weekly</changefreq>'
    );
    expect(xml.match(/<lastmod>/g)).toHaveLength(2);
  });

  it('reads listings and settings with the anon key, filtered to public statuses and ordered by a unique key', async () => {
    serve({ profiles: json(PROFILES) });
    await run();

    const [listings] = callsTo('listings');
    expect(listings.searchParams.get('select')).toBe('id,user_id,status,updated_at');
    expect(listings.searchParams.get('status')).toBe('in.(active,pending,under_contract,sold)');
    expect(listings.searchParams.get('order')).toBe('id.asc');
    expect(listings.searchParams.get('limit')).toBe(String(PAGE_SIZE));

    const [settings] = callsTo('user_settings');
    // Exactly the columns anon is granted on user_settings (US-110).
    expect(settings.searchParams.get('select')).toBe('user_id,show_listings,show_sold_properties');
    expect(settings.searchParams.get('order')).toBe('user_id.asc');

    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get('apikey')).toBe('anon-key');
    }
  });

  it('omits listings the agent hides with show_listings, and sold ones hidden with show_sold_properties', async () => {
    serve({
      profiles: json(PROFILES),
      listings: json([
        { id: 'j-active', user_id: 'u-jane', status: 'active' },
        { id: 'j-sold', user_id: 'u-jane', status: 'sold' },
        { id: 'd-active', user_id: 'u-dana', status: 'active' },
        { id: 'd-sold', user_id: 'u-dana', status: 'sold' },
      ]),
      user_settings: json([
        { user_id: 'u-jane', show_listings: true, show_sold_properties: false },
        { user_id: 'u-dana', show_listings: false, show_sold_properties: true },
      ]),
    });
    const xml = await (await run()).text();

    expect(xml).toContain('/jane/listing/j-active</loc>');
    expect(xml).not.toContain('j-sold');
    expect(xml).not.toContain('d-active');
    expect(xml).not.toContain('d-sold');
    // The agents' own pages are listed either way.
    expect(xml).toContain('<loc>https://agentbio.net/dana</loc>');
  });

  it('answers 503 when the listings or the settings read fails, rather than guessing', async () => {
    serve({ profiles: json(PROFILES), listings: json({ message: 'down' }, 500) });
    expect((await run()).status).toBe(503);

    // Defaulting the toggles to "show" would list homes the agent hid.
    serve({ profiles: json(PROFILES), user_settings: new Error('timeout') });
    expect((await run()).status).toBe(503);
  });
});

describe('sitemapEntries', () => {
  it('skips listings of agents not in the sitemap, drafts, and malformed rows', () => {
    const entries = sitemapEntries(
      [
        { id: 'u1', username: 'jane' },
        { id: 'u2', username: 'dashboard' },
      ],
      [
        { id: 'a', user_id: 'u1', status: 'active' },
        { id: 'b', user_id: 'u1', status: 'draft' },
        { id: 'c', user_id: 'u1', status: 'off_market' },
        { id: 'd', user_id: 'u2', status: 'active' },
        { id: 'e', user_id: 'u-unpublished', status: 'active' },
        { id: '', user_id: 'u1', status: 'active' },
        { id: 7, user_id: 'u1', status: 'active' },
        { id: 'f', user_id: 'u1', status: null },
      ]
    );
    expect(entries.map((e) => e.path)).toEqual(['/jane', '/jane/listing/a']);
  });

  it('gives listing pages a lower priority than the agent page and encodes both parts', () => {
    const entries = sitemapEntries(
      [{ id: 'u1', username: 'a&b' }],
      [{ id: 'x/y', user_id: 'u1', status: 'pending', updated_at: 'not a date' }]
    );
    expect(entries).toEqual([
      { path: '/a%26b', priority: '0.6' },
      { path: '/a%26b/listing/x%2Fy', lastmod: undefined, priority: '0.5' },
    ]);
  });

  it('lists an agent and their listings once even if PostgREST repeats a row', () => {
    const entries = sitemapEntries(
      [
        { id: 'u1', username: 'jane' },
        { id: 'u1', username: 'Jane' },
      ],
      [{ id: 'a', user_id: 'u1', status: 'active' }]
    );
    expect(entries.map((e) => e.path)).toEqual(['/jane', '/jane/listing/a']);
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
