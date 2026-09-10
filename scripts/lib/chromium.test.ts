/**
 * The Cloudflare Pages deploy failed on a missing browser for every build
 * between US-147 and this one. These cover the recovery, and — more usefully —
 * the two cases where recovering would be wrong: an error that is not a missing
 * browser, and a browser that is present but cannot run.
 */
import type { SpawnSyncReturns } from 'node:child_process';
import { describe, expect, it, vi } from 'vitest';
import type { Browser } from 'playwright';

import { installChromium, launchChromium } from './chromium.mts';

const browser = {} as Browser;

/** What Playwright actually threw on Cloudflare Pages on 2026-09-10. */
const MISSING_BROWSER = new Error(
  "browserType.launch: Executable doesn't exist at " +
    '/opt/buildhome/.cache/ms-playwright/chromium_headless_shell-1200/' +
    'chrome-headless-shell-linux64/chrome-headless-shell\n' +
    '╔═════════════════════════════════════════════════════════════════════════╗\n' +
    '║ Looks like Playwright Test or Playwright was just installed or updated. ║\n' +
    '║     npx playwright install                                              ║\n' +
    '╚═════════════════════════════════════════════════════════════════════════╝'
);

const ok = (status = 0): SpawnSyncReturns<Buffer> =>
  ({
    status,
    signal: null,
    pid: 1,
    output: [],
    stdout: Buffer.alloc(0),
    stderr: Buffer.alloc(0),
  }) as SpawnSyncReturns<Buffer>;

describe('launchChromium', () => {
  it('does not install when the browser is already there', async () => {
    const install = vi.fn();
    const result = await launchChromium({
      launch: vi.fn().mockResolvedValue(browser),
      install,
      log: vi.fn(),
    });

    expect(result).toBe(browser);
    expect(install).not.toHaveBeenCalled();
  });

  it('installs the browser and launches again when it is missing', async () => {
    const launch = vi.fn().mockRejectedValueOnce(MISSING_BROWSER).mockResolvedValueOnce(browser);
    const install = vi.fn();

    expect(await launchChromium({ launch, install, log: vi.fn() })).toBe(browser);
    expect(install).toHaveBeenCalledTimes(1);
    expect(launch).toHaveBeenCalledTimes(2);
  });

  // A build image without libnss3 produces a browser that exists and will not
  // start. Downloading it a second time changes nothing and buries the message
  // that says which library is missing.
  it('rethrows an error that is not a missing browser, without installing', async () => {
    const hostDeps = new Error(
      'browserType.launch: Host system is missing dependencies to run browsers:\n libnss3.so'
    );
    const install = vi.fn();

    await expect(
      launchChromium({ launch: vi.fn().mockRejectedValue(hostDeps), install, log: vi.fn() })
    ).rejects.toThrow('Host system is missing dependencies');
    expect(install).not.toHaveBeenCalled();
  });

  it('surfaces a failed install rather than retrying forever', async () => {
    const launch = vi.fn().mockRejectedValue(MISSING_BROWSER);
    const install = vi.fn(() => {
      throw new Error('playwright install chromium exited with 1');
    });

    await expect(launchChromium({ launch, install, log: vi.fn() })).rejects.toThrow(
      'exited with 1'
    );
    expect(launch).toHaveBeenCalledTimes(1);
  });
});

describe('installChromium', () => {
  it('asks the pinned CLI for chromium', () => {
    const run = vi.fn().mockReturnValue(ok());
    installChromium(run, vi.fn());

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toContain('install');
    expect(run.mock.calls[0][0]).toContain('chromium');
  });

  it('throws when the CLI exits non-zero', () => {
    expect(() => installChromium(vi.fn().mockReturnValue(ok(1)), vi.fn())).toThrow('exited with 1');
  });

  it('falls back to a plain install when apt-get fails under root', () => {
    const getuid = process.getuid;
    const platform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    process.getuid = () => 0;

    try {
      const run = vi.fn().mockReturnValueOnce(ok(1)).mockReturnValueOnce(ok(0));
      installChromium(run, vi.fn());

      expect(run.mock.calls[0][0]).toContain('--with-deps');
      expect(run.mock.calls[1][0]).not.toContain('--with-deps');
    } finally {
      process.getuid = getuid;
      Object.defineProperty(process, 'platform', { value: platform, configurable: true });
    }
  });
});
