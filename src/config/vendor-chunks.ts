/**
 * Vendor chunk assignment for the production build: the manualChunks rule in
 * vite.config.ts. It lives here rather than inline in the config so the rule
 * itself, not a copy of it, can be unit-tested (src/profile-bundle.test.ts).
 * Importing vite.config.ts from a test loads esbuild, which refuses to start
 * under jsdom.
 *
 * vite.config.ts imports this at build time, like sw-version.ts beside it, so
 * it must stay free of browser and Vite imports.
 */

// Vendor chunk groupings, applied by vendorChunkFor below.
//
// Matched on the package directory a module resolves into, so a package's own
// files all land together. Transitive dependencies are deliberately NOT pulled
// in: recharts' d3-* packages, for instance, get their own chunks rather than
// being welded into charts-vendor, which is what the old object form did.
//
// An entry ending in '/' is a scope prefix and matches every package in that
// scope ('@radix-ui/' matches @radix-ui/react-dialog and
// @radix-ui/react-dismissable-layer alike). Any other entry is an exact name.
//
// The first match wins. That is what lets react-vendor keep two Radix packages
// by name ahead of ui-vendor's '@radix-ui/' prefix; otherwise the lists are
// disjoint.
export const VENDOR_CHUNKS: readonly (readonly [string, readonly string[]])[] = [
  // React core - rarely changes, caches well.
  //
  // clsx, tailwind-merge and class-variance-authority are here for the same
  // reason the preload helper is (US-164). They are a few KB each, every
  // component in the app calls cn() from src/lib/utils.ts, and recharts happens
  // to depend on clsx too — so Rollup, having no instruction, filed clsx into
  // charts-vendor and the ENTRY chunk then emitted
  // `import{e as Tr}from"./charts-vendor-<hash>.js"` to get it. 394 KB of
  // dashboard charting library on the critical path of the marketing landing
  // page, for one 500-byte function. Same shape as US-163, one layer down:
  // a tiny shared module with no home, adopted by the largest chunk that
  // happened to want it. Name them, and they land where they are needed.
  [
    'react-vendor',
    [
      'react',
      'react-dom',
      'react-router-dom',
      'react-router',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      // Same story again, and the reason three-vendor was reaching into
      // charts-vendor: @babel/runtime's helpers (_extends and friends) are a
      // few hundred bytes, and both recharts and @react-three/drei depend on
      // them. Rollup put them in charts-vendor, so loading a 3D profile theme
      // pulled in 394 KB of charting library to get Object.assign.
      '@babel/runtime',
      // And once more, for Radix (US-244). Button is on every page and imports
      // Slot from @radix-ui/react-slot, which was listed in ui-vendor — so the
      // entry chunk statically imported all of ui-vendor (dialog, select,
      // dropdown, tabs, popover, accordion, toast... 37 KB gzip) to render a
      // <button>. Slot and the compose-refs helper it is built on are about a
      // kilobyte; they live with React, and ui-vendor loads only on the pages
      // that open a dialog or a menu.
      '@radix-ui/react-slot',
      '@radix-ui/react-compose-refs',
    ],
  ],
  // Supabase client - used everywhere
  ['supabase', ['@supabase/supabase-js']],
  // UI framework - every other Radix package (US-288). This used to name 13
  // top-level primitives, which left the ~25 internal ones they are built on
  // (dismissable-layer, focus-scope, popper, presence, portal, primitive, ...)
  // routed by nothing. They ended up in ui-vendor only because Rollup merged
  // each into the one manual chunk that imported it — and a primitive that a
  // page or the entry happened to import directly would have been filed into
  // that page's chunk instead, splitting Radix across chunks. A new Radix
  // component (tooltip, radio-group) also had to be remembered here. The
  // prefix routes all of them; Slot and compose-refs stay in react-vendor above.
  ['ui-vendor', ['@radix-ui/']],
  // Heavy 3D libraries - lazy loaded, and they must STAY lazy: see the
  // preload-helper note in manualChunks below.
  ['three-vendor', ['three', '@react-three/fiber', '@react-three/drei']],
  // Charts - dashboard only
  ['charts-vendor', ['recharts']],
  // Animation libraries, in two chunks (US-244). They were one
  // animation-vendor chunk, so the public profile — which uses framer-motion
  // and nothing else — downloaded GSAP too (67 KB gzip together). GSAP is
  // used by the landing hero alone.
  ['motion-vendor', ['framer-motion']],
  ['gsap-vendor', ['gsap', '@gsap/react']],
  // Markdown rendering - blog only
  ['markdown-vendor', ['react-markdown', 'remark-gfm']],
  // Form handling
  ['form-vendor', ['react-hook-form', '@hookform/resolvers', 'zod']],
  // State management
  ['state-vendor', ['zustand', '@tanstack/react-query']],
  // Date utilities
  ['date-vendor', ['date-fns']],
  // Error monitoring (US-255). Both are reached only through dynamic imports
  // in src/lib/sentry.ts -> sentry-sdk.ts -> sentry-replay.ts, and are named so
  // scripts/check-bundle-size.mjs can prove they stay off the first-paint
  // graph. Replay (rrweb inside it) is the larger half and loads last.
  [
    'sentry-vendor',
    [
      '@sentry/react',
      '@sentry/browser',
      '@sentry/core',
      '@sentry-internal/browser-utils',
      '@sentry-internal/feedback',
    ],
  ],
  ['sentry-replay-vendor', ['@sentry-internal/replay', '@sentry-internal/replay-canvas']],
];

// jspdf / jspdf-autotable are deliberately absent from the table above
// (US-162). They are reached only through the `await import('jspdf')` inside
// src/lib/exportUtils.ts, so Rollup already gives them their own async chunk.
// Naming them here forced that chunk into existence eagerly and made it the
// preload helper's home. html2canvas was listed too and is not a dependency of
// this project at all; jspdf only references it optionally.

/**
 * The package a module id belongs to, or undefined for first-party source.
 * Handles scoped names, and the last node_modules segment so a nested
 * dependency is attributed to itself rather than to its parent.
 */
export function packageOf(id: string): string | undefined {
  const marker = 'node_modules/';
  const last = id.lastIndexOf(marker);
  if (last === -1) return undefined;

  const rest = id.slice(last + marker.length).split('/');
  return rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0];
}

/** Whether a VENDOR_CHUNKS entry names this package (see the prefix rule above). */
function entryMatches(entry: string, pkg: string): boolean {
  return entry.endsWith('/') ? pkg.startsWith(entry) : entry === pkg;
}

/** The vendor chunk a package is filed into, or undefined to let Rollup decide. */
export function chunkForPackage(pkg: string): string | undefined {
  for (const [chunk, entries] of VENDOR_CHUNKS) {
    if (entries.some((entry) => entryMatches(entry, pkg))) return chunk;
  }
  return undefined;
}

/**
 * The manualChunks decision for one module id, apart from Vite's preload
 * helper, which vite.config.ts handles first (it is a virtual module, not a
 * package). Everything else is attributed to its package and looked up.
 */
export function vendorChunkFor(id: string): string | undefined {
  const pkg = packageOf(id);
  return pkg ? chunkForPackage(pkg) : undefined;
}
