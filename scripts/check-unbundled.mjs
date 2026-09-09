/**
 * Which modules under src/ never reach the browser.
 *
 * US-172. Two iterations of this loop ran aground on the same thing: US-171
 * found src/lib/mortgageCalculator.ts — 378 lines with no caller — only by
 * following an unrelated lint warning into it, and the iteration after found
 * src/components/mobile/VoiceInput.tsx the same way. Both times the module was
 * documented or advertised as a feature. Nothing in the repository could answer
 * "is this code reachable?", so the answer arrived by accident, twice.
 *
 * WHY THE BUNDLER AND NOT A GREP. A grep for the filename finds importers, not
 * reachability: usePullToRefresh IS imported — by PullToRefresh, which is
 * imported by nothing. The whole chain is dead and every link in it looks used.
 * A hand-written import walker gets this wrong too; the first draft of this
 * script reported 260 dead modules including ones that are plainly live,
 * because `React.lazy(() => import(...))` and multi-line imports defeat a
 * regex. Rollup already computed the real graph during the build, so this asks
 * Rollup.
 *
 * WHAT IT DOES NOT COUNT. A module exporting only types is erased at compile
 * time and never appears in a bundle — that is correct, not dead. Counting
 * those would have inflated the first honest number from 63 to 84. And several
 * modules are entry points for something other than the app: the prerender
 * script, the test suites. Those are allowlisted by path, each with a reason.
 *
 * This does not delete anything. It reports, and it ratchets: the count may
 * fall, never rise. US-173 took the first 11: five superseded
 * locations/*Agents.tsx pages (DynamicLocationPage replaced them), the whole
 * dead pull-to-refresh and mobile chain, and mortgageCalculator.ts. 61 -> 50.
 *
 * A caution on reading the list: several entries are imported by their own test
 * and by nothing else. That still counts as unreachable, because a module whose
 * only consumer is its test is not shipping anything — but it means "delete it"
 * and "wire it up" are both live options, and the list cannot tell you which.
 */
import { build } from 'vite';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/**
 * The most modules that may be unreachable. Lower it when you delete some;
 * never raise it. A new unreachable module is either dead on arrival or wired
 * up wrong, and both are worth a moment before merging.
 */
const BUDGET = 50;

/**
 * Reachable from something other than the app, each with what reaches it.
 * A path here is a claim someone checked, so keep the reason.
 */
const NON_APP_ENTRY_POINTS = new Map([
  ['src/config/prerender-routes.ts', 'scripts/prerender.mts reads the route list'],
  ['src/integrations/supabase/types.ts', 'generated types; scripts/gen-supabase-types.mjs owns it'],
]);

/** A module with no runtime export is erased by tsc and cannot be in a bundle. */
const HAS_RUNTIME_EXPORT = /^\s*export\s+(?:default\s+|async\s+)?(?:const|let|var|function|class)\b/m;

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '__snapshots__') sourceFiles(full, out);
    } else if (
      /\.(ts|tsx)$/.test(entry) &&
      !entry.includes('.test.') &&
      !entry.endsWith('.d.ts') &&
      !full.includes(`${join('src', 'test')}`)
    ) {
      out.push(full);
    }
  }
  return out;
}

async function bundledModuleIds() {
  const ids = new Set();
  await build({
    root: ROOT,
    logLevel: 'error',
    build: { write: false, sourcemap: false },
    plugins: [
      {
        name: 'collect-module-ids',
        generateBundle() {
          for (const id of this.getModuleIds()) {
            if (id.startsWith(ROOT) && !id.includes('node_modules')) ids.add(id.split('?')[0]);
          }
        },
      },
    ],
  });
  return ids;
}

const bundled = await bundledModuleIds();
const all = sourceFiles(SRC);

const typeOnly = [];
const allowlisted = [];
const unreachable = [];

for (const file of all) {
  if (bundled.has(file)) continue;
  const rel = file.slice(ROOT.length + 1).split('\\').join('/');

  if (!HAS_RUNTIME_EXPORT.test(readFileSync(file, 'utf8'))) {
    typeOnly.push(rel);
  } else if (NON_APP_ENTRY_POINTS.has(rel)) {
    allowlisted.push(rel);
  } else {
    unreachable.push(rel);
  }
}

unreachable.sort();

console.log(`[unbundled] ${all.length} source modules, ${bundled.size} in the bundle graph`);
console.log(`[unbundled] ${typeOnly.length} type-only (erased at compile time — expected)`);
console.log(`[unbundled] ${allowlisted.length} non-app entry points (allowlisted)`);
console.log(`[unbundled] ${unreachable.length} reach no browser (budget ${BUDGET})\n`);

for (const rel of unreachable) console.log(`  ${rel}`);

if (unreachable.length > BUDGET) {
  console.error(
    `\n[unbundled] ${unreachable.length} unreachable modules, budget is ${BUDGET}.\n` +
      `            A module that reaches no browser is dead code or a wiring mistake.\n` +
      `            If it is an entry point for a script or a test, add it to\n` +
      `            NON_APP_ENTRY_POINTS with what reaches it. Do NOT raise the budget\n` +
      `            to make this pass.`
  );
  process.exit(1);
}

if (unreachable.length < BUDGET) {
  console.log(
    `\n[unbundled] Below budget (${unreachable.length} < ${BUDGET}). Lower BUDGET in\n` +
      `            scripts/check-unbundled.mjs to lock the improvement in.`
  );
}
