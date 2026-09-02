# Deploying edge functions

There is one path. This document replaces four that contradicted each other.

## What actually serves the functions

Self-hosted Supabase runs its own **edge runtime** container, which serves
everything under `supabase/functions/` at `/functions/v1/<name>`. That is what
`supabase.functions.invoke('submit-lead', …)` reaches, via the
`VITE_FUNCTIONS_URL` origin (`https://functions.agentbio.net`).

Deploy a function by getting its directory onto that container and restarting
it — the Supabase CLI's `supabase functions deploy <name>` does this, as does
any process that syncs `supabase/functions/` into the runtime's volume.

Nothing else in this repository is involved.

## What was here before, and why it is gone

`edge-functions-server.ts` was a hand-written Deno router with a `FUNCTIONS_MAP`
listing **15** of the 86 functions in `supabase/functions/`. Four build
configurations existed to ship it:

| File | What it did |
| --- | --- |
| `Dockerfile` | `deno cache edge-functions-server.ts`, serve on 8000 |
| `edge-functions.Dockerfile` | the same, under a different filename |
| `Dockerfile.gitclone` | the same, but cloning the repo inside the image "as a workaround for Coolify source issues" |
| `docker-compose.edge-functions.yml` | composed the above |
| `nixpacks.toml` | `deno run … edge-functions-server.ts` |

All five are deleted, along with the router and the two `migrate-*-edge-functions.ps1`
scripts, because the router cannot be what serves production:

The app calls **34** distinct edge functions. **25 of them are not in that map** —
including `login-security`, `pii-crypto`, `submit-review`, `gdpr-deletion`,
`create-portal-session` and `send-welcome-email`. If that server were live,
three quarters of the app's edge-function calls would return 404, and login,
lead decryption and billing would all be broken. They are not. So the runtime
serving production is Supabase's own, and this was a parallel path that had been
documented as though it were real (US-122).

The six `COOLIFY_*`, `EDGE_FUNCTIONS_*` and `DOCKERFILE_*` documents describing
those paths are in `docs/archive/` — they record what someone tried on a
particular day, not how this is deployed.

## If a function 404s in production

1. Confirm the directory exists under `supabase/functions/<name>/index.ts`.
2. Confirm it reached the edge runtime container (a deploy step was missed, or
   the volume did not sync).
3. Check the runtime's logs — a function that fails to import (a bad specifier,
   a missing `_shared` file) is served as an error, not as a 404.

`supabase/functions/deno.json` holds the import map the runtime uses. CI
type-checks every function with `deno check` in
`.github/workflows/verify-backend.yml`.
