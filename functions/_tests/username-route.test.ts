/**
 * The Pages route itself (US-114), not just its helpers.
 *
 * onRequestGet is an ordinary async function over Request/Response, so it runs
 * here against a stubbed fetch and a stubbed next() — no Workers runtime and no
 * wrangler needed. It lives under an underscore-prefixed directory because
 * Cloudflare Pages turns every other file in functions/ into a route, and
 * /username-route.test is not a route this site should have. What matters is what it does NOT do: divert a human, divert
 * an app route, or fail the page when the database is unreachable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet } from '../[username]';

const INDEX_HTML = `<!DOCTYPE html><html><head>
  <meta property="og:image" content="https://agentbio.net/Cover.png" />
  <title>Real Estate Agent Bio Page Builder – AgentBio</title>
</head><body><div id="root"></div></body></html>`;

const ENV = {
  VITE_SUPABASE_URL: 'https://api.example.test',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
};

const PROFILE_ROW = {
  username: 'jane',
  full_name: 'Jane Doe',
  bio: 'Fifteen years on the east bench.',
  avatar_url: 'https://cdn.example.com/jane.jpg',
  og_image: null,
  seo_title: null,
  seo_description: null,
  title: 'Associate Broker',
  brokerage_name: 'Summit Realty',
  service_cities: ['Salt Lake City'],
};

const LISTING_ROW = {
  id: 'abc-123',
  address: '412 Maple Avenue',
  city: 'Salt Lake City',
  state: 'UT',
  price: '525000',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1980,
  description: null,
  photos: ['https://cdn.example.com/412-maple.jpg'],
  image: null,
};

const CRAWLER = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const HUMAN =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const indexResponse = () =>
  new Response(INDEX_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });

const call = (opts: {
  path?: string;
  username?: string;
  userAgent?: string;
  env?: Record<string, string>;
  next?: () => Promise<Response>;
}) => {
  const next = opts.next ?? vi.fn(async () => indexResponse());
  const promise = onRequestGet({
    request: new Request(`https://agentbio.net${opts.path ?? '/jane'}`, {
      headers: { 'user-agent': opts.userAgent ?? CRAWLER },
    }),
    env: (opts.env ?? ENV) as never,
    params: { username: opts.username ?? 'jane' },
    next,
  });
  return { promise, next };
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
    if (url.includes('/rest/v1/listings')) return Response.json([LISTING_ROW]);
    return new Response('[]', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /:username', () => {
  it('serves a crawler the agent, not the product', async () => {
    const { promise } = call({ userAgent: CRAWLER });
    const response = await promise;
    const html = await response.text();

    expect(response.headers.get('x-agentbio-prerender')).toBe('profile');
    expect(html).toContain('<title>Jane Doe — Associate Broker at Summit Realty</title>');
    expect(html).toContain('content="https://cdn.example.com/jane.jpg"');
    expect(html).not.toContain('Cover.png');
  });

  it('leaves a person the SPA untouched, and does not query the database for them', async () => {
    const { promise, next } = call({ userAgent: HUMAN });
    const response = await promise;

    expect(await response.text()).toBe(INDEX_HTML);
    expect(response.headers.get('x-agentbio-prerender')).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not touch an app route that happens to be one segment', async () => {
    for (const segment of ['dashboard', 'auth', 'blog']) {
      fetchMock.mockClear();
      const { promise } = call({ path: `/${segment}`, username: segment });
      await promise;
      expect(fetchMock, segment).not.toHaveBeenCalled();
    }
  });

  it('describes the listing when one is deep-linked', async () => {
    const { promise } = call({ path: '/jane?listing=abc-123' });
    const html = await (await promise).text();

    expect(html).toContain('412 Maple Avenue, Salt Lake City, UT — $525,000');
    expect(html).toContain('content="https://cdn.example.com/412-maple.jpg"');
    expect(html).toContain('"@type":"SingleFamilyResidence"');
  });

  it('keeps the agent card when the deep-linked listing no longer exists', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
      return Response.json([]);
    });

    const html = await (await call({ path: '/jane?listing=gone' }).promise).text();
    expect(html).toContain('<title>Jane Doe — Associate Broker at Summit Realty</title>');
  });

  it('falls through for an unknown username instead of inventing a card', async () => {
    fetchMock.mockImplementation(async () => Response.json([]));

    const { promise } = call({ path: '/nobody', username: 'nobody' });
    expect(await (await promise).text()).toBe(INDEX_HTML);
  });

  it('falls through when the database is unreachable — the page still loads', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('upstream down');
    });

    const response = await call({}).promise;
    expect(await response.text()).toBe(INDEX_HTML);
    expect(response.status).toBe(200);
  });

  it('falls through when the Pages project has no Supabase binding', async () => {
    const { promise } = call({ env: {} });
    expect(await (await promise).text()).toBe(INDEX_HTML);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('leaves a non-HTML asset response alone', async () => {
    const next = vi.fn(
      async () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })
    );
    const response = await call({ next }).promise;
    expect(await response.text()).toBe('{"ok":true}');
  });
});
