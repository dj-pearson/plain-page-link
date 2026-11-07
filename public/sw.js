/* AgentBio Service Worker (US-027, US-272, US-312, US-321, US-400)
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

// HTML of routes this visitor has opened, keyed by path (US-312). Before this
// every offline navigation got the one precached '/index.html', the
// prerendered homepage of the build current when the worker installed. That
// copy names the entry chunk of its own build, which the visitor has often
// never loaded: after a deploy the installed app opened offline to a blank
// screen. A route's own HTML names the chunks that were loaded alongside it,
// which are the ones sitting in RUNTIME. Not per-deploy, for the same reason.
// main.tsx mounts with createRoot (no hydrateRoot), so React renders the URL
// it is on whatever markup the HTML carried.
const PAGES = `${CACHE_PREFIX}pages-v1`;

/** Entry caps. The entry and route chunks of one build an agent touches is ~60. */
const MAX_ENTRIES = { [RUNTIME]: 150, [IMAGES]: 80, [PAGES]: 30 };

const APP_SHELL = ['/', '/index.html', '/offline.html', '/manifest.json'];

/** Upper bound on entry files taken from the shell HTML; Vite emits ~10. */
const MAX_SHELL_ASSETS = 40;

/**
 * The /assets files the shell HTML loads before React can render: its module
 * entry script, its stylesheets and its modulepreload hints (US-321).
 *
 * The worker precached '/index.html' but not these. After a deploy, opening a
 * route the visitor had never visited offline fell back to an index.html whose
 * entry chunk had never been downloaded, and the installed app showed a blank
 * screen. A service worker has no DOMParser, so the tags are read with a
 * pattern. Only same-origin /assets/ URLs are taken: they are content-hashed,
 * so caching them can never serve stale code, and a parser mistake cannot
 * pull a third-party or unhashed URL into the precache.
 */
function shellAssetsFromHtml(html, origin) {
  const found = [];
  const tags = String(html).match(/<(?:script|link)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attr = (name) => {
      const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
      return m ? (m[1] ?? m[2] ?? m[3]) : null;
    };
    let ref = null;
    if (/^<script/i.test(tag)) {
      if ((attr('type') || '').toLowerCase() === 'module') ref = attr('src');
    } else {
      const rel = (attr('rel') || '').toLowerCase().split(/\s+/);
      if (rel.includes('stylesheet') || rel.includes('modulepreload')) ref = attr('href');
    }
    if (!ref) continue;
    let url;
    try {
      url = new URL(ref, origin);
    } catch {
      continue;
    }
    if (url.origin !== origin || !url.pathname.startsWith('/assets/')) continue;
    const key = url.origin + url.pathname;
    if (!found.includes(key)) found.push(key);
    if (found.length >= MAX_SHELL_ASSETS) break;
  }
  return found;
}

/**
 * Precache the entry files named by the precached shell pages. Each file is
 * fetched on its own and a failure is skipped: one missing chunk must not
 * cost the visitor the rest of the shell, nor stop the worker installing.
 */
async function precacheShellAssets(cache) {
  const origin = self.location.origin;
  const urls = [];
  for (const page of ['/index.html', '/']) {
    const response = await cache.match(page);
    if (!response) continue;
    for (const u of shellAssetsFromHtml(await response.text(), origin)) {
      if (!urls.includes(u)) urls.push(u);
    }
  }
  await Promise.all(
    urls.slice(0, MAX_SHELL_ASSETS).map(async (u) => {
      try {
        const response = await fetch(u);
        if (response && response.ok) await cache.put(u, response);
      } catch {
        // Offline or gone: left to CacheFirst at the next online load.
      }
    })
  );
}

/**
 * Precache the app shell one file at a time (US-400).
 *
 * This used to be cache.addAll(APP_SHELL), which stores all four files or
 * none: one failed fetch on a flaky phone connection left the new precache
 * empty, the error was swallowed so the worker installed anyway, and activate
 * then deleted the previous, working precache. Offline, a route the visitor
 * had never opened got the plain-text 503 instead of the app or offline.html
 * until the next deploy. Each file is now kept or skipped on its own; what is
 * missing is filled from the previous precache on activate (carryShellForward).
 */
async function precacheAppShell(cache) {
  await Promise.all(
    APP_SHELL.map(async (path) => {
      try {
        const response = await fetch(path);
        if (response && response.ok) await cache.put(path, response);
      } catch {
        // Offline or failed: carryShellForward keeps the previous copy.
      }
    })
  );
}

/**
 * Before an old precache is deleted, copy into the new precache any app-shell
 * file the new install could not fetch. An older index.html is still a working
 * offline fallback: adoptPrecachedAssets moves the entry chunks it names into
 * RUNTIME in the same step. A file the new install did fetch is never replaced.
 */
async function carryShellForward(oldCacheName) {
  const old = await caches.open(oldCacheName);
  const current = await caches.open(PRECACHE);
  for (const path of APP_SHELL) {
    if (await current.match(path)) continue;
    const response = await old.match(path);
    if (response) await current.put(path, response);
  }
}

/**
 * Before an old precache is deleted, move its /assets entries into RUNTIME.
 * A page saved in PAGES under the previous build names that build's entry
 * chunks, and once they were precached the browser served them from there
 * rather than storing a RUNTIME copy. Deleting the old precache outright
 * would leave that saved page pointing at nothing.
 */
async function adoptPrecachedAssets(oldCacheName) {
  const old = await caches.open(oldCacheName);
  const runtime = await caches.open(RUNTIME);
  for (const request of await old.keys()) {
    if (!new URL(request.url).pathname.startsWith('/assets/')) continue;
    if (await runtime.match(request)) continue;
    const response = await old.match(request);
    if (response) await runtime.put(request, response);
  }
}

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
 *
 * The network fetch is made with cache: 'no-cache'. Until /scripts/* got its
 * own header, analytics.js was served under the /*.js rule with
 * `max-age=31536000, immutable`, so every visitor who loaded it before then
 * holds that copy in the browser HTTP cache. A plain fetch() from the worker
 * is answered from that entry for up to a year; 'no-cache' makes the browser
 * revalidate with the server first, so the deployed copy reaches them too.
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
      .then((cache) =>
        precacheAppShell(cache)
          .then(() => precacheShellAssets(cache))
          .catch(() => undefined)
      )
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then(async (keys) => {
        const stale = keys.filter(
          (k) => k.startsWith(CACHE_PREFIX) && ![PRECACHE, RUNTIME, IMAGES, PAGES].includes(k)
        );
        // One at a time and newest first (caches.keys() is in creation
        // order), so when several old precaches exist the most recent one
        // that holds a missing shell file is the one that supplies it.
        for (const k of stale.reverse()) {
          if (k.startsWith(`${CACHE_PREFIX}precache-`)) {
            await carryShellForward(k).catch(() => undefined);
            await adoptPrecachedAssets(k).catch(() => undefined);
          }
          await caches.delete(k);
        }
      })
      // A visitor who installed the worker before US-272 carries an unbounded
      // runtime cache; bring it under the cap now rather than at the next put.
      .then(() => Promise.all([trimCache(RUNTIME), trimCache(IMAGES), trimCache(PAGES)]))
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
    // Revalidate past any year-long immutable HTTP-cache entry (see isUnhashedCode).
    const response = await fetch(request, { cache: 'no-cache' });
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

/**
 * The cache key for a page: origin + path. The query string is dropped so
 * ?utm_source=..., ?ref=... and Stripe's ?session_id=... do not each take a
 * slot, and an offline open of the bare path still finds the copy. The SPA
 * reads the query from location, not from the HTML.
 */
function pageKey(url) {
  return `${url.origin}${url.pathname}`;
}

/**
 * Whether a navigation response may be kept for offline use. Only a plain,
 * same-origin 200 that was not reached through a redirect: a redirected
 * response stored under the original path would replay the redirect target's
 * HTML at the wrong URL, and a 404/500 page is not worth showing offline.
 * Anything the server marked no-store stays out too. /auth never gets here
 * (isNeverCache passes it straight through).
 */
function isCacheablePage(response) {
  if (!response || response.status !== 200 || response.redirected) return false;
  if (response.type && response.type !== 'basic' && response.type !== 'default') return false;
  const cacheControl = response.headers.get('Cache-Control') || '';
  if (/no-store/i.test(cacheControl)) return false;
  const type = response.headers.get('Content-Type') || '';
  return /text\/html/i.test(type);
}

async function networkFirstNavigation(event, request, url) {
  try {
    const response = await fetch(request);
    if (isCacheablePage(response)) {
      event.waitUntil(store(PAGES, pageKey(url), response.clone()));
    }
    return response;
  } catch {
    const pages = await caches.open(PAGES);
    const cached =
      (await pages.match(pageKey(url))) ||
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
    event.respondWith(networkFirstNavigation(event, request, url));
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
