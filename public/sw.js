/* AgentBio Service Worker (US-027, US-272)
 *
 * Implemented with the native Cache Storage API rather than the bundled
 * Workbox runtime: the index.html CSP `script-src` does not allow the
 * Workbox CDN and this Vite setup has no service-worker bundling step
 * (files in public/ are served verbatim; the only build-time change is the
 * VERSION stamp below). The strategies mirror Workbox's CacheFirst /
 * StaleWhileRevalidate / NetworkFirst.
 *
 * SAFETY (critical): this SW NEVER caches authentication or Supabase
 * traffic. A prior production incident was caused by a service worker
 * caching auth requests (the write-up is no longer in the repo). Anything that
 * looks like auth/Supabase/an authorized request is passed straight to
 * the network with no caching. sw-cleanup.ts allowlists this SW and its
 * caches while still purging unknown/legacy service workers.
 *
 * src/sw.test.ts runs this file against a fake Cache Storage.
 */

const CACHE_PREFIX = 'agentbio-sw-';

// Replaced with a per-build id by the `sw-build-version` plugin in
// vite.config.ts (US-272). public/ is copied verbatim, so before that this
// file was byte-identical on every deploy: the browser never saw a new
// service worker, the precached '/' and '/index.html' stayed the copies from
// the day a visitor first installed it, and the offline fallback served a
// homepage naming chunks several deploys gone. A new VERSION on each deploy
// makes the browser install a new worker, which re-precaches the shell and
// drops the previous precache on activate. 'dev' is what an unbuilt copy
// carries.
const VERSION = 'dev';
const PRECACHE = `${CACHE_PREFIX}precache-${VERSION}`;

// The runtime caches are deliberately NOT per-deploy. A tab opened before a
// deploy still lazy-loads the old build's chunks, and Cloudflare Pages stops
// serving those the moment the new deploy is live, so the cached copy can be
// the only one left. They are kept across versions and bounded by entry count
// instead (trimCache) — which is what they were missing: every hashed chunk of
// every deploy a visitor had loaded stayed on their phone for good. The names
// are unchanged from US-027 so existing caches are adopted and trimmed rather
// than orphaned.
const RUNTIME = `${CACHE_PREFIX}runtime-v1`;
const IMAGES = `${CACHE_PREFIX}images-v1`;

/** Entry caps. The entry and route chunks of one build an agent touches is ~60. */
const MAX_ENTRIES = { [RUNTIME]: 150, [IMAGES]: 80 };

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

/**
 * Vite's output under /assets/ carries a content hash in its name, so a
 * cached copy can never be stale. Only these are CacheFirst.
 */
function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/');
}

/**
 * Same-origin scripts and stylesheets whose URL does NOT change when their
 * content does — /scripts/analytics.js is the one that ships today.
 *
 * These used to be CacheFirst alongside the hashed chunks, so a returning
 * visitor ran the first copy of analytics.js their browser ever saw, for as
 * long as the worker lived. That file is the cookie-consent gate in front of
 * Google Analytics: a fix to it never reached anyone who already had the
 * worker. NetworkFirst serves the deployed copy whenever there is a network
 * and keeps the cached one for offline.
 */
function isUnhashedCode(url) {
  return /\.(?:js|mjs|css)$/.test(url.pathname);
}

function isFont(url) {
  return /\.(?:woff2?|ttf|otf)$/.test(url.pathname);
}

/**
 * Drop the oldest entries past the cap. Cache.keys() returns entries in
 * insertion order, so this is first-in-first-out: the chunks of the build
 * running now were put most recently and are the last to go.
 */
async function trimCache(cacheName) {
  const max = MAX_ENTRIES[cacheName];
  if (!max) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - max;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

async function store(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  await trimCache(cacheName);
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
      // A visitor who installed the worker before US-272 carries an unbounded
      // runtime cache; bring it under the cap now rather than at the next put.
      .then(() => Promise.all([trimCache(RUNTIME), trimCache(IMAGES)]))
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Each strategy hands its cache write to event.waitUntil. A write nothing
// waits on can be cut off when the browser stops an idle worker, and the trim
// after it would never run.
async function cacheFirst(event, request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    event.waitUntil(store(cacheName, request, response.clone()));
  }
  return response;
}

async function networkFirst(event, request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      event.waitUntil(store(cacheName, request, response.clone()));
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(event, request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        return store(cacheName, request, response.clone()).then(() => response);
      }
      return response;
    })
    .catch(() => cached);
  event.waitUntil(network.then(() => undefined));
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

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(event, request, RUNTIME));
    return;
  }

  if (isFont(url)) {
    event.respondWith(staleWhileRevalidate(event, request, RUNTIME));
    return;
  }

  if (isUnhashedCode(url)) {
    event.respondWith(networkFirst(event, request, RUNTIME));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(event, request, IMAGES));
  }
});
