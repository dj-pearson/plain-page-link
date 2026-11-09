/**
 * /:username/manifest.json (US-460, fixing US-450): the app a visitor installs
 * from an agent's page opens that page, never the AgentBio dashboard.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { onRequestGet } from '../[username]/manifest.json';
import { buildProfileManifest } from '../_lib/profile-manifest';

const ROOT = join(__dirname, '..', '..');
const ENV = { VITE_SUPABASE_URL: 'https://api.example.test/', VITE_SUPABASE_ANON_KEY: 'anon-key' };
const dashboard = JSON.parse(readFileSync(join(ROOT, 'public', 'manifest.json'), 'utf8')) as {
  id: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const run = (username: string | undefined, env: Record<string, string> = ENV) =>
  onRequestGet({ env, params: { username } });

describe('/:username/manifest.json', () => {
  it("opens the agent's page, under its own identity and scope", async () => {
    fetchMock.mockResolvedValue(json([{ username: 'jane', full_name: 'Jane Doe' }]));
    const response = await run('jane');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/manifest+json');
    const manifest = (await response.json()) as Record<string, unknown>;
    expect(manifest.start_url).toBe('/jane');
    expect(manifest.scope).toBe('/jane');
    expect(manifest.id).toBe('/jane');
    expect(manifest.name).toBe('Jane Doe');
    expect(manifest.display).toBe('standalone');
  });

  it("never shares the dashboard app's identity, so an agent's own install is untouched", () => {
    const manifest = buildProfileManifest({ username: 'jane', full_name: null });
    expect(manifest.id).not.toBe(dashboard.id);
    expect(String(manifest.start_url)).not.toMatch(/^\/dashboard/);
  });

  it('asks only for published profiles', async () => {
    fetchMock.mockResolvedValue(json([]));
    const response = await run('hidden-agent');
    expect(response.status).toBe(404);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/rest/v1/profiles');
    expect(url.searchParams.get('is_published')).toBe('is.true');
    expect(url.searchParams.get('username')).toBe('eq.hidden-agent');
    expect(url.searchParams.get('select')).toBe('username,full_name,avatar_url');
  });

  it('answers reserved, non-canonical and missing usernames with 404 without a query', async () => {
    for (const segment of ['dashboard', 'Jane', 'manifest.json', undefined]) {
      expect((await run(segment)).status, String(segment)).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not cache a database failure as "no app"', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    const failed = await run('jane');
    expect(failed.status).toBe(503);
    expect(failed.headers.get('cache-control')).toBe('no-store');

    fetchMock.mockResolvedValueOnce(json({ message: 'boom' }, 500));
    expect((await run('jane')).status).toBe(503);

    expect((await run('jane', {})).status).toBe(503);
  });

  it('labels the icon with something that fits a home screen', () => {
    expect(buildProfileManifest({ username: 'jane', full_name: 'Jo Lee' }).short_name).toBe(
      'Jo Lee'
    );
    expect(
      buildProfileManifest({ username: 'm', full_name: 'Maximiliana Featherstonehaugh' }).short_name
    ).toBe('Maximiliana');
    expect(buildProfileManifest({ username: 'dana-rivers', full_name: '  ' }).name).toBe(
      'dana-rivers'
    );
  });

  it('URL-encodes the username in every path it writes', () => {
    const manifest = buildProfileManifest({ username: 'josé', full_name: null });
    expect(manifest.start_url).toBe('/jos%C3%A9');
    expect(manifest.scope).toBe(manifest.start_url);
  });

  it('points only at icons that ship, at installable sizes', () => {
    const icons = buildProfileManifest({ username: 'jane', full_name: null }).icons as {
      src: string;
      sizes: string;
    }[];
    expect(icons.some((i) => i.sizes === '192x192')).toBe(true);
    expect(icons.some((i) => i.sizes === '512x512')).toBe(true);
    for (const icon of icons) {
      expect(existsSync(join(ROOT, 'public', icon.src)), icon.src).toBe(true);
    }
  });

  describe("the agent's photo as the home-screen icon (US-481)", () => {
    const AVATAR = 'https://api.example.test/storage/v1/object/public/avatars/u1/avatar-17.jpg';
    const ICON_192 =
      'https://api.example.test/storage/v1/object/public/avatars/u1/avatar-17-app-icon-192.png';
    const ICON_512 =
      'https://api.example.test/storage/v1/object/public/avatars/u1/avatar-17-app-icon-512.png';
    type Icon = { src: string; sizes: string };
    const iconsOf = async (response: Response) =>
      ((await response.json()) as { icons: Icon[] }).icons;

    const routes = (heads: Record<string, number | Error>) =>
      fetchMock.mockImplementation(async (input, init) => {
        if (init?.method === 'HEAD') {
          const answer = heads[input] ?? 404;
          if (answer instanceof Error) throw answer;
          return new Response(null, { status: answer });
        }
        return json([{ username: 'jane', full_name: 'Jane Doe', avatar_url: AVATAR }]);
      });

    it('lists the photo first at every size, with the logo behind it at the same sizes', async () => {
      routes({ [ICON_192]: 200, [ICON_512]: 200 });
      const icons = await iconsOf(await run('jane'));

      expect(icons.map((i) => i.src)).toEqual([
        ICON_192,
        ICON_512,
        '/icons/icon-192.png',
        '/icons/icon-512.png',
      ]);
      expect(icons.map((i) => i.sizes)).toEqual(['192x192', '512x512', '192x192', '512x512']);
      const heads = fetchMock.mock.calls.filter(([, init]) => init?.method === 'HEAD');
      expect(heads.map(([u]) => u).sort()).toEqual([ICON_192, ICON_512]);
    });

    it('keeps the platform icons when either size is missing or the check fails', async () => {
      const cases: Record<string, number | Error>[] = [
        { [ICON_192]: 200 },
        { [ICON_512]: 200 },
        { [ICON_192]: 200, [ICON_512]: new Error('timeout') },
        { [ICON_192]: 500, [ICON_512]: 200 },
      ];
      for (const heads of cases) {
        fetchMock.mockReset();
        routes(heads);
        const response = await run('jane');
        expect(response.status).toBe(200);
        expect((await iconsOf(response)).every((i) => i.src.startsWith('/icons/'))).toBe(true);
      }
    });

    it('never asks another host about an avatar that is not in our storage', async () => {
      fetchMock.mockResolvedValue(
        json([
          {
            username: 'jane',
            full_name: null,
            avatar_url: 'https://elsewhere.test/storage/v1/object/public/avatars/u1/a.jpg',
          },
        ])
      );
      const icons = await iconsOf(await run('jane'));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(icons.every((i) => i.src.startsWith('/icons/'))).toBe(true);
    });

    it('asks nothing more when the agent has no photo', async () => {
      fetchMock.mockResolvedValue(json([{ username: 'jane', full_name: null, avatar_url: null }]));
      await run('jane');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
