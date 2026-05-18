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
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ASSETS_DIR = join(process.cwd(), "dist", "assets");
const KB = 1024;
const VENDOR_BUDGET = 600 * KB;
const DEFAULT_BUDGET = 500 * KB;

// chunk name prefix -> reason. Kept tiny on purpose.
const EXCEPTIONS = {
  "three-vendor":
    "Three.js/R3F — lazy-loaded only on 3D hero sections, never on first paint",
};

function budgetFor(name) {
  return name.includes("-vendor") ? VENDOR_BUDGET : DEFAULT_BUDGET;
}

function exceptionFor(name) {
  return Object.keys(EXCEPTIONS).find((prefix) => name.startsWith(prefix));
}

let files;
try {
  files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".js"));
} catch {
  console.error(
    `[bundle-size] dist/assets not found. Run \`npm run build\` first.`
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

const fmt = (n) => `${(n / KB).toFixed(1)} KB`;

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
