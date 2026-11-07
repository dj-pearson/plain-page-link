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
  async addAll(urls: string[]) {
    for (const u of urls) this.entries.set(new URL(u, ORIGIN).href, new Response(`shell ${u}`));
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
  network: (req: Request) => Promise<Response> = defaultNetwork
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
    fetch: (req: Request) => {
      fetched.push(req.url);
      return network(req);
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
    const req = new Request(new URL(path, ORIGIN).href, init);
    // Request's destination/mode are fixed in Node; the worker only reads
    // these fields, so a plain object carrying them is enough.
    const view = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      destination: init.destination ?? '',
      mode: init.mode ?? 'cors',
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

  return { stores, fetched, lifecycle, request };
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
