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
import { onRequestGet as onListingRequestGet } from '../[username]/listing/[listingId]';

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
  status: 'active',
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

const MANIFEST_LINK = /<link\b[^>]*\brel=["']?manifest["']?[^>]*>/gi;
const manifestLinks = (html: string) => html.match(MANIFEST_LINK) ?? [];
const withoutManifestLinks = (html: string) => html.replace(MANIFEST_LINK, '');

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
    // No settings row: the defaults, which show every listing.
    if (url.includes('/rest/v1/user_settings')) return Response.json([]);
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

  it("serves an answer engine's crawler the agent, and a 404 for an unknown handle (US-520)", async () => {
    const GPTBOT =
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot';
    const html = await (await call({ userAgent: GPTBOT }).promise).text();
    expect(html).toContain('<h1>Jane Doe — Associate Broker at Summit Realty</h1>');
    expect(html).toContain('"@type":"RealEstateAgent"');
    expect(html).not.toContain('"@type":"SoftwareApplication"');

    fetchMock.mockImplementation(async () => Response.json([]));
    const missing = await call({
      path: '/nobody',
      username: 'nobody',
      userAgent:
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
    }).promise;
    expect(missing.status).toBe(404);
  });

  it("links the agent's own web app manifest, not the dashboard's (US-471)", async () => {
    expect(INDEX_HTML).toContain('<link rel="manifest" href="/manifest.json">');
    const html = await (await call({}).promise).text();
    expect(html.match(/rel="manifest"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="manifest" href="/jane/manifest.json" />');
    expect(html).not.toContain('href="/manifest.json"');
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
      '<div id="root"><main><h1>Jane Doe — Associate Broker at Summit Realty</h1><p>Fifteen years on the east bench.</p>'
    );
    expect(html).toMatch(/<div id="root"><main>[\s\S]*<\/main><\/div>/);
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

  it("gives a person the SPA naming the agent's manifest, without a database read (US-553)", async () => {
    const { promise, next } = call({ userAgent: HUMAN });
    const response = await promise;
    const html = await response.text();

    expect(manifestLinks(html)).toEqual(['<link rel="manifest" href="/jane/manifest.json" />']);
    // Apart from that one link, the document is the asset server's.
    expect(withoutManifestLinks(html)).toBe(withoutManifestLinks(INDEX_HTML));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-agentbio-prerender')).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops the asset's length and ETag but keeps its caching for a person", async () => {
    const next = vi.fn(
      async () =>
        new Response(INDEX_HTML, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'content-length': String(INDEX_HTML.length),
            etag: '"asset-etag"',
            'cache-control': 'public, max-age=0, must-revalidate',
          },
        })
    );
    const response = await call({ userAgent: HUMAN, next }).promise;
    expect(response.headers.get('content-length')).toBeNull();
    expect(response.headers.get('etag')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
  });

  it('passes a non-HTML or failed asset response to a person unchanged', async () => {
    for (const asset of [
      new Response('{}', { headers: { 'content-type': 'application/json' } }),
      new Response('<html><head></head></html>', {
        status: 500,
        headers: { 'content-type': 'text/html' },
      }),
    ]) {
      const response = await call({ userAgent: HUMAN, next: async () => asset }).promise;
      expect(response).toBe(asset);
    }
  });

  it('does not touch an app route that happens to be one segment', async () => {
    for (const segment of ['dashboard', 'pricing', 'blog']) {
      fetchMock.mockClear();
      const next = vi.fn(async () => indexResponse());
      const response = await call({ path: `/${segment}`, username: segment, next }).promise;
      expect(fetchMock, segment).not.toHaveBeenCalled();
      expect(next, segment).toHaveBeenCalledTimes(1);
      expect(response.status, segment).toBe(200);
    }
  });

  it('answers 404 for a reserved word that is not a page, for people and crawlers (US-435)', async () => {
    // /about, /legal, /api ... are kept out of the username lookup but are not
    // routes; they used to fall through to the /:username rewrite and answer
    // 200 with the prerendered homepage.
    for (const userAgent of [CRAWLER, HUMAN]) {
      for (const segment of [
        'about',
        'legal',
        'contact',
        'help',
        'support',
        'api',
        'auth',
        'About',
      ]) {
        fetchMock.mockClear();
        const next = vi.fn(async () => indexResponse());
        const response = await call({ path: `/${segment}`, username: segment, userAgent, next })
          .promise;
        expect(response.status, segment).toBe(404);
        expect(await response.text(), segment).toBe(NOT_FOUND_HTML);
        expect(response.headers.get('x-agentbio-prerender'), segment).toBe('not-found');
        expect(next, segment).not.toHaveBeenCalled();
        expect(fetchMock, segment).not.toHaveBeenCalled();
      }
    }
  });

  it('still serves an asset whose name is reserved', async () => {
    const next = vi.fn(
      async () => new Response('User-agent: *', { headers: { 'content-type': 'text/plain' } })
    );
    const response = await call({ path: '/robots.txt', username: 'robots.txt', next }).promise;
    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
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

describe("the agent's page body for crawlers (US-539)", () => {
  const SOLD_ROW = { ...LISTING_ROW, id: 'sold-1', status: 'sold', address: '9 Birch Court' };
  const DRAFT_ROW = { ...LISTING_ROW, id: 'draft-1', status: 'draft', address: '1 Secret Lane' };
  const FULL_PROFILE = {
    ...PROFILE_ROW,
    service_cities: ['Salt Lake City', 'Park City'],
    license_number: 'UT-12345',
    license_state: 'UT',
    phone: '(801) 555-0100',
    email_display: 'jane@summit.example',
  };

  const serve = (opts: {
    profile?: Record<string, unknown>;
    listings?: Record<string, unknown>[] | 'error';
    settings?: Record<string, unknown>[] | 'error';
  }) => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest/v1/profiles')) return Response.json([opts.profile ?? FULL_PROFILE]);
      if (url.includes('/rest/v1/listings')) {
        return opts.listings === 'error'
          ? new Response('{}', { status: 500 })
          : Response.json(opts.listings ?? [SOLD_ROW, LISTING_ROW, DRAFT_ROW]);
      }
      if (url.includes('/rest/v1/user_settings')) {
        return opts.settings === 'error'
          ? new Response('{}', { status: 500 })
          : Response.json(opts.settings ?? []);
      }
      return new Response('[]', { status: 404 });
    });
  };

  const profileHtml = async () => (await call({}).promise).text();

  it('names the service areas, brokerage, licence, listings and contact links', async () => {
    serve({});
    const html = await profileHtml();
    expect(html).toContain('<li>Associate Broker at Summit Realty</li>');
    expect(html).toContain('<li>License #UT-12345 (UT)</li>');
    expect(html).toContain(
      '<section><h2>Service areas</h2><ul><li>Salt Lake City</li><li>Park City</li></ul></section>'
    );
    expect(html).toContain(
      '<a href="https://agentbio.net/jane/listing/abc-123">412 Maple Avenue, Salt Lake City, UT</a>'
    );
    expect(html).toContain('<a href="https://agentbio.net/jane/listing/sold-1">9 Birch Court');
    // Available before sold, as the page orders them.
    expect(html.indexOf('412 Maple Avenue')).toBeLessThan(html.indexOf('9 Birch Court'));
    // A draft is never public.
    expect(html).not.toContain('1 Secret Lane');
    expect(html).toContain('<a href="tel:8015550100">(801) 555-0100</a>');
    expect(html).toContain('<a href="mailto:jane@summit.example">jane@summit.example</a>');
  });

  it('reads the listings and the toggles scoped to the agent, without photos', async () => {
    serve({});
    await profileHtml();
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    const listingUrl = urls.find((url) => url.includes('/rest/v1/listings'));
    expect(listingUrl).toContain('user_id=eq.profile-jane');
    expect(listingUrl).not.toContain('photos');
    const settingsUrl = urls.find((url) => url.includes('/rest/v1/user_settings'));
    expect(settingsUrl).toContain('user_id=eq.profile-jane');
    expect(settingsUrl).toContain('show_contact_buttons');
  });

  it('names no listing while the agent hides listings', async () => {
    serve({ settings: [{ show_listings: false, show_sold_properties: true }] });
    const html = await profileHtml();
    expect(html).not.toContain('412 Maple Avenue');
    expect(html).not.toContain('9 Birch Court');
    expect(html).not.toContain('<h2>Listings</h2>');
  });

  it('names no sold home while sold properties are hidden', async () => {
    serve({ settings: [{ show_listings: true, show_sold_properties: false }] });
    const html = await profileHtml();
    expect(html).toContain('412 Maple Avenue');
    expect(html).not.toContain('9 Birch Court');
  });

  it('withholds listings and contact links when the settings read fails', async () => {
    serve({ settings: 'error' });
    const response = await call({}).promise;
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<h2>Service areas</h2>');
    expect(html).not.toContain('412 Maple Avenue');
    expect(html).not.toContain('tel:');
  });

  it('still serves the agent when the listings read fails', async () => {
    serve({ listings: 'error' });
    const html = await profileHtml();
    expect(html).toContain('<li>License #UT-12345 (UT)</li>');
    expect(html).not.toContain('<h2>Listings</h2>');
  });

  it('leaves out contact links while the agent hides contact buttons', async () => {
    serve({ settings: [{ show_contact_buttons: false }] });
    const html = await profileHtml();
    expect(html).toContain('412 Maple Avenue');
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('mailto:');
  });

  it('gives the listing page its facts and a link back to the agent', async () => {
    serve({});
    const html = await (
      await onListingRequestGet({
        request: new Request('https://agentbio.net/jane/listing/abc-123', {
          headers: { 'user-agent': CRAWLER },
        }),
        env: ENV as never,
        params: { username: 'jane', listingId: 'abc-123' },
        next: async () => indexResponse(),
      })
    ).text();
    expect(html).toContain('<p>Active · $525,000 · 3 bd · 2 ba · 1,980 sqft</p>');
    expect(html).toContain(
      '<p>Listed by <a href="https://agentbio.net/jane">Jane Doe</a>, Associate Broker at Summit Realty.</p>'
    );
    // The listing page does not read the agent's whole gallery.
    const listingReads = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/rest/v1/listings')
    );
    expect(listingReads).toHaveLength(1);
  });
});

describe('/:username/listing/:listingId (US-275)', () => {
  const callListing = (opts: {
    path: string;
    username?: string;
    listingId?: string;
    userAgent?: string;
  }) => {
    const next = vi.fn(async () => indexResponse());
    const promise = onListingRequestGet({
      request: new Request(`https://agentbio.net${opts.path}`, {
        headers: { 'user-agent': opts.userAgent ?? CRAWLER },
      }),
      env: ENV as never,
      params: { username: opts.username ?? 'jane', listingId: opts.listingId ?? 'abc-123' },
      next,
    });
    return { promise, next };
  };

  it("links the agent's manifest on a listing page, including a withdrawn one (US-471)", async () => {
    const html = await (await callListing({ path: '/jane/listing/abc-123' }).promise).text();
    expect(html.match(/rel="manifest"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="manifest" href="/jane/manifest.json" />');

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
      return Response.json([]);
    });
    const gone = await callListing({ path: '/jane/listing/abc-123' }).promise;
    expect(gone.status).toBe(404);
    const goneHtml = await gone.text();
    expect(goneHtml.match(/rel="manifest"/g)).toHaveLength(1);
    expect(goneHtml).toContain('<link rel="manifest" href="/jane/manifest.json" />');
  });

  it("gives a crawler the listing's card, scoped to the agent, with the page as its URL", async () => {
    const response = await callListing({ path: '/jane/listing/abc-123' }).promise;
    const html = await response.text();

    expect(response.headers.get('x-agentbio-prerender')).toBe('listing');
    expect(html).toContain('412 Maple Avenue, Salt Lake City, UT — $525,000');
    expect(html).toContain('https://agentbio.net/jane/listing/abc-123');
    const listingUrl = fetchMock.mock.calls
      .map(([input]) => String(input))
      .find((url) => url.includes('/rest/v1/listings'));
    expect(listingUrl).toContain('id=eq.abc-123');
    expect(listingUrl).toContain('user_id=eq.profile-jane');
  });

  it('301s a mixed-case username to the lowercase listing URL', async () => {
    const { promise, next } = callListing({
      path: '/JaneDoe/listing/abc-123?utm_source=ig',
      username: 'JaneDoe',
      userAgent: HUMAN,
    });
    const response = await promise;
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://agentbio.net/janedoe/listing/abc-123?utm_source=ig'
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("gives a person the SPA naming the agent's manifest (US-553)", async () => {
    const { promise, next } = callListing({ path: '/jane/listing/abc-123', userAgent: HUMAN });
    const html = await (await promise).text();
    expect(manifestLinks(html)).toEqual(['<link rel="manifest" href="/jane/manifest.json" />']);
    expect(withoutManifestLinks(html)).toBe(withoutManifestLinks(INDEX_HTML));
    expect(next).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('points the legacy ?listing= card at the listing page too', async () => {
    const html = await (await call({ path: '/jane?listing=abc-123' }).promise).text();
    expect(html).toContain('https://agentbio.net/jane/listing/abc-123');
  });

  describe('visibility toggles (US-382)', () => {
    const AGENT_TITLE = '<title>Jane Doe — Associate Broker at Summit Realty</title>';
    const LISTING_TITLE = '412 Maple Avenue, Salt Lake City, UT — $525,000';

    const serve = (
      listing: Record<string, unknown>,
      settings: Record<string, unknown>[] | 'error'
    ) => {
      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
        if (url.includes('/rest/v1/listings')) return Response.json([listing]);
        if (url.includes('/rest/v1/user_settings')) {
          return settings === 'error'
            ? new Response('{}', { status: 500 })
            : Response.json(settings);
        }
        return new Response('[]', { status: 404 });
      });
    };

    const listingHtml = async () =>
      (await callListing({ path: '/jane/listing/abc-123' }).promise).text();

    it("reads only the agent's two public toggles, scoped to the agent", async () => {
      await listingHtml();
      const settingsUrl = fetchMock.mock.calls
        .map(([input]) => String(input))
        .find((url) => url.includes('/rest/v1/user_settings'));
      expect(settingsUrl).toContain('select=show_listings,show_sold_properties');
      expect(settingsUrl).toContain('user_id=eq.profile-jane');
    });

    it('answers 404 with the agent card when the agent hides their listings (US-416)', async () => {
      serve(LISTING_ROW, [{ show_listings: false, show_sold_properties: true }]);
      const response = await callListing({ path: '/jane/listing/abc-123' }).promise;
      expect(response.status).toBe(404);
      expect(response.headers.get('x-agentbio-prerender')).toBe('listing-not-found');
      const html = await response.text();
      expect(html).toContain(AGENT_TITLE);
      expect(html).not.toContain('412 Maple Avenue');
      expect(html).not.toContain('412-maple.jpg');
    });

    it('answers 404 for a sold home while sold properties are hidden (US-416)', async () => {
      serve({ ...LISTING_ROW, status: 'sold' }, [
        { show_listings: true, show_sold_properties: false },
      ]);
      const response = await callListing({ path: '/jane/listing/abc-123' }).promise;
      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain(AGENT_TITLE);
      expect(html).not.toContain('412 Maple Avenue');
    });

    it('describes a sold home while sold properties are shown', async () => {
      serve({ ...LISTING_ROW, status: 'sold' }, [
        { show_listings: true, show_sold_properties: true },
      ]);
      expect(await listingHtml()).toContain(LISTING_TITLE);
    });

    it('describes an available home when only sold properties are hidden', async () => {
      serve({ ...LISTING_ROW, status: 'pending' }, [
        { show_listings: true, show_sold_properties: false },
      ]);
      expect(await listingHtml()).toContain(LISTING_TITLE);
    });

    it('withholds the listing when the settings read fails, rather than guess', async () => {
      serve(LISTING_ROW, 'error');
      const response = await callListing({ path: '/jane/listing/abc-123' }).promise;
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain(AGENT_TITLE);
      expect(html).not.toContain('412 Maple Avenue');
    });

    it('applies the same rules to the legacy ?listing= link, which stays 200 because it is the profile', async () => {
      serve(LISTING_ROW, [{ show_listings: false, show_sold_properties: true }]);
      const response = await call({ path: '/jane?listing=abc-123' }).promise;
      expect(response.status).toBe(200);
      expect(response.headers.get('x-agentbio-prerender')).toBe('listing');
      const html = await response.text();
      expect(html).toContain(AGENT_TITLE);
      expect(html).not.toContain('412 Maple Avenue');
    });
  });

  describe('a listing that is not public answers a hard 404, not a soft one (US-416)', () => {
    const NO_LISTING = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
      return Response.json([]);
    };

    it('404s a listing id that does not exist for this agent', async () => {
      fetchMock.mockImplementation(NO_LISTING);
      const response = await callListing({ path: '/jane/listing/gone', listingId: 'gone' }).promise;
      expect(response.status).toBe(404);
      expect(response.headers.get('x-robots-tag')).toBe('noindex');
    });

    it('404s a withdrawn listing', async () => {
      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
        if (url.includes('/rest/v1/listings'))
          return Response.json([{ ...LISTING_ROW, status: 'withdrawn' }]);
        return Response.json([]);
      });
      const response = await callListing({ path: '/jane/listing/abc-123' }).promise;
      expect(response.status).toBe(404);
    });

    it("swaps the homepage's robots index for noindex and points at the agent", async () => {
      fetchMock.mockImplementation(NO_LISTING);
      const html = await (
        await callListing({ path: '/jane/listing/gone', listingId: 'gone' }).promise
      ).text();
      expect(html).toContain('<meta name="robots" content="noindex, follow" />');
      expect(html).not.toMatch(/<meta name="robots" content="index/);
      expect(html.match(/<meta\s+name="robots"/g)).toHaveLength(1);
      expect(html).toContain('<link rel="canonical" href="https://agentbio.net/jane" />');
      expect(html).toContain('<title>Jane Doe — Associate Broker at Summit Realty</title>');
    });

    it('does not 404 when the listings read failed — a blip is not an answer', async () => {
      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/rest/v1/profiles')) return Response.json([PROFILE_ROW]);
        if (url.includes('/rest/v1/listings')) throw new Error('upstream down');
        return Response.json([]);
      });
      const response = await callListing({ path: '/jane/listing/abc-123' }).promise;
      expect(response.status).toBe(200);
      expect(response.headers.get('x-agentbio-prerender')).toBe('listing');
    });

    it('keeps the legacy ?listing= link at 200 for a missing listing', async () => {
      fetchMock.mockImplementation(NO_LISTING);
      const response = await call({ path: '/jane?listing=gone' }).promise;
      expect(response.status).toBe(200);
    });

    it('still leaves a person the SPA, which shows its own "no longer listed" page', async () => {
      fetchMock.mockImplementation(NO_LISTING);
      const { promise, next } = callListing({
        path: '/jane/listing/gone',
        listingId: 'gone',
        userAgent: HUMAN,
      });
      const response = await promise;
      expect(response.status).toBe(200);
      expect(next).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
