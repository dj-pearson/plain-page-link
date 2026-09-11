# Deploying edge functions

Two runtimes exist. Only one is reachable from the internet, and it is not the
one this document used to name.

## What actually serves the functions

`https://functions.agentbio.net` is Traefik-routed to the **Coolify application
`isswgo8w4gs44ogk48wgsc88`**, which runs `edge-functions-server.ts` (built from
the root `Dockerfile`) as `deno run ... server.ts`. `.env.example` sets
`VITE_FUNCTIONS_URL` to that host, so it is what the client reaches.

Measured 2026-09-10:

| Request | Result |
| --- | --- |
| `GET functions.agentbio.net/<unknown>` | `404 {"error":"Function not found","available":[...15]}` |
| `GET api.agentbio.net/functions/v1/<any name>` | `500 InvalidWorkerCreation: worker boot error: failed to read path` |

The Supabase **edge runtime** container (`supabase-edge-functions-rwwccs4k8o8kog4s0w4ggggg`)
carries no Traefik labels, so it is reachable only through Kong at
`api.agentbio.net/functions/v1/`. Its volume
(`/data/coolify/services/rwwccs4k8o8kog4s0w4ggggg/volumes/functions`) holds
`main/` and `hello/` and nothing else. The 88 directories under
`supabase/functions/` have never been deployed into it, which is why every name
returns the same 500, including names that exist in this repo.

So `supabase functions deploy <name>` is the right command for a runtime that is
not currently serving anything, and running it does not make that runtime
reachable at `functions.agentbio.net`.

## Deploying a change today

Redeploy the Coolify application. The build needs the root `Dockerfile`,
`edge-functions-server.ts` and `.dockerignore`; all three were deleted in
US-122 and restored afterwards, which left the application unbuildable for
eight days. The build also needs `edge-functions-serve-shim.ts` and
`edge-functions-import-map.json` (US-199).

A directory under `supabase/functions/` with an `index.ts` is served. There is
no list to add a name to: the router reads the directory at startup, which is
the same rule Supabase's own runtime uses.

Environment variables on that application are marked build-time, so a
**restart does not pick up a changed value and a deploy is required**. This is
how the 2026-09-10 key rotation left the app holding a retired `service_role`
key while the Supabase stack had already moved to the new JWT secret.

## What US-122 identified, and what US-199 did about it

US-122 was right that the router served far fewer functions than the app calls.
It carried a literal `FUNCTIONS_MAP` of **15** names while the app calls **40**,
so **29 answered 404** — among them `gdpr-export` and `gdpr-deletion` (the
subject-access and erasure paths), `create-portal-session`,
`create-stripe-customer` and `report-stripe-usage` (billing), `verify-mfa`,
`disable-mfa`, `login-security`, `get-sessions` and `revoke-session` (account
security), `sso-initiate` and `sso-callback`, `submit-review`, `teams`,
`api-keys` and `send-welcome-email`. One entry, `submit-contact`, named a
function that does not exist in the repo at all.

What did not follow from it is the conclusion US-122 drew: that because login
and billing were not reported broken, the router could not be what serves
production, and Supabase's own runtime must be. No request was issued to check.
The router is what serves production, the functions it omitted were genuinely
unserved, and the runtime named as the replacement was empty. Deleting the build
path on that reasoning removed the only way to rebuild the container that was
actually live.

The router now discovers all 84 functions from disk, so there is nothing to
forget to add.

### The crash, which was worse than the 404s

`edge-functions-server.ts` imports each function with a dynamic `import()`
in-process, and invoked the result as `module.default(req)`. Only **5** of the
84 functions export a default; the other **79** call `serve()` or `Deno.serve()`
at module top level, because that is what Supabase's runtime expects.

Reproduced on Deno 1.42.0 — the version the `Dockerfile` pins — against the
image's own layout, `POST /submit-lead` did two things:

    Error executing function submit-lead: TypeError: module.default is not a function
    error: Uncaught (in promise) AddrInUse: Address already in use (os error 98)
        at serve (https://deno.land/std@0.168.0/http/server.ts:605:20)
        at .../functions/submit-lead/index.ts:59:1

The 500 was returned. Then the unawaited `serve()` promise rejected with
AddrInUse — the module was trying to bind port 8000, which the router holds —
and an unhandled rejection ends a Deno process. `GET /health` stopped answering.
**One unauthenticated POST to the public lead form took down all 84 functions**,
and the next one would take down the restarted container again.

US-199 closes it three ways:

1. `edge-functions-import-map.json` points
   `https://deno.land/std@0.168.0/http/server.ts` at
   `edge-functions-serve-shim.ts`, whose `serve()` records the handler instead
   of listening. Both the `deno cache` and the `deno run` step need
   `--import-map`; caching without it resolves the real module and the shim is
   never used.
2. `Deno.serve` is intercepted for the duration of each import and restored
   after, covering `google-indexing` and `trigger-rebuild`.
3. An `unhandledrejection` listener keeps one function's mistake from ending the
   process.

Verified on the same Deno version and layout: 84 functions discovered,
`POST /submit-lead` returns submit-lead's own error response, `trigger-rebuild`
returns its own `401`, `create-portal-session` its own `400`, and `/health`
still answers `200` afterwards.

## Redundant build files, correctly removed and not restored

`edge-functions.Dockerfile`, `Dockerfile.gitclone`,
`docker-compose.edge-functions.yml` and `nixpacks.toml` were four more ways to
build the same image. They stay deleted. Only the root `Dockerfile` is wired to
the Coolify application.

The `COOLIFY_*`, `EDGE_FUNCTIONS_*` and `DOCKERFILE_*` documents in
`docs/archive/` record what someone tried on a particular day, not how this is
deployed.

## If a function 404s in production

1. Confirm `supabase/functions/<name>/index.ts` exists. Since US-199 that is
   the whole rule — `GET functions.agentbio.net/health` lists what the running
   container discovered, so compare that with the repo.
2. If it exists on disk but not in `/health`, the container is running an older
   image. Redeploy; a restart will not do it (build-time env vars, above).
3. Check the application's logs in Coolify. A function that fails to import is
   served as a 500 or drops the connection, not as a 404.

`supabase/functions/deno.json` holds the import map. CI type-checks every
function with `deno check` in `.github/workflows/verify-backend.yml`.
