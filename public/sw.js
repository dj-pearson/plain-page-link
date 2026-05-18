/* AgentBio Service Worker (US-027)
 *
 * Implemented with the native Cache Storage API rather than the bundled
 * Workbox runtime: the index.html CSP `script-src` does not allow the
 * Workbox CDN and this Vite setup has no service-worker build step
 * (files in public/ are served verbatim, not processed). The strategies
 * below mirror Workbox's CacheFirst / StaleWhileRevalidate / NetworkFirst.
 * The workbox-* packages are installed for a future build-time
 * injectManifest approach.
 *
 * SAFETY (critical): this SW NEVER caches authentication or Supabase
 * traffic. A prior production incident was caused by a service worker
 * caching auth requests (see repo root AUTH_BROKEN_*.md). Anything that
 * looks like auth/Supabase/an authorized request is passed straight to
 * the network with no caching. sw-cleanup.ts allowlists this SW and its
 * caches while still purging unknown/legacy service workers.
 */

const CACHE_PREFIX = 'agentbio-sw-';
const VERSION = 'v1';
const PRECACHE = `${CACHE_PREFIX}precache-${VERSION}`;
const RUNTIME = `${CACHE_PREFIX}runtime-${VERSION}`;
const IMAGES = `${CACHE_PREFIX}images-${VERSION}`;

const APP_SHELL = ['/', '/index.html', '/offline.html', '/manifest.json'];

// Never cache (NetworkOnly): auth + Supabase + any authorized request.
function isNeverCache(request, url) {
  if (request.method !== 'GET') return true;
  if (request.headers.has('Authorization')) return true;
  const host = url.hostname;
  if (
    host.includes('supabase') ||
    host.startsWith('api.') ||
    host.startsWith('functions.') ||
    host.includes('googletagmanager') ||
    host.includes('google-analytics') ||
    host.includes('stripe')
  ) {
    return true;
  }
  const p = url.pathname;
  return (
    p.startsWith('/auth') ||
    p.startsWith('/functions') ||
    p.includes('/auth/v1') ||
    p.includes('/rest/v1')
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(?:js|css|woff2?|ttf|otf)$/.test(url.pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith(CACHE_PREFIX) &&
                ![PRECACHE, RUNTIME, IMAGES].includes(k)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached =
      (await caches.match(request)) ||
      (await caches.match('/index.html')) ||
      (await caches.match('/offline.html'));
    return (
      cached ||
      new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      })
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hard pass-through for auth/Supabase/authorized + cross-origin we don't own.
  if (isNeverCache(request, url) || url.origin !== self.location.origin) {
    return; // default browser fetch, no caching
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, RUNTIME));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGES));
  }
});
