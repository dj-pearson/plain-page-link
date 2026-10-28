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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { onRequestGet } from '../[username]';

/**
 * What next() really returns for /:username: dist/index.html, which since
 * US-147 is the PRERENDERED HOMEPAGE — Landing's full body in #root, the
 * helmet-managed tags (data-rh="true") and the homepage's JSON-LD @graph.
 *
 * This used to be a five-line shell with an empty #root, which is why the
 * suite passed while every crawler got the homepage's body and its
 * WebSite/SoftwareApplication/FAQPage graph under an agent's URL (US-242).
 * The fixture is the real `vite build` index.html with Landing rendered into
 * it and serialised the way scripts/prerender.mts does (duplicate tags
 * removed in favour of the data-rh ones). Regenerate it if the homepage's
 * head changes shape.
 */
const INDEX_HTML = readFileSync(join(__dirname, 'fixtures', 'prerendered-index.html'), 'utf8');

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
  id: 'profile-jane',
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

  it("does not serve the homepage's body or structured data under the agent's URL (US-242)", async () => {
    // The fixture really is the homepage; prove it, or the rest proves nothing.
    expect(INDEX_HTML).toContain('"@type":"SoftwareApplication"');
    expect(INDEX_HTML).toContain('"@type":"FAQPage"');
    expect(INDEX_HTML).toContain('<main id="main-content"');

    const html = await (await call({}).promise).text();

    for (const type of ['WebSite', 'SoftwareApplication', 'FAQPage', 'ProfessionalService']) {
      expect(html, type).not.toContain(`"@type":"${type}"`);
    }
    expect(html.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(html).toContain('"@type":"RealEstateAgent"');

    expect(html).not.toContain('id="main-content"');
    expect(html).not.toContain('Link in Bio for Real Estate Agents');
    expect(html).toContain(
      '<div id="root"><main><h1>Jane Doe — Associate Broker at Summit Realty</h1><p>Fifteen years on the east bench.</p></main></div>'
    );
    // Exactly one of each head tag, all the agent's.
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).toContain('href="https://agentbio.net/jane"');
    // The app still boots for a crawler that runs scripts.
    expect(html).toMatch(
      /<script type="module" crossorigin="" src="\/assets\/index-[^"]+\.js"><\/script>/
    );
  });

  it('301s a mixed-case username to the lowercase URL instead of a 404 (US-242)', async () => {
    for (const userAgent of [CRAWLER, HUMAN]) {
      fetchMock.mockClear();
      const { promise, next } = call({
        path: '/JaneDoe?listing=abc-123',
        username: 'JaneDoe',
        userAgent,
      });
      const response = await promise;
      expect(response.status, userAgent).toBe(301);
      expect(response.headers.get('location')).toBe('https://agentbio.net/janedoe?listing=abc-123');
      expect(next).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  });

  it('does not redirect an app route that happens to be capitalised', async () => {
    const { promise, next } = call({ path: '/Dashboard', username: 'Dashboard' });
    expect((await promise).status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("only resolves a ?listing= that belongs to the profile's agent (US-242)", async () => {
    await call({ path: '/jane?listing=abc-123' }).promise;
    const listingUrl = fetchMock.mock.calls
      .map(([input]) => String(input))
      .find((url) => url.includes('/rest/v1/listings'));
    expect(listingUrl).toContain('id=eq.abc-123');
    expect(listingUrl).toContain('user_id=eq.profile-jane');

    // PostgREST answers [] when the id is someone else's: the agent's card stays.
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
      if (url.includes('user_id=eq.profile-jane')) return Response.json([]);
      return Response.json([LISTING_ROW]);
    });
    const html = await (await call({ path: '/jane?listing=abc-123' }).promise).text();
    expect(html).not.toContain('412 Maple Avenue');
    expect(html).toContain('<title>Jane Doe — Associate Broker at Summit Realty</title>');
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
