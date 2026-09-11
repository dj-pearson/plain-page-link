// Edge Functions Server for Self-Hosted Supabase
//
// functions.agentbio.net is Traefik-routed to the Coolify application that runs
// this file (see docs/deploy/edge-functions.md and ce75af6). It is the only
// thing serving edge functions in production, which is why what it can and
// cannot reach matters as much as it does.
//
// US-199 rewrote how it finds and invokes functions. It previously carried a
// hand-written FUNCTIONS_MAP of 15 names — the app calls 40, so 29 of them
// answered 404 "Function not found", among them gdpr-export and gdpr-deletion
// (the subject-access and erasure paths), create-portal-session and
// report-stripe-usage (billing), verify-mfa / disable-mfa / get-sessions /
// revoke-session / login-security (the whole account-security surface),
// sso-initiate and sso-callback, and submit-review. One entry, submit-contact,
// named a function that does not exist.
//
// It also invoked each module as `module.default(req)`. Only 5 of the 84
// functions export a default; the other 79 register a top-level `serve()`.
// Importing one of those inside a process that already holds port 8000 raised
// AddrInUse from an unawaited promise, and an unhandled rejection ends a Deno
// process — so one POST to /submit-lead returned 500 and then killed the
// container for every other function too. See the shim for how that is closed.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { takeCapturedHandler, type Handler } from './serve-shim.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const FUNCTIONS_DIR = './functions';

/**
 * Every function on disk, discovered at startup.
 *
 * Discovery rather than a literal map is the point of US-199: a map a person
 * has to remember to edit is a map that silently stops matching the app, and
 * this one had been wrong for 29 functions without anything noticing. A
 * directory under supabase/functions/ with an index.ts IS a deployed function —
 * the same rule Supabase's own runtime uses.
 */
async function discoverFunctions(): Promise<Set<string>> {
  const names = new Set<string>();
  for await (const entry of Deno.readDir(FUNCTIONS_DIR)) {
    // _shared holds helpers, not endpoints.
    if (!entry.isDirectory || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    try {
      const stat = await Deno.stat(`${FUNCTIONS_DIR}/${entry.name}/index.ts`);
      if (stat.isFile) names.add(entry.name);
    } catch {
      // A directory with no index.ts is not an endpoint.
    }
  }
  return names;
}

const AVAILABLE = await discoverFunctions();

/** Handlers resolved so far. A module is only ever imported once. */
const handlers = new Map<string, Handler>();

/**
 * Imports are serialised.
 *
 * The shim's capture slot is process-wide, so two first-time requests to
 * different functions running concurrently could each take the other's
 * handler. Requests to already-resolved functions never touch this.
 */
let importChain: Promise<unknown> = Promise.resolve();

/**
 * Three ways a function offers its handler, all of them present in this repo:
 *   - top-level `serve(handler)` (77 functions) — captured by the shim
 *   - top-level `Deno.serve(handler)` (google-indexing, trigger-rebuild)
 *   - `export default handler` (check-username, generate-article, oauth-proxy,
 *     publish-article-to-social, pii-crypto)
 */
async function resolveHandler(name: string): Promise<Handler> {
  const cached = handlers.get(name);
  if (cached) return cached;

  const run = importChain.then(async () => {
    const already = handlers.get(name);
    if (already) return already;

    takeCapturedHandler(); // clear any residue from a failed import

    // Deno.serve binds a port the router already holds, exactly as std's serve
    // did. Intercept it for the duration of the import and put it back after,
    // so nothing else in the process sees a patched global.
    const realDenoServe = Deno.serve;
    let denoServed: Handler | null = null;
    (Deno as { serve: unknown }).serve = (
      first: Handler | Record<string, unknown>,
      second?: Handler
    ) => {
      denoServed = (typeof first === 'function' ? first : second) as Handler;
      return {
        finished: Promise.resolve(),
        shutdown: () => Promise.resolve(),
        ref: () => {},
        unref: () => {},
        addr: { transport: 'tcp', hostname: '0.0.0.0', port: 8000 },
      };
    };

    let module: { default?: unknown };
    try {
      module = await import(`${FUNCTIONS_DIR}/${name}/index.ts`);
    } finally {
      (Deno as { serve: unknown }).serve = realDenoServe;
    }

    const handler =
      takeCapturedHandler() ??
      denoServed ??
      (typeof module.default === 'function' ? (module.default as Handler) : null);

    if (!handler) {
      throw new Error(
        `${name} registered no handler: it neither calls serve()/Deno.serve() at module scope nor exports a default function`
      );
    }

    handlers.set(name, handler);
    return handler;
  });

  // Keep the chain alive whether or not this import succeeded.
  importChain = run.catch(() => {});
  return run;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handler(req: Request): Promise<Response> {
  const path = new URL(req.url).pathname;

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (path === '/' || path === '/health') {
    return json(
      {
        status: 'ok',
        functions: AVAILABLE.size,
        resolved: handlers.size,
        available: [...AVAILABLE].sort(),
      },
      200
    );
  }

  // /functions/v1/<name>, /functions/<name> and /<name> all reach the same
  // place: Kong and Traefik disagree about the prefix, and the app's
  // VITE_FUNCTIONS_URL has carried both over time.
  const functionName = path
    .replace(/^\/functions\/v1\//, '')
    .replace(/^\/functions\//, '')
    .replace(/^\//, '');

  if (!AVAILABLE.has(functionName)) {
    return json({ error: 'Function not found', available: [...AVAILABLE].sort() }, 404);
  }

  try {
    // Functions read these through Deno.env at request time.
    Deno.env.set('SUPABASE_URL', SUPABASE_URL);
    Deno.env.set('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

    const fn = await resolveHandler(functionName);
    const response = await fn(req);

    const headers = new Headers(response.headers);
    // The function's own CORS headers win: getCorsHeaders() in _shared checks
    // the origin against an allowlist, which '*' would quietly widen.
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (!headers.has(key)) headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return json(
      {
        error: 'Function execution failed',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}

/**
 * One function's mistake must not end the process.
 *
 * This is the second half of the US-199 crash: the AddrInUse rejection was not
 * thrown into the request handler, it was an unhandled rejection, and Deno
 * treats that as fatal. The shim removes that particular cause; this makes the
 * class of it survivable, because the blast radius of any single function
 * taking down all 84 is not a risk worth carrying for a log line.
 */
globalThis.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.error('[edge-functions] unhandled rejection (suppressed):', event.reason);
});

console.log(`🚀 Edge Functions Server starting on port 8000...`);
console.log(`📦 Discovered ${AVAILABLE.size} functions in ${FUNCTIONS_DIR}`);
console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

serve(handler, { port: 8000 });
