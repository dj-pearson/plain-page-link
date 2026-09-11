/**
 * US-199: what the production edge-functions router can actually reach.
 *
 * functions.agentbio.net is Traefik-routed to the Coolify application that runs
 * edge-functions-server.ts — established by measurement in ce75af6, not by
 * inference. So the set of functions that file can serve IS the set of
 * functions this platform has, and nothing checked that against the set the app
 * calls. It carried a literal map of 15 names while the app called 40.
 *
 * These tests are the check that was missing. They read the router and the
 * callers rather than a list someone maintains alongside them.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FUNCTIONS_DIR = join(ROOT, 'supabase/functions');

/** A directory under supabase/functions with an index.ts is a deployed function. */
const deployedFunctions = new Set(
  readdirSync(FUNCTIONS_DIR).filter(
    (name) => !name.startsWith('_') && existsSync(join(FUNCTIONS_DIR, name, 'index.ts'))
  )
);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'node_modules') sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry) && !entry.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Every edge-function name the app asks for, by reading the call sites.
 *
 * Covers callEdgeFunction('x'), functions.invoke('x') and the two places
 * useAuthStore builds a URL as `${functionsUrl}/oauth-proxy`.
 */
const CALL_SITE =
  /(?:callEdgeFunction|functions\.invoke|invoke)\s*(?:<[^>]*>)?\s*\(\s*['"]([a-z0-9][a-z0-9-]*)['"]/g;
const URL_SITE = /\$\{[A-Za-z_.]*[Ff]unctions[A-Za-z_]*\}\/([a-z0-9][a-z0-9-]*)/g;

const calledFunctions = new Set<string>();
for (const file of sourceFiles(join(ROOT, 'src'))) {
  const source = readFileSync(file, 'utf-8');
  for (const match of source.matchAll(CALL_SITE)) calledFunctions.add(match[1]);
  for (const match of source.matchAll(URL_SITE)) calledFunctions.add(match[1]);
}

const router = readFileSync(join(ROOT, 'edge-functions-server.ts'), 'utf-8');

describe('edge-function routing (US-199)', () => {
  it('found the call sites at all', () => {
    // A regex that stops matching would make every assertion below vacuous.
    expect(calledFunctions.size).toBeGreaterThan(30);
    expect(calledFunctions.has('submit-lead')).toBe(true);
    expect(calledFunctions.has('oauth-proxy')).toBe(true);
  });

  it('routes every function the app calls', () => {
    // Before US-199 this listed 29, including gdpr-export, gdpr-deletion,
    // create-portal-session, verify-mfa and submit-review — every one of them
    // answering 404 "Function not found" in production.
    //
    // `reachable` is what the ROUTER can serve, not what is on disk: a literal
    // FUNCTIONS_MAP caps it at the names in that map however many functions
    // exist, and reading disk instead would make this test pass against the
    // implementation it was written to catch.
    const literalMap = router.match(/const FUNCTIONS_MAP[^{]*\{([\s\S]*?)\n\};/);
    const reachable = literalMap
      ? new Set([...literalMap[1].matchAll(/'([a-z0-9-]+)':/g)].map((m) => m[1]))
      : deployedFunctions;

    const unreachable = [...calledFunctions].filter((name) => !reachable.has(name));
    expect(unreachable).toEqual([]);
  });

  it('routes nothing that does not exist', () => {
    // The old map's 'submit-contact' named a directory that is not in the repo.
    // Its entry would have thrown on import rather than 404ing, which is the
    // more confusing of the two failures.
    const literalMap = router.match(/const FUNCTIONS_MAP[^{]*\{([\s\S]*?)\n\};/);
    const routed = literalMap
      ? [...literalMap[1].matchAll(/'([a-z0-9-]+)':/g)].map((m) => m[1])
      : [...deployedFunctions];
    expect(routed.filter((name) => !deployedFunctions.has(name))).toEqual([]);
  });

  it('discovers functions from disk instead of a hand-maintained map', () => {
    // The defect was not the 15 names. It was that a person had to remember to
    // add the 16th, and for 29 functions nobody did.
    // The declaration, not the word: the comment explains what was removed.
    expect(router).not.toMatch(/const FUNCTIONS_MAP/);
    expect(router).toMatch(/Deno\.readDir/);
  });

  it('gives every function a handler the router can find', () => {
    // Three shapes exist in this repo. A function in none of them resolves to
    // no handler at runtime, which is a 500 nothing catches at build time.
    const unservable: string[] = [];
    for (const name of deployedFunctions) {
      const source = readFileSync(join(FUNCTIONS_DIR, name, 'index.ts'), 'utf-8');
      const registers =
        /^\s*serve\s*\(/m.test(source) ||
        /^\s*Deno\.serve\s*\(/m.test(source) ||
        /export\s+default/.test(source);
      if (!registers) unservable.push(name);
    }
    expect(unservable).toEqual([]);
  });

  it('shims the std serve a top-level function registration would bind', () => {
    // Without this, importing one of the 77 functions that call serve() at
    // module scope raises AddrInUse on the port the router already holds — and
    // the unhandled rejection ends the process, taking all 84 down with it.
    const shim = readFileSync(join(ROOT, 'edge-functions-serve-shim.ts'), 'utf-8');
    expect(shim).toMatch(/export function serve/);

    const importMap = JSON.parse(
      readFileSync(join(ROOT, 'edge-functions-import-map.json'), 'utf-8')
    );
    const stdImports = new Set(
      readdirSync(FUNCTIONS_DIR)
        .filter((name) => existsSync(join(FUNCTIONS_DIR, name, 'index.ts')))
        .flatMap(
          (name) =>
            readFileSync(join(FUNCTIONS_DIR, name, 'index.ts'), 'utf-8').match(
              /https:\/\/deno\.land\/std@[0-9.]+\/http\/server\.ts/g
            ) ?? []
        )
    );
    // Every std version a function imports needs its own entry: an import map
    // key is an exact specifier, so a function bumping to std@0.177.0 would
    // silently go back to binding the port.
    for (const specifier of stdImports) {
      expect(importMap.imports[specifier]).toBe('./serve-shim.ts');
    }
    expect(stdImports.size).toBeGreaterThan(0);
  });

  it('survives one function failing', () => {
    expect(router).toMatch(/unhandledrejection/);
  });

  it('ships the shim and the import map into the image', () => {
    const dockerfile = readFileSync(join(ROOT, 'Dockerfile'), 'utf-8');
    expect(dockerfile).toMatch(/COPY edge-functions-serve-shim\.ts \.\/serve-shim\.ts/);
    expect(dockerfile).toMatch(/COPY edge-functions-import-map\.json \.\/import_map\.json/);
    // Both the cache step and the run step need it; caching without it resolves
    // the real std module and the shim is never fetched.
    expect(dockerfile.match(/--import-map=\.\/import_map\.json/g)?.length).toBe(2);
  });
});
