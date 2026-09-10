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

const NOT_FOUND_HTML = `<!DOCTYPE html><html><head>
  <title>Page not found | AgentBio</title>
  <meta name="robots" content="noindex, follow" />
</head><body><div id="root"><h1>404</h1></div></body></html>`;

const ENV = {
  VITE_SUPABASE_URL: 'https://api.example.test',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
  // Cloudflare Pages' static-asset binding. The route reads dist/404.html
  // through it to answer an unknown username with a real 404 (US-176).
  ASSETS: {
    fetch: async () =>
      new Response(NOT_FOUND_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
  },
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

  /**
   * US-202: the URL on the business card unfurled as nothing.
   *
   * US-187 made the SPA resolve /JaneDoe case-insensitively and the database
   * refuse to store a non-canonical username. This function was not part of
   * that change and queried PostgREST with `username=eq.<segment>` exactly, so
   * a crawler fetching the capitalised URL found no row and got a hard 404 —
   * while a human opening the very same URL got the page. The link worked in a
   * browser and produced no unfurl at all on Facebook, iMessage or LinkedIn.
   */
  describe('a username typed the way a person writes it', () => {
    it('looks the profile up by its canonical form', async () => {
      const { promise } = call({ path: '/JaneDoe', username: 'JaneDoe' });
      await promise;

      const profileQuery = fetchMock.mock.calls
        .map((c) => String(c[0]))
        .find((u) => u.includes('/rest/v1/profiles'));
      expect(profileQuery).toContain('username=eq.janedoe');
      expect(profileQuery).not.toContain('JaneDoe');
    });

    it('does not answer 404 for a real agent whose handle was capitalised', async () => {
      const { promise } = call({ path: '/JaneDoe', username: 'JaneDoe' });
      const response = await promise;
      expect(response.status).not.toBe(404);
    });

    it('sends the crawler to the one URL that is the page', async () => {
      const { promise } = call({ path: '/JaneDoe?listing=abc', username: 'JaneDoe' });
      const response = await promise;

      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe('/janedoe?listing=abc');
      expect(response.headers.get('x-agentbio-prerender')).toBe('canonical-redirect');
    });

    it('does not redirect a username that is already canonical', async () => {
      const { promise } = call({ path: '/jane', username: 'jane' });
      const response = await promise;
      expect(response.status).toBe(200);
      expect(response.headers.get('x-agentbio-prerender')).toBe('profile');
    });

    it('still 404s a capitalised handle that belongs to nobody', async () => {
      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        if (String(input).includes('/rest/v1/profiles')) return Response.json([]);
        return new Response(NOT_FOUND_HTML, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      });
      const { promise } = call({ path: '/NoSuchAgent', username: 'NoSuchAgent' });
      expect((await promise).status).toBe(404);
    });
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

  it('answers 404 for a username that does not exist (US-176)', async () => {
    // PostgREST answered, with no rows. Before this the route called next(),
    // which _redirects rewrote to index.html — so every typo of an agent's
    // handle returned 200 with the prerendered homepage.
    fetchMock.mockImplementation(async () => Response.json([]));

    const response = await call({ path: '/nobody', username: 'nobody' }).promise;
    expect(response.status).toBe(404);
    expect(await response.text()).toBe(NOT_FOUND_HTML);
    expect(response.headers.get('x-agentbio-prerender')).toBe('not-found');
  });

  it('does not 404 when the lookup itself failed', async () => {
    // A database blip must not deindex every agent at once. `null` from
    // fetchJson means errored or timed out; only an empty array is a 404.
    fetchMock.mockImplementation(async () => {
      throw new Error('upstream down');
    });

    const response = await call({ path: '/jane', username: 'jane' }).promise;
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(INDEX_HTML);
  });

  it('falls through rather than inventing a response when the 404 document is missing', async () => {
    fetchMock.mockImplementation(async () => Response.json([]));

    const response = await call({
      path: '/nobody',
      username: 'nobody',
      env: {
        ...ENV,
        ASSETS: { fetch: async () => new Response('nope', { status: 500 }) },
      } as never,
    }).promise;

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(INDEX_HTML);
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
