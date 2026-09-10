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
eight days. A function that is not listed in `FUNCTIONS_MAP` is not served,
whatever exists on disk.

Environment variables on that application are marked build-time, so a
**restart does not pick up a changed value and a deploy is required**. This is
how the 2026-09-10 key rotation left the app holding a retired `service_role`
key while the Supabase stack had already moved to the new JWT secret.

## What is still wrong, and was correctly identified in US-122

The app calls **34** distinct edge functions. **25 are not in `FUNCTIONS_MAP`**,
including `login-security`, `pii-crypto`, `submit-review`, `gdpr-deletion`,
`create-portal-session` and `send-welcome-email`. Those calls get the 404 above.
That finding stands and is worth fixing.

What did not follow from it is the conclusion US-122 drew: that because login
and billing were not reported broken, the router could not be what serves
production, and Supabase's own runtime must be. No request was issued to check.
The router is what serves production, the functions it omits are genuinely
unserved, and the runtime named as the replacement was empty. Deleting the build
path on that reasoning removed the only way to rebuild the container that was
actually live.

`edge-functions-server.ts` also imports each function with a dynamic `import()`
in-process. Supabase functions call `serve()` at module top level, so importing
one starts a second listener on the port the router already holds.
`GET functions.agentbio.net/submit-contact` returns `502` rather than the
router's own caught-error `500`, which is consistent with that. Verify before
building on the current design.

## Redundant build files, correctly removed and not restored

`edge-functions.Dockerfile`, `Dockerfile.gitclone`,
`docker-compose.edge-functions.yml` and `nixpacks.toml` were four more ways to
build the same image. They stay deleted. Only the root `Dockerfile` is wired to
the Coolify application.

The `COOLIFY_*`, `EDGE_FUNCTIONS_*` and `DOCKERFILE_*` documents in
`docs/archive/` record what someone tried on a particular day, not how this is
deployed.

## If a function 404s in production

1. Check whether the name is in `FUNCTIONS_MAP` in `edge-functions-server.ts`.
   If it is absent, that is the 404 and no amount of deploying will change it.
2. Confirm `supabase/functions/<name>/index.ts` exists.
3. Check the application's logs in Coolify. A function that fails to import is
   served as a 500 or drops the connection, not as a 404.

`supabase/functions/deno.json` holds the import map. CI type-checks every
function with `deno check` in `.github/workflows/verify-backend.yml`.
