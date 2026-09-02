/**
 * Serve the /:username Pages Function locally so its unfurl can be inspected
 * with a real HTTP client (US-114).
 *
 * The acceptance criterion is "verified with curl -A facebookexternalhit", and
 * wrangler needs a Cloudflare login this repository's CI and sandboxes do not
 * have. A Pages Function is an ordinary async (context) => Response, so this
 * wires one up over node:http with a stub PostgREST and the real index.html.
 *
 *   node --experimental-strip-types scripts/preview-social-meta.mjs &
 *   curl -sA facebookexternalhit http://127.0.0.1:8791/jane | grep 'og:'
 *
 * It proves the function's own behaviour, not Cloudflare's routing.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const PORT = Number(process.env.PORT || 8791);

const INDEX_HTML = readFileSync(path.join(root, 'index.html'), 'utf8');

const PROFILE = {
  username: 'jane',
  full_name: 'Jane Doe',
  bio: 'Fifteen years selling homes on the east bench. Ask me about Holladay.',
  avatar_url: 'https://cdn.example.com/jane.jpg',
  og_image: null,
  seo_title: null,
  seo_description: null,
  title: 'Associate Broker',
  brokerage_name: 'Summit Realty',
  service_cities: ['Salt Lake City', 'Holladay'],
};

const LISTING = {
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

// Stand in for PostgREST. The function only ever GETs two collections.
globalThis.fetch = async (input) => {
  const url = String(input);
  if (url.includes('/rest/v1/profiles')) {
    return Response.json(url.includes('username=eq.jane') ? [PROFILE] : []);
  }
  if (url.includes('/rest/v1/listings')) {
    return Response.json(url.includes(`id=eq.${LISTING.id}`) ? [LISTING] : []);
  }
  return new Response('[]', { status: 404 });
};

const { onRequestGet } = await import(path.join(root, 'functions', '[username].ts'));

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const segment = url.pathname.split('/').filter(Boolean)[0] ?? '';

  const response = await onRequestGet({
    request: new Request(url, { headers: { 'user-agent': req.headers['user-agent'] ?? '' } }),
    env: {
      VITE_SUPABASE_URL: 'https://api.example.test',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
    },
    params: { username: segment },
    // The asset server: _redirects sends every unmatched path to index.html.
    next: async () =>
      new Response(INDEX_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
  });

  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`social-meta preview on http://127.0.0.1:${PORT}`);
});
