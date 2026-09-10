/**
 * Get a Chromium for the build to prerender with, on a machine that may not
 * have one.
 *
 * CI installs the browser in a step of its own (`npx playwright install
 * --with-deps chromium`), but the Cloudflare Pages deploy does not and cannot:
 * its build command is `npm run build` and its image ships no browsers. So from
 * US-147 — the commit that made prerendering part of `npm run build` — every
 * production deploy died in scripts/prerender.mts, after a clean `vite build`,
 * on:
 *
 *   [prerender] failed: browserType.launch: Executable doesn't exist at
 *   /opt/buildhome/.cache/ms-playwright/chromium_headless_shell-1200/...
 *
 * Nothing was wrong with the bundle. Nothing had ever put a browser on that
 * machine, and the one place that knew a browser was needed was a script that
 * assumed someone else had dealt with it.
 *
 * Fetching it on demand puts the requirement next to the only code that has it,
 * rather than in a build command living in a dashboard. Where a browser is
 * already present — CI, a dev machine — this costs one launch attempt.
 */
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { chromium, type Browser } from 'playwright';

/**
 * Playwright says the browser it wants is not on disk.
 *
 * Two shapes, both inside the launch error: the message itself ("Executable
 * doesn't exist at ...") and the banner Playwright appends telling you to run
 * `npx playwright install`. A missing *system library* reads differently
 * ("Host system is missing dependencies") and must not match — reinstalling
 * the binary would not fix it, and pretending otherwise buries the real cause.
 */
const BROWSER_NOT_INSTALLED = /Executable doesn't exist|playwright install/i;

/** Seam for the tests; nothing else has any business replacing these. */
export interface ChromiumDeps {
  launch: () => Promise<Browser>;
  install: () => void;
  log: (message: string) => void;
}

/**
 * The playwright CLI in node_modules — not `npx playwright`, which would go to
 * the registry when the local copy is missing and could satisfy the install
 * with a version other than the pinned one.
 */
function playwrightCli(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('playwright/package.json')), 'cli.js');
}

/**
 * Download the browser this Playwright build wants, into the cache it looks in.
 *
 * `--with-deps` shells out to apt-get, so it is only reachable as root; a
 * non-root build gets the plain install and, if the image is missing a shared
 * library, a launch failure that names it.
 */
export function installChromium(
  run: (args: string[]) => SpawnSyncReturns<Buffer> = (args) =>
    spawnSync(process.execPath, [playwrightCli(), ...args], { stdio: 'inherit' }),
  log: (message: string) => void = console.warn
): void {
  const asRoot = process.platform === 'linux' && process.getuid?.() === 0;

  let result = run(asRoot ? ['install', '--with-deps', 'chromium'] : ['install', 'chromium']);

  // apt-get can fail for reasons that have nothing to do with the browser: no
  // route to the archives, a dpkg lock held elsewhere. The binary is still
  // worth having.
  if (asRoot && result.status !== 0) {
    log('[prerender] `playwright install --with-deps` failed; retrying without system deps');
    result = run(['install', 'chromium']);
  }

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `playwright install chromium exited with ${result.status ?? String(result.signal)}`
    );
  }
}

/** Launch Chromium, installing it first if this machine has not got one. */
export async function launchChromium(deps: Partial<ChromiumDeps> = {}): Promise<Browser> {
  const launch = deps.launch ?? (() => chromium.launch());
  const install = deps.install ?? (() => installChromium());
  const log = deps.log ?? console.log;

  try {
    return await launch();
  } catch (error) {
    if (!BROWSER_NOT_INSTALLED.test((error as Error)?.message ?? '')) throw error;
    log('[prerender] no chromium for this playwright on this machine; downloading it');
    install();
    return await launch();
  }
}
