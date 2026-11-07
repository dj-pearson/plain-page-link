/**
 * Build-time stamping of public/sw.js (US-272).
 *
 * public/ is copied into dist/ verbatim, so without this the service worker
 * was byte-identical on every deploy. The browser only installs a new worker
 * when the script's bytes change, so its precached app shell was never
 * refreshed: the offline fallback served the homepage from the day the visitor
 * first installed the worker, naming chunks that later deploys deleted.
 *
 * The `sw-build-version` plugin in vite.config.ts calls these after the bundle
 * is written. Kept free of Node imports so the unit suite can import it.
 */

/** The exact declaration public/sw.js ships with. */
export const SW_VERSION_PLACEHOLDER = "const VERSION = 'dev';";

/**
 * A build id derived from the names of the files the build emitted. Vite's
 * names carry content hashes, so the id changes exactly when the deployed code
 * does, and two builds of the same commit agree — no needless reinstall.
 *
 * `hash` is injected (node:crypto in the build) to keep this module portable.
 */
export function buildIdFromFileNames(
  fileNames: readonly string[],
  hash: (input: string) => string
): string {
  const digest = hash([...fileNames].sort().join('\n'));
  return digest.slice(0, 12);
}

/**
 * Replace the placeholder VERSION with the build id. Throws when the
 * placeholder is missing, because a build that silently ships an unstamped
 * worker reintroduces the never-updating shell without anyone noticing.
 */
export function stampServiceWorkerVersion(source: string, buildId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(buildId)) {
    throw new Error(`sw-build-version: refusing build id ${JSON.stringify(buildId)}`);
  }
  const occurrences = source.split(SW_VERSION_PLACEHOLDER).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `sw-build-version: expected exactly one \`${SW_VERSION_PLACEHOLDER}\` in sw.js, found ${occurrences}`
    );
  }
  return source.replace(SW_VERSION_PLACEHOLDER, `const VERSION = '${buildId}';`);
}
