#!/usr/bin/env node
/**
 * Bundle size budget check (US-026).
 *
 * Scans dist/assets/*.js and fails (exit 1) if any chunk exceeds its
 * budget:
 *   - *-vendor chunks: 600 KB
 *   - all other chunks: 500 KB
 *
 * EXCEPTIONS: a small allowlist of chunks that are intentionally large
 * AND lazy-loaded (never on first paint). These are documented in
 * vite.config.ts. Adding to this list is a deliberate, reviewable
 * decision — keep it minimal.
 *
 * Run after `vite build`. Used by the CI `bundle-size` job.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ASSETS_DIR = join(process.cwd(), "dist", "assets");
const KB = 1024;
const VENDOR_BUDGET = 600 * KB;
const DEFAULT_BUDGET = 500 * KB;

// chunk name prefix -> { reason, staticImporters }.
//
// `reason` is the justification for going over budget. `staticImporters` is the
// enforcement of it: the ONLY chunks allowed to `import ... from "./<chunk>"`.
// Everything else must reach it through a dynamic import, or not at all.
//
// This second field exists because the reason was false for months and nothing
// noticed (US-163). Vite's __vitePreload helper is a virtual module, so Rollup
// filed it into three-vendor, and every chunk that lazy-loads anything then
// statically imported 797 KB of Three.js to obtain a 200-byte function.
// FullProfilePage was one of them — /:username, the page every agent puts in
// their Instagram bio, whose theme usually renders no 3D at all. An exception
// that only carries prose cannot catch that; one that names its importers can.
//
// Kept tiny on purpose.
const EXCEPTIONS = {
  "three-vendor": {
    reason:
      "Three.js/R3F — lazy-loaded only on 3D hero sections, never on first paint",
    staticImporters: [
      /^FloatingGeometry-/,
      /^GradientMesh-/,
      /^ThreeDBackground-/,
      /^Hero3D/,
    ],
  },
};

function budgetFor(name) {
  return name.includes("-vendor") ? VENDOR_BUDGET : DEFAULT_BUDGET;
}

function exceptionFor(name) {
  return Object.keys(EXCEPTIONS).find((prefix) => name.startsWith(prefix));
}

// US-160: source maps must not reach the CDN. `sourcemap: 'hidden'` only
// removes the sourceMappingURL comment — the .map files are still deployed and
// still fetchable at a URL derived from the chunk name, which publishes the
// whole TypeScript source. vite.config.ts emits them only when
// BUILD_SOURCEMAPS=true; that flag is for a local analyze run, or for a CI job
// that uploads to Sentry and then deletes dist/**/*.map before deploying.
const SOURCEMAPS_ALLOWED = process.env.BUILD_SOURCEMAPS === "true";

let files;
try {
  files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".js"));
} catch {
  console.error(
    `[bundle-size] dist/assets not found. Run \`npm run build\` first.`
  );
  process.exit(1);
}

if (!SOURCEMAPS_ALLOWED) {
  const maps = readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".map"));
  if (maps.length) {
    const bytes = maps.reduce(
      (sum, f) => sum + statSync(join(ASSETS_DIR, f)).size,
      0
    );
    console.error(
      `[bundle-size] FAILED — ${maps.length} source map(s) in dist/assets ` +
        `(${(bytes / KB / KB).toFixed(1)} MB).`
    );
    console.error(
      "  Deployed .map files are publicly fetchable and publish the app's " +
        "source. Build without BUILD_SOURCEMAPS=true, or delete " +
        "dist/**/*.map after uploading them to your error tracker."
    );
    process.exit(1);
  }
}

const violations = [];
const exempted = [];

for (const file of files) {
  const size = statSync(join(ASSETS_DIR, file)).size;
  const budget = budgetFor(file);
  if (size <= budget) continue;

  const ex = exceptionFor(file);
  if (ex) {
    exempted.push({ file, size, reason: EXCEPTIONS[ex].reason });
  } else {
    violations.push({ file, size, budget });
  }
}

const fmt = (n) => `${(n / KB).toFixed(1)} KB`;

if (exempted.length) {
  console.log("[bundle-size] Documented exceptions (over budget, allowed):");
  for (const e of exempted) {
    console.log(`  - ${e.file} (${fmt(e.size)}) — ${e.reason}`);
  }
}

// Hold each exception to its own justification. A static import renders as
// `from"./chunk.js"`; a dynamic one renders as `import("./chunk.js")`, so
// matching on `from` picks up exactly the imports that put the chunk on a
// critical path.
const laxExceptions = [];
for (const e of exempted) {
  const allowed = EXCEPTIONS[exceptionFor(e.file)].staticImporters;
  for (const file of files) {
    if (file === e.file) continue;
    const source = readFileSync(join(ASSETS_DIR, file), "utf8");
    if (!source.includes(`from"./${e.file}"`)) continue;
    if (allowed.some((pattern) => pattern.test(file))) continue;
    laxExceptions.push({ file, chunk: e.file, size: e.size });
  }
}

if (laxExceptions.length) {
  console.error(
    "[bundle-size] FAILED — a chunk documented as lazy is statically imported:"
  );
  for (const l of laxExceptions) {
    console.error(`  - ${l.file} statically imports ${l.chunk} (${fmt(l.size)})`);
  }
  console.error(
    "  That puts the whole chunk on that page's critical path, which is the " +
      "opposite of what its exception claims. Reach it with a dynamic " +
      "import(), or — if the import is legitimate — add the importer to " +
      "staticImporters in this file and correct the reason."
  );
  process.exit(1);
}

if (violations.length) {
  console.error("[bundle-size] FAILED — chunks over budget:");
  for (const v of violations) {
    console.error(
      `  - ${v.file}: ${fmt(v.size)} (budget ${fmt(v.budget)})`
    );
  }
  console.error(
    "Code-split with dynamic import(), adjust manualChunks, or — if " +
      "intentionally large and lazy — add a documented exception."
  );
  process.exit(1);
}

console.log(
  `[bundle-size] OK — ${files.length} chunks within budget` +
    (exempted.length ? ` (${exempted.length} documented exception(s))` : "")
);
