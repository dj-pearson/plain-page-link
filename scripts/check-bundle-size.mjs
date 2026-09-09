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

const fmt = (n) => `${(n / KB).toFixed(1)} KB`;

// chunk name prefix -> reason. The budget allowlist, and nothing else.
// Kept tiny on purpose.
const EXCEPTIONS = {
  "three-vendor":
    "Three.js/R3F — lazy-loaded only on 3D hero sections, never on first paint",
};

// chunk name prefix -> the ONLY chunks allowed to `import ... from "./<chunk>"`.
// Anything else must reach it through a dynamic import, or not at all.
//
// This exists because "lazy-loaded, never on first paint" sat in the exception
// above as prose for months while being false, and prose asserts nothing
// (US-163). Vite's __vitePreload helper is a virtual module, so Rollup filed it
// into three-vendor; every chunk that lazy-loads anything then statically
// imported 797 KB of Three.js to obtain a 200-byte function, the ENTRY chunk
// among them. Every visitor to every route paid for it.
//
// US-164 was the same shape one layer down. clsx has no home either, and
// recharts depends on it, so Rollup put it in charts-vendor and the entry chunk
// imported 394 KB of dashboard charting library to get cn(). @babel/runtime's
// helpers landed there too, which is how loading a 3D profile theme pulled in
// recharts. Both are now named in vite.config.ts's VENDOR_CHUNKS table.
//
// The rule generalises: a tiny shared module with no assigned home gets adopted
// by whichever large chunk happens to want it, and every consumer then pays for
// the whole thing. It is invisible in the chunk listing — sizes look fine — and
// only shows up in who imports what. So check who imports what.
const MUST_STAY_LAZY = {
  "three-vendor": [
    /^FloatingGeometry-/,
    /^GradientMesh-/,
    /^ThreeDBackground-/,
    /^Hero3D/,
  ],
  // Dashboard and admin only. Never the entry, never a public page.
  "charts-vendor": [
    /^Analytics-/,
    /^HealthDashboard-/,
    /^SEOManager-/,
    /^SearchAnalyticsDashboard-/,
    /^MLLeadScoringDashboard-/,
  ],
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

// Hold every must-stay-lazy chunk to its declared importers. A static import
// renders as `from"./chunk.js"` and a dynamic one as `import("./chunk.js")`, so
// matching on `from` picks up exactly the imports that put a chunk on a
// critical path.
const sources = new Map(
  files.map((f) => [f, readFileSync(join(ASSETS_DIR, f), "utf8")])
);

const leaks = [];
for (const [prefix, allowed] of Object.entries(MUST_STAY_LAZY)) {
  const chunk = files.find((f) => f.startsWith(`${prefix}-`));
  if (!chunk) continue;
  const size = statSync(join(ASSETS_DIR, chunk)).size;

  for (const [file, source] of sources) {
    if (file === chunk) continue;
    if (!source.includes(`from"./${chunk}"`)) continue;
    if (allowed.some((pattern) => pattern.test(file))) continue;
    leaks.push({ file, chunk, size });
  }
}

if (leaks.length) {
  console.error(
    "[bundle-size] FAILED — a chunk that must stay lazy is statically imported:"
  );
  for (const l of leaks) {
    console.error(`  - ${l.file} statically imports ${l.chunk} (${fmt(l.size)})`);
  }
  console.error(
    "  That puts the whole chunk on that page's critical path. Usually the " +
      "cause is a tiny shared module with no home — a helper, clsx, a babel " +
      "runtime import — that Rollup filed into the big chunk; name it in " +
      "VENDOR_CHUNKS in vite.config.ts. If the import is genuinely legitimate, " +
      "add the importer to MUST_STAY_LAZY in this file."
  );
  process.exit(1);
}

const violations = [];
const exempted = [];

for (const file of files) {
  const size = statSync(join(ASSETS_DIR, file)).size;
  const budget = budgetFor(file);
  if (size <= budget) continue;

  const ex = exceptionFor(file);
  if (ex) {
    exempted.push({ file, size, reason: EXCEPTIONS[ex] });
  } else {
    violations.push({ file, size, budget });
  }
}


if (exempted.length) {
  console.log("[bundle-size] Documented exceptions (over budget, allowed):");
  for (const e of exempted) {
    console.log(`  - ${e.file} (${fmt(e.size)}) — ${e.reason}`);
  }
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
