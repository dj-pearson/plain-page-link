#!/usr/bin/env node
/**
 * Boot the production edge-functions router and give every function one
 * unauthenticated POST.
 *
 * US-204. CI type-checks the 84 functions; until iteration 6 of this loop
 * nothing had ever run one. Running them immediately found what `deno check`
 * cannot see:
 *
 *   - US-199: importing a function that calls serve() at module scope raised
 *     AddrInUse on the port the router holds, and the unhandled rejection ended
 *     the process. One POST to /submit-lead took down all 84.
 *   - US-203: a function whose every response path threw inside the error
 *     handler, so it could not answer at all.
 *   - US-204: 20 of 84 answering 5xx to a request that was simply missing its
 *     credentials.
 *
 * The three assertions below are exactly those three findings, and they need no
 * database: a function that reaches its own auth or validation check has already
 * proved it imports, registers a handler and returns a Response.
 *
 * Usage: node scripts/smoke-edge-functions.mjs [--deno <path>]
 */

import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = Number(process.env.SMOKE_PORT ?? 8787);
const BASE = `http://127.0.0.1:${PORT}`;
const denoIndex = process.argv.indexOf('--deno');
const DENO = denoIndex > -1 ? process.argv[denoIndex + 1] : 'deno';

/**
 * Statuses a function may answer an unauthenticated `{}` POST with.
 *
 * 4xx is the point: the function ran, decided the caller was at fault, and said
 * so. 5xx means either it could not run or it blamed itself for the caller's
 * mistake. 503 is allowed only for health-check, whose job is to report that a
 * dependency is down — there is no database here, so that is the true answer.
 */
const ALLOWED_5XX = new Set(['health-check']);

/**
 * Functions that legitimately answer 5xx because a SERVER-side secret is
 * absent. These are configuration faults, not caller faults, and 500 is the
 * honest status for them. They are named rather than pattern-matched so that a
 * new one has to be justified here.
 */
const MISSING_SERVER_CONFIG = new Set([
  'generate-article',
  'generate-social-post',
  'generate-marketing-post',
]);

const log = (...args) => console.log('[smoke]', ...args);

async function main() {
  const root = await mkdtemp(join(tmpdir(), 'edge-smoke-'));
  let server;
  try {
    // The image's layout, so the router resolves ./functions the same way.
    await cp('supabase/functions', join(root, 'functions'), {
      recursive: true,
      filter: (src) => !src.includes('node_modules'),
    });
    await cp('edge-functions-server.ts', join(root, 'server.ts'));
    await cp('edge-functions-serve-shim.ts', join(root, 'serve-shim.ts'));
    await cp('edge-functions-import-map.json', join(root, 'import_map.json'));
    server = spawn(
      DENO,
      ['run', '--allow-net', '--allow-env', '--allow-read', '--import-map=./import_map.json', 'server.ts'],
      {
        cwd: root,
        env: {
          ...process.env,
          // Reachable-but-wrong, so a function that tries to talk to Supabase
          // fails fast instead of hanging on DNS.
          SUPABASE_URL: `http://127.0.0.1:${PORT + 1}`,
          SUPABASE_ANON_KEY: 'smoke-anon',
          SUPABASE_SERVICE_ROLE_KEY: 'smoke-service',
          PORT: String(PORT),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    const serverLog = [];
    server.stdout.on('data', (d) => serverLog.push(String(d)));
    server.stderr.on('data', (d) => serverLog.push(String(d)));

    const health = await waitForHealth();
    log(`router up, ${health.functions} functions discovered`);
    if (health.functions < 80) {
      throw new Error(`Only ${health.functions} functions discovered; expected the full set.`);
    }

    const failures = [];
    for (const name of health.available) {
      let status;
      let body;
      try {
        const response = await fetch(`${BASE}/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          signal: AbortSignal.timeout(90_000),
        });
        status = response.status;
        body = (await response.text()).slice(0, 200);
      } catch (error) {
        failures.push(`${name}: no response (${error.message})`);
        continue;
      }

      if (status < 500) continue;
      if (ALLOWED_5XX.has(name)) continue;
      if (MISSING_SERVER_CONFIG.has(name)) continue;
      failures.push(`${name}: ${status} ${body}`);
    }

    // The process must still be alive. US-199's crash returned a 500 for the
    // request that caused it and then killed the router, so a per-request check
    // alone would have passed.
    const after = await fetch(`${BASE}/health`).catch(() => null);
    if (!after?.ok) {
      throw new Error('The router did not survive the sweep.');
    }

    if (failures.length > 0) {
      console.error('\n[smoke] functions answering 5xx to an unauthenticated POST:');
      for (const failure of failures) console.error(`  ${failure}`);
      console.error(
        '\nA 5xx here means the function either could not run, or reported the ' +
          "caller's own missing credentials as a server fault. See _shared/http-error.ts."
      );
      console.error(`\n--- router log ---\n${serverLog.join('').slice(-4000)}`);
      // Not process.exit: that races the finally below, and a router left
      // holding the port makes the NEXT run fail for an unrelated reason. The
      // first draft of this script did exactly that and reported "the router
      // did not survive the sweep" on a tree that was fine.
      process.exitCode = 1;
      return;
    }

    log(`OK — ${health.available.length} functions, none answering 5xx.`);
  } finally {
    if (server && server.exitCode === null) {
      const exited = new Promise((resolve) => server.once('exit', resolve));
      server.kill('SIGKILL');
      await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))]);
    }
    await rm(root, { recursive: true, force: true });
  }
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return await response.json();
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('The router never became healthy.');
}

main().catch((error) => {
  console.error(`[smoke] ${error.message}`);
  process.exit(1);
});
