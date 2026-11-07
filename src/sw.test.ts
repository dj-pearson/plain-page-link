/**
 * public/sw.js, run for real against a fake Cache Storage (US-272).
 *
 * The worker is a classic script with no build step, so it is evaluated here
 * in a vm context whose `self`, `caches` and `fetch` are fakes. What is held:
 * the runtime caches are bounded, unhashed scripts are fetched from the
 * network when there is one, hashed assets stay CacheFirst, the build stamps a
 * version, and auth traffic is still never cached.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  SW_VERSION_PLACEHOLDER,
  buildIdFromFileNames,
  stampServiceWorkerVersion,
} from '@/config/sw-version';

const SOURCE = readFileSync(join(__dirname, '..', 'public', 'sw.js'), 'utf8');
const ORIGIN = 'https://agentbio.net';

type Listener = (event: unknown) => void;

class FakeCache {
  entries = new Map<string, Response>();
  async match(request: Request | string) {
    const hit = this.entries.get(keyOf(request));
    return hit ? hit.clone() : undefined;
  }
  async put(request: Request | string, response: Response) {
    const key = keyOf(request);
    // Real Cache.put replaces in place but a re-put moves nothing; delete
    // first so insertion order matches a fresh put, as the browser's does.
    this.entries.delete(key);
    this.entries.set(key, response);
  }
  async keys() {
    return [...this.entries.keys()].map((k) => new Request(k));
  }
  async delete(request: Request | string) {
    return this.entries.delete(keyOf(request));
  }
}

function keyOf(request: Request | string) {
  return typeof request === 'string' ? new URL(request, ORIGIN).href : request.url;
}

function loadWorker(
  source = SOURCE,
  network: (req: Request) => Promise<Response> = defaultNetwork,
  shell: Record<string, string> = {}
) {
  const listeners: Record<string, Listener[]> = {};
  const stores = new Map<string, FakeCache>();
  const caches = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name)!;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name: string) {
      return stores.delete(name);
    },
    async match(request: Request | string) {
      for (const cache of stores.values()) {
        const hit = await cache.match(request);
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const fetched: string[] = [];
  const fetchInits = new Map<string, RequestInit | undefined>();
  const self = {
    location: new URL(ORIGIN),
    addEventListener: (type: string, fn: Listener) => {
      (listeners[type] ??= []).push(fn);
    },
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined },
  };
  const context = vm.createContext({
    self,
    caches,
    fetch: (input: Request | string, init?: RequestInit) => {
      // A worker resolves a relative URL against its own location.
      const req = typeof input === 'string' ? new Request(new URL(input, ORIGIN).href) : input;
      fetched.push(req.url);
      fetchInits.set(req.url, init);
      // `shell` overrides the body of a successful response for those paths,
      // so a test can hand the worker real index.html markup while the
      // network fake still decides whether the fetch succeeds at all.
      const body = shell[new URL(req.url).pathname];
      if (body === undefined) return network(req);
      return network(req).then((r) => (r.ok ? new Response(body, { status: 200 }) : r));
    },
    Response,
    Request,
    URL,
    Promise,
    console,
  });
  vm.runInContext(source, context);

  /** Dispatch a lifecycle event and wait for everything it hands to waitUntil. */
  async function lifecycle(type: 'install' | 'activate') {
    const pending: Promise<unknown>[] = [];
    for (const fn of listeners[type] ?? [])
      fn({ waitUntil: (p: Promise<unknown>) => pending.push(p) });
    await Promise.all(pending);
  }

  /** Dispatch a fetch; resolves to the response (or undefined for pass-through). */
  async function request(
    path: string,
    init: RequestInit & { destination?: string; mode?: string } = {}
  ) {
    const { destination, mode, ...requestInit } = init;
    const req = new Request(new URL(path, ORIGIN).href, requestInit);
    // Request's destination/mode are fixed in Node; the worker only reads
    // these fields, so a plain object carrying them is enough.
    const view = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      destination: destination ?? '',
      mode: mode ?? 'cors',
    } as unknown as Request;
    let responded: Promise<Response> | undefined;
    const pending: Promise<unknown>[] = [];
    for (const fn of listeners.fetch ?? []) {
      fn({
        request: view,
        respondWith: (p: Promise<Response>) => {
          responded = p;
        },
        waitUntil: (p: Promise<unknown>) => pending.push(p),
      });
    }
    const response = responded ? await responded : undefined;
    // waitUntil may be called after respondWith resolves; let it register.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(pending);
    return response;
  }

  return { stores, fetched, fetchInits, lifecycle, request };
}

async function defaultNetwork(req: Request) {
  return new Response(`network ${new URL(req.url).pathname}`, { status: 200 });
}

describe('service worker caching (public/sw.js)', () => {
  it('bounds the runtime cache, dropping the oldest chunks first', async () => {
    const sw = loadWorker();
    for (let i = 0; i < 160; i++) await sw.request(`/assets/chunk-${i}.js`);
    const runtime = sw.stores.get('agentbio-sw-runtime-v1')!;
    expect(runtime.entries.size).toBe(150);
    expect(runtime.entries.has(`${ORIGIN}/assets/chunk-0.js`)).toBe(false);
    expect(runtime.entries.has(`${ORIGIN}/assets/chunk-159.js`)).toBe(true);
  });

  it('bounds the image cache', async () => {
    const sw = loadWorker();
    for (let i = 0; i < 90; i++) await sw.request(`/photos/${i}.jpg`, { destination: 'image' });
    expect(sw.stores.get('agentbio-sw-images-v1')!.entries.size).toBe(80);
  });

  it('trims a runtime cache left unbounded by an older worker when it activates', async () => {
    const sw = loadWorker();
    const runtime = new FakeCache();
    for (let i = 0; i < 400; i++)
      runtime.entries.set(`${ORIGIN}/assets/old-${i}.js`, new Response('x'));
    sw.stores.set('agentbio-sw-runtime-v1', runtime);
    await sw.lifecycle('activate');
    expect(runtime.entries.size).toBe(150);
    expect(runtime.entries.has(`${ORIGIN}/assets/old-399.js`)).toBe(true);
  });

  it('serves a hashed chunk from cache without asking the network again', async () => {
    const sw = loadWorker();
    await sw.request('/assets/index-abc123.js');
    await sw.request('/assets/index-abc123.js');
    expect(sw.fetched.filter((u) => u.endsWith('/assets/index-abc123.js'))).toHaveLength(1);
  });

  it('fetches /scripts/analytics.js from the network on every load, not the first copy cached', async () => {
    let deployed = 'consent gate v1';
    const sw = loadWorker(SOURCE, async () => new Response(deployed));
    expect(await (await sw.request('/scripts/analytics.js'))!.text()).toBe('consent gate v1');
    deployed = 'consent gate v2';
    expect(await (await sw.request('/scripts/analytics.js'))!.text()).toBe('consent gate v2');
  });

  it('revalidates analytics.js past a year-long immutable HTTP-cache entry', async () => {
    // Visitors who loaded analytics.js under the old /*.js header hold it with
    // max-age=31536000, immutable; a default-mode fetch would be answered from
    // that entry. cache: 'no-cache' forces a conditional request to the server.
    const sw = loadWorker();
    await sw.request('/scripts/analytics.js');
    expect(sw.fetchInits.get(`${ORIGIN}/scripts/analytics.js`)?.cache).toBe('no-cache');
  });

  it('still serves the cached analytics.js when offline', async () => {
    let online = true;
    const sw = loadWorker(SOURCE, async (req) => {
      if (!online) throw new TypeError('Failed to fetch');
      return new Response(`network ${new URL(req.url).pathname}`);
    });
    await sw.request('/scripts/analytics.js');
    online = false;
    expect(await (await sw.request('/scripts/analytics.js'))!.text()).toBe(
      'network /scripts/analytics.js'
    );
  });

  it('never caches Supabase, authorized or non-GET traffic', async () => {
    const sw = loadWorker();
    expect(await sw.request('/auth/v1/token')).toBeUndefined();
    expect(
      await sw.request('/assets/x.js', { headers: { Authorization: 'Bearer t' } })
    ).toBeUndefined();
    expect(await sw.request('/assets/y.js', { method: 'POST', body: '{}' })).toBeUndefined();
    expect(await sw.request('https://abc.supabase.co/rest/v1/leads')).toBeUndefined();
    expect(sw.stores.size).toBe(0);
  });

  it('replaces the previous precache on a new version but keeps the runtime caches', async () => {
    const first = loadWorker(stampServiceWorkerVersion(SOURCE, 'build1'));
    await first.lifecycle('install');
    await first.request('/assets/old-build.js');
    expect([...first.stores.keys()]).toContain('agentbio-sw-precache-build1');

    // The browser shares Cache Storage across worker versions.
    const second = loadWorker(stampServiceWorkerVersion(SOURCE, 'build2'));
    for (const [name, cache] of first.stores) second.stores.set(name, cache);
    await second.lifecycle('install');
    await second.lifecycle('activate');

    const names = [...second.stores.keys()];
    expect(names).toContain('agentbio-sw-precache-build2');
    expect(names).not.toContain('agentbio-sw-precache-build1');
    expect(
      second.stores.get('agentbio-sw-runtime-v1')!.entries.has(`${ORIGIN}/assets/old-build.js`)
    ).toBe(true);
  });
});

describe('offline pages for visited routes (US-312)', () => {
  const html = (body: string, init: ResponseInit = {}) =>
    new Response(body, {
      status: 200,
      ...init,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...(init.headers ?? {}) },
    });

  /** A worker whose network can be switched off and whose pages say which path served them. */
  function pagesWorker(
    respond: (req: Request) => Response = (req) => html(`page ${new URL(req.url).pathname}`)
  ) {
    const state = { online: true };
    const sw = loadWorker(SOURCE, async (req) => {
      if (!state.online) throw new TypeError('Failed to fetch');
      return respond(req);
    });
    return { sw, state };
  }

  const navigate = (sw: ReturnType<typeof loadWorker>, path: string) =>
    sw.request(path, { mode: 'navigate' });

  it('serves a visited route its own HTML when offline, not the homepage', async () => {
    const { sw, state } = pagesWorker();
    await sw.lifecycle('install');
    await navigate(sw, '/dashboard/leads');
    state.online = false;
    expect(await (await navigate(sw, '/dashboard/leads'))!.text()).toBe('page /dashboard/leads');
  });

  it('keys pages by path, so a visit with a campaign query string is found without it', async () => {
    const { sw, state } = pagesWorker();
    await navigate(sw, '/jane-agent?utm_source=instagram&ref=abc');
    expect([...sw.stores.get('agentbio-sw-pages-v1')!.entries.keys()]).toEqual([
      `${ORIGIN}/jane-agent`,
    ]);
    state.online = false;
    expect(await (await navigate(sw, '/jane-agent'))!.text()).toBe('page /jane-agent');
  });

  it('falls back to /index.html, then /offline.html, for a route never visited', async () => {
    const { sw, state } = pagesWorker();
    await sw.lifecycle('install');
    state.online = false;
    expect(await (await navigate(sw, '/dashboard/clients'))!.text()).toBe('page /index.html');

    sw.stores.get('agentbio-sw-precache-dev')!.entries.delete(`${ORIGIN}/index.html`);
    expect(await (await navigate(sw, '/dashboard/clients'))!.text()).toBe('page /offline.html');
  });

  it('answers 503 when nothing at all is cached', async () => {
    const { sw, state } = pagesWorker();
    state.online = false;
    expect((await navigate(sw, '/pricing'))!.status).toBe(503);
  });

  it('never keeps a redirected, non-200, non-HTML or no-store response', async () => {
    const { sw } = pagesWorker((req) => {
      const path = new URL(req.url).pathname;
      if (path === '/moved') {
        const r = html('landing');
        Object.defineProperty(r, 'redirected', { value: true });
        return r;
      }
      if (path === '/missing') return html('not found', { status: 404 });
      if (path === '/broken') return html('error', { status: 500 });
      if (path === '/data')
        return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
      if (path === '/private')
        return html('x', { headers: { 'Cache-Control': 'private, no-store' } });
      return html('ok');
    });
    for (const path of ['/moved', '/missing', '/broken', '/data', '/private']) {
      await navigate(sw, path);
    }
    expect(sw.stores.get('agentbio-sw-pages-v1')?.entries.size ?? 0).toBe(0);
  });

  it('never caches a navigation under /auth', async () => {
    const { sw } = pagesWorker();
    expect(await navigate(sw, '/auth/login')).toBeUndefined();
    expect(await navigate(sw, '/auth/callback?code=secret')).toBeUndefined();
    expect(sw.stores.has('agentbio-sw-pages-v1')).toBe(false);
  });

  it('caps the pages cache at 30, dropping the oldest first', async () => {
    const { sw } = pagesWorker();
    for (let i = 0; i < 35; i++) await navigate(sw, `/agent-${i}`);
    const pages = sw.stores.get('agentbio-sw-pages-v1')!;
    expect(pages.entries.size).toBe(30);
    expect(pages.entries.has(`${ORIGIN}/agent-0`)).toBe(false);
    expect(pages.entries.has(`${ORIGIN}/agent-34`)).toBe(true);
  });

  it('keeps the pages cache across a new worker version and trims it on activate', async () => {
    const sw = loadWorker(stampServiceWorkerVersion(SOURCE, 'build2'));
    const pages = new FakeCache();
    for (let i = 0; i < 40; i++) pages.entries.set(`${ORIGIN}/p-${i}`, new Response('x'));
    sw.stores.set('agentbio-sw-pages-v1', pages);
    await sw.lifecycle('activate');
    expect(sw.stores.get('agentbio-sw-pages-v1')).toBe(pages);
    expect(pages.entries.size).toBe(30);
    expect(pages.entries.has(`${ORIGIN}/p-39`)).toBe(true);
  });

  it('refreshes a page from the network whenever there is one', async () => {
    let version = 'v1';
    const { sw, state } = pagesWorker(() => html(version));
    await navigate(sw, '/dashboard');
    version = 'v2';
    expect(await (await navigate(sw, '/dashboard'))!.text()).toBe('v2');
    state.online = false;
    expect(await (await navigate(sw, '/dashboard'))!.text()).toBe('v2');
  });
});

describe('precaching the shell entry files (US-321)', () => {
  // What vite build writes into dist/index.html, trimmed.
  const SHELL_HTML = `<!doctype html><html><head>
    <script src="/scripts/analytics.js" defer></script>
    <script type="module" crossorigin src="/assets/index-a1b2.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/react-vendor-c3d4.js">
    <link rel="modulepreload" crossorigin href="/assets/supabase-e5f6.js">
    <link rel="stylesheet" crossorigin href="/assets/index-0f9e.css">
    <link rel="icon" href="/icons/icon-192.png">
    <link rel="stylesheet" href="https://fonts.googleapis.com/assets/x.css">
  </head><body><div id="root"></div></body></html>`;
  const ENTRY = [
    '/assets/index-a1b2.js',
    '/assets/react-vendor-c3d4.js',
    '/assets/supabase-e5f6.js',
    '/assets/index-0f9e.css',
  ];

  function shellWorker(
    source = SOURCE,
    respond: (req: Request) => Response | Promise<Response> = (req) =>
      new Response(`network ${new URL(req.url).pathname}`)
  ) {
    const state = { online: true };
    const sw = loadWorker(
      source,
      async (req) => {
        if (!state.online) throw new TypeError('Failed to fetch');
        return respond(req);
      },
      { '/': SHELL_HTML, '/index.html': SHELL_HTML }
    );
    return { sw, state };
  }

  it('precaches the module entry, its modulepreloads and stylesheets, and nothing else', async () => {
    const { sw } = shellWorker();
    await sw.lifecycle('install');
    const precache = sw.stores.get('agentbio-sw-precache-dev')!;
    for (const path of ENTRY) expect(precache.entries.has(`${ORIGIN}${path}`)).toBe(true);
    const keys = [...precache.entries.keys()];
    expect(keys.some((k) => k.includes('/scripts/analytics.js'))).toBe(false);
    expect(keys.some((k) => k.includes('/icons/'))).toBe(false);
    expect(keys.some((k) => k.includes('fonts.googleapis.com'))).toBe(false);
    // '/' and '/index.html' name the same files; each is fetched once.
    expect(sw.fetched.filter((u) => u.endsWith('/assets/index-a1b2.js'))).toHaveLength(1);
  });

  it('opens a route never visited offline with the entry files the shell names', async () => {
    const { sw, state } = shellWorker();
    await sw.lifecycle('install');
    state.online = false;
    const page = await sw.request('/dashboard/settings', { mode: 'navigate' });
    expect(await page!.text()).toBe(SHELL_HTML);
    for (const path of ENTRY) {
      const asset = await sw.request(path);
      expect(await asset!.text()).toBe(`network ${path}`);
    }
  });

  it('still installs, with the rest of the shell, when one entry file fails to download', async () => {
    const { sw } = shellWorker(SOURCE, (req) => {
      const path = new URL(req.url).pathname;
      if (path === '/assets/supabase-e5f6.js') throw new TypeError('Failed to fetch');
      if (path === '/assets/react-vendor-c3d4.js') return new Response('gone', { status: 404 });
      return new Response(`network ${path}`);
    });
    await sw.lifecycle('install');
    const precache = sw.stores.get('agentbio-sw-precache-dev')!;
    expect(precache.entries.has(`${ORIGIN}/index.html`)).toBe(true);
    expect(precache.entries.has(`${ORIGIN}/assets/index-a1b2.js`)).toBe(true);
    expect(precache.entries.has(`${ORIGIN}/assets/index-0f9e.css`)).toBe(true);
    expect(precache.entries.has(`${ORIGIN}/assets/supabase-e5f6.js`)).toBe(false);
    expect(precache.entries.has(`${ORIGIN}/assets/react-vendor-c3d4.js`)).toBe(false);
  });

  it('keeps the previous build entry files when a new version drops its precache', async () => {
    // A page saved in PAGES under build1 names build1's entry chunks, which
    // were served from build1's precache and never copied into RUNTIME.
    const first = shellWorker(stampServiceWorkerVersion(SOURCE, 'build1'));
    await first.sw.lifecycle('install');

    const second = loadWorker(stampServiceWorkerVersion(SOURCE, 'build2'));
    for (const [name, cache] of first.sw.stores) second.stores.set(name, cache);
    await second.lifecycle('activate');

    expect(second.stores.has('agentbio-sw-precache-build1')).toBe(false);
    const runtime = second.stores.get('agentbio-sw-runtime-v1')!;
    for (const path of ENTRY) expect(runtime.entries.has(`${ORIGIN}${path}`)).toBe(true);
    // Only hashed assets move; the old shell HTML does not.
    expect(runtime.entries.has(`${ORIGIN}/index.html`)).toBe(false);
  });
});

describe('installing the app shell file by file (US-400)', () => {
  const SHELL = ['/', '/index.html', '/offline.html', '/manifest.json'];

  /** A worker whose network fails the paths in `failing` and serves the rest as `<build> <path>`. */
  function installWorker(build: string, failing: string[] = [], online = true) {
    return loadWorker(stampServiceWorkerVersion(SOURCE, build), async (req) => {
      const path = new URL(req.url).pathname;
      if (!online || failing.includes(path)) throw new TypeError('Failed to fetch');
      return new Response(`${build} ${path}`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    });
  }

  const precacheText = async (sw: ReturnType<typeof loadWorker>, build: string, path: string) =>
    (await sw.stores.get(`agentbio-sw-precache-${build}`)!.match(path))?.text();

  it('keeps the rest of the shell when one file fails to download', async () => {
    const sw = installWorker('build1', ['/manifest.json']);
    await sw.lifecycle('install');
    expect(await precacheText(sw, 'build1', '/index.html')).toBe('build1 /index.html');
    expect(await precacheText(sw, 'build1', '/offline.html')).toBe('build1 /offline.html');
    expect(await precacheText(sw, 'build1', '/')).toBe('build1 /');
    expect(await precacheText(sw, 'build1', '/manifest.json')).toBeUndefined();
  });

  it('does not store a shell file the server answered with an error', async () => {
    const sw = loadWorker(SOURCE, async (req) =>
      new URL(req.url).pathname === '/offline.html'
        ? new Response('down', { status: 502 })
        : new Response('ok')
    );
    await sw.lifecycle('install');
    expect(await sw.stores.get('agentbio-sw-precache-dev')!.match('/offline.html')).toBeUndefined();
    expect(await sw.stores.get('agentbio-sw-precache-dev')!.match('/index.html')).toBeDefined();
  });

  /** Install build1 fully, then install build2 against the same Cache Storage and activate it. */
  async function upgrade(failing: string[], online = true) {
    const first = installWorker('build1');
    await first.lifecycle('install');
    const second = installWorker('build2', failing, online);
    for (const [name, cache] of first.stores) second.stores.set(name, cache);
    await second.lifecycle('install');
    await second.lifecycle('activate');
    return second;
  }

  it('keeps the previous index.html and offline.html when the new install could not fetch them', async () => {
    const sw = await upgrade(['/index.html', '/offline.html']);
    expect(sw.stores.has('agentbio-sw-precache-build1')).toBe(false);
    expect(await precacheText(sw, 'build2', '/index.html')).toBe('build1 /index.html');
    expect(await precacheText(sw, 'build2', '/offline.html')).toBe('build1 /offline.html');
    // Files the new install did fetch are the new build's, never the old copy.
    expect(await precacheText(sw, 'build2', '/')).toBe('build2 /');
    expect(await precacheText(sw, 'build2', '/manifest.json')).toBe('build2 /manifest.json');
  });

  it('still opens a never-visited route offline after an install made with no network at all', async () => {
    const sw = await upgrade([], false);
    for (const path of SHELL) {
      expect(await precacheText(sw, 'build2', path)).toBe(`build1 ${path}`);
    }
    const page = await sw.request('/dashboard/clients', { mode: 'navigate' });
    expect(page!.status).toBe(200);
    expect(await page!.text()).toBe('build1 /index.html');
  });

  it('takes a missing file from the most recent of several old precaches', async () => {
    const sw = installWorker('build3', ['/index.html']);
    const older = new FakeCache();
    await older.put('/index.html', new Response('build1 /index.html'));
    const newer = new FakeCache();
    await newer.put('/index.html', new Response('build2 /index.html'));
    // caches.keys() lists caches in creation order.
    sw.stores.set('agentbio-sw-precache-build1', older);
    sw.stores.set('agentbio-sw-precache-build2', newer);
    await sw.lifecycle('install');
    await sw.lifecycle('activate');
    expect(await precacheText(sw, 'build3', '/index.html')).toBe('build2 /index.html');
    expect(sw.stores.has('agentbio-sw-precache-build1')).toBe(false);
    expect(sw.stores.has('agentbio-sw-precache-build2')).toBe(false);
  });
});

describe('build-time version stamp', () => {
  const sha = (input: string) => createHash('sha256').update(input).digest('hex');

  it('ships exactly one placeholder for the build to replace', () => {
    expect(SOURCE.split(SW_VERSION_PLACEHOLDER)).toHaveLength(2);
  });

  it('derives a stable id from the emitted file names, whatever their order', () => {
    const a = buildIdFromFileNames(['assets/index-1.js', 'assets/vendor-2.js'], sha);
    const b = buildIdFromFileNames(['assets/vendor-2.js', 'assets/index-1.js'], sha);
    const c = buildIdFromFileNames(['assets/index-9.js', 'assets/vendor-2.js'], sha);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{12}$/);
  });

  it('stamps the version and refuses a source without the placeholder', () => {
    const stamped = stampServiceWorkerVersion(SOURCE, 'abc123');
    expect(stamped).toContain("const VERSION = 'abc123';");
    expect(stamped).not.toContain(SW_VERSION_PLACEHOLDER);
    expect(() => stampServiceWorkerVersion(stamped, 'def456')).toThrow(/expected exactly one/);
    expect(() => stampServiceWorkerVersion(SOURCE, "x'; evil()")).toThrow(/refusing build id/);
  });
});
