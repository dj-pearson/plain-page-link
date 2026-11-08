import { defineConfig, loadEnv, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { visualizer } from 'rollup-plugin-visualizer';
import { HOMEPAGE_SEO } from './src/config/homepage-seo';
import { buildIdFromFileNames, stampServiceWorkerVersion } from './src/config/sw-version';
import { vendorChunkFor } from './src/config/vendor-chunks';
// Cache bust: 2026-01-02 - Performance optimization

// Bundle size baseline (2026-05-17, production build, minified, pre-gzip).
// Budgets enforced by scripts/check-bundle-size.mjs in CI:
//   - app/route chunks: max 500 KB
//   - *-vendor chunks:   max 600 KB
// Largest chunks at baseline:
//   three-vendor   820 KB  (lazy-loaded 3D; documented exception — only
//                            loaded on hero sections, never on first paint)
//   export-vendor  594 KB  (jspdf/html2canvas; lazy, under vendor budget)
//   index          407 KB  (entry)
//   charts-vendor  402 KB  (recharts; lazy, admin screens only since US-395)
//   supabase       175 KB  | react-vendor 164 KB | animation-vendor 185 KB
// ANALYZE=true `vite build` writes dist/stats.html and opens it.
const ANALYZE = process.env.ANALYZE === 'true';

// Source maps are OFF by default, and that is a deliberate change (US-160).
//
// The build used to emit `sourcemap: 'hidden'` unconditionally, with a comment
// claiming hidden maps "won't expose source code to users". That is not what
// `hidden` does. It only omits the `//# sourceMappingURL=` comment from the
// bundle; the .map files are still written to dist/ and still deployed, at a
// URL derivable from the chunk name you can read in any browser's network tab.
// 193 of them, 17 MB, publishing the entire TypeScript source of the app —
// every query shape, every RLS assumption, every not-yet-shipped route.
//
// The stated reason was Sentry symbolication, but nothing uploads them: there
// is no @sentry/vite-plugin and no upload step in .github/workflows. They were
// pure cost.
//
// Set BUILD_SOURCEMAPS=true to get them back — for a local `npm run analyze`,
// or for a CI job that uploads to Sentry and then deletes dist/**/*.map before
// the deploy step. scripts/check-bundle-size.mjs fails the build if maps reach
// dist without that flag set.
const BUILD_SOURCEMAPS = process.env.BUILD_SOURCEMAPS === 'true';

// US-535: scripts/check-dashboard-weight.mjs reads .vite/manifest.json to weigh
// each dashboard route. Written only when asked for (CI's bundle-size job), so
// the deployed site does not publish its chunk map at /.vite/manifest.json.
const BUILD_MANIFEST = process.env.BUILD_MANIFEST === 'true';

export default defineConfig(({ mode }) => {
  // '' as the prefix so .env files are read whole; only VITE_GA_MEASUREMENT_ID
  // is used below, and Vite still applies its own VITE_ prefix rule to what the
  // client bundle can see.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: '::',
      port: 8080,
    },
    plugins: [
      react(),
      // Fills the GA measurement id into index.html's <meta name="ga-measurement-id">.
      //
      // Not Vite's own `%VITE_GA_MEASUREMENT_ID%` substitution: that warns on
      // every dev start and every CI build when the variable is unset, which is
      // the normal case outside production. public/scripts/analytics.js reads the
      // meta tag because it is a static asset with no import.meta.env, and the
      // page's CSP is `script-src 'self'` with no 'unsafe-inline', so an inline
      // script could not carry the value either (US-123).
      {
        name: 'ga-measurement-id',
        transformIndexHtml: {
          order: 'pre' as const,
          handler(html: string) {
            const id = (env.VITE_GA_MEASUREMENT_ID ?? '').trim();
            return html.replace(/(<meta name="ga-measurement-id" content=")[^"]*(")/, `$1${id}$2`);
          },
        },
      },
      // index.html's <title>, description and og/twitter tags are the ONLY thing a
      // crawler sees before the bundle runs, and they were a hand-maintained
      // second copy of the homepage's marketing copy. They drifted, and the
      // stale half is what shipped. Written from src/config/homepage-seo.ts at
      // build time so there is one source (US-152).
      {
        name: 'homepage-seo',
        transformIndexHtml: {
          order: 'pre' as const,
          handler(html: string) {
            const { title, description } = HOMEPAGE_SEO;
            const escape = (value: string) =>
              value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            const t = escape(title);
            const d = escape(description);
            return html
              .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
              .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
              .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
              .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
              .replace(/(<meta property="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
              .replace(/(<meta property="twitter:description" content=")[^"]*(")/, `$1${d}$2`);
          },
        },
      },
      // `upgrade-insecure-requests` is right in production and fatal on the dev
      // server. index.html's meta CSP carries it, and over http://127.0.0.1
      // WebKit honours it — every subresource is re-requested as https, the
      // dev server speaks plain http, and each one dies on the TLS handshake.
      // /src/main.tsx is one of them, so the SPA never mounts: #root stays
      // empty and every locator in a browser test times out waiting for a form
      // that was never rendered.
      //
      // Chromium exempts loopback as a potentially-trustworthy origin and does
      // not upgrade, which is why this was invisible until the security suite's
      // iPhone 13 project (WebKit) was actually able to run — it accounted for
      // all 10 of its remaining failures. Anyone opening `npm run dev` in
      // Safari has been getting a blank page for the same reason.
      //
      // Removed only when serving. The built index.html is untouched, and the
      // deployed CSP in public/_headers keeps the directive.
      {
        name: 'csp-no-upgrade-in-dev',
        apply: 'serve' as const,
        transformIndexHtml: {
          order: 'pre' as const,
          handler(html: string) {
            return html.replace(/\s*upgrade-insecure-requests;/, '');
          },
        },
      },
      // Security headers plugin for development
      {
        name: 'security-headers',
        configureServer(server: ViteDevServer) {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            next();
          });
        },
      },
      // Gives dist/sw.js a VERSION that changes with the deployed code (US-272).
      // Without it the worker is byte-identical on every deploy, the browser
      // never installs a new one, and the precached offline shell stays the
      // copy from a visitor's first visit. See src/config/sw-version.ts.
      {
        name: 'sw-build-version',
        apply: 'build' as const,
        writeBundle(options: { dir?: string }, bundle: Record<string, unknown>) {
          const target = path.join(options.dir ?? path.resolve(__dirname, 'dist'), 'sw.js');
          if (!existsSync(target)) return;
          const buildId = buildIdFromFileNames(Object.keys(bundle), (input) =>
            createHash('sha256').update(input).digest('hex')
          );
          writeFileSync(target, stampServiceWorkerVersion(readFileSync(target, 'utf8'), buildId));
        },
      },
      // Bundle visualizer — only when ANALYZE=true (off in CI/normal builds)
      ANALYZE &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // See BUILD_SOURCEMAPS above. 'hidden' keeps the sourceMappingURL
      // comment out of the bundle so browsers do not fetch maps automatically;
      // it does NOT stop anyone requesting the .map directly, which is why the
      // default is false and the deploy guard exists.
      sourcemap: BUILD_SOURCEMAPS ? 'hidden' : false,
      manifest: BUILD_MANIFEST,
      rollupOptions: {
        output: {
          format: 'es',
          // Manual chunk splitting for better caching and smaller initial bundle
          manualChunks(id) {
            // Vite's __vitePreload helper is a virtual module with no home of
            // its own, so left to Rollup it is filed into whichever manual
            // chunk it happens to pick. Every module that lazy-loads anything
            // then emits `import{_}from"./<that chunk>"` — a STATIC import of
            // the whole chunk to obtain a 200-byte function.
            //
            // It had landed in the 605 KB jspdf chunk, and after US-162 removed
            // that chunk it moved into the 818 KB three-vendor one, which put
            // Three.js on the critical path of FullProfilePage — /:username,
            // the page every agent puts in their Instagram bio, whose theme
            // usually renders no 3D at all. Same defect both times; only the
            // victim changed.
            //
            // This is why manualChunks is a function rather than the object
            // form it used to be: the object form resolves its entries as
            // package specifiers, so 'vite/preload-helper' cannot be named in
            // it — the build dies with `Missing "./preload-helper" specifier in
            // "vite" package`. A function can match the virtual id directly.
            if (id.includes('vite/preload-helper')) return 'react-vendor';

            // The vendor table and its matching rule are in
            // src/config/vendor-chunks.ts, where they are unit-tested.
            return vendorChunkFor(id);
          },
        },
      },
      minify: 'esbuild',
      target: 'esnext',
      // Increase chunk size warning limit since we're intentionally creating vendor chunks
      chunkSizeWarningLimit: 600,
    },
  };
});
