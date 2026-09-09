# Supabase keys, and how to rotate them

Replaces `SUPABASE_KEYS_GUIDE.md` and `SUPABASE_KEYS_QUICK_ANSWER.md`, which
sat in the repository root saying much the same thing twice. Both were deleted
in US-165: between them they published this deployment's live `anon` and
`service_role` keys, annotated "These are valid and working!", in a public
repository.

**No key, password or secret value belongs in this file, or in any file in this
repository.** Name where a value is stored; never write the value down. The
`npm run test:run -- src/secret-scan.test.ts` guard fails the build if one
reappears.

## The three values

Self-hosted Supabase derives two of its three key values from the third.

| Value | What it is | Who may hold it |
| --- | --- | --- |
| `JWT_SECRET` | The HS256 signing secret. Both keys below are signed with it. | The server only — Coolify environment variables. Never CI, never the client. |
| `SUPABASE_ANON_KEY` | A JWT with `role: anon`, signed by `JWT_SECRET`. | Public. It ships inside the frontend bundle by design, and is only as safe as the RLS policies behind it. |
| `SUPABASE_SERVICE_ROLE_KEY` | A JWT with `role: service_role`, signed by `JWT_SECRET`. | The server only. It **bypasses every RLS policy** — it is equivalent to the database superuser. Edge functions read it from the environment. |

Because the two keys are derived, they are not independently revocable: there
is no per-key revocation list. Rotating either one means rotating `JWT_SECRET`
and reissuing both. That is the whole reason exposure of a `service_role` key
is an incident rather than an inconvenience.

The default `exp` of `4920713580` is the year 2125, so an exposed key does not
expire its way out of the problem.

## Where the values actually live

- **Server / edge functions** — Coolify environment variables on the Supabase
  service. This is the source of truth.
- **Frontend build** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, set on
  the Cloudflare Pages project. Only the `anon` key. `src/integrations/supabase/client.ts`
  throws at startup if either is absent.
- **CI** — placeholders only. `.github/workflows/ci.yml` builds against
  `https://placeholder.supabase.co`; it reaches no network and needs no real key.
- **Locally** — `.env.local`, which is gitignored. Copy `.env.example`.

See `docs/setup/variables.md` for the full environment variable list.

## Rotating

Rotation invalidates every issued token, so every signed-in user is logged out
and every service holding the old key stops working until it is updated. Do all
of it in one sitting.

1. **Generate a new secret and the two keys it implies:**

   ```bash
   node scripts/generate-supabase-keys.js
   ```

   It prints a fresh random `JWT_SECRET` and the `anon` and `service_role` JWTs
   signed with it. Pass an existing secret as the first argument to reissue keys
   without changing the secret — which is *not* what you want when rotating in
   response to exposure.

   Its output is secret material. Do not paste it into a document, a commit, an
   issue, or a chat log.

2. **Set `JWT_SECRET`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`** on
   the Coolify Supabase service, then restart it so Kong and GoTrue pick them up.

3. **Update `VITE_SUPABASE_ANON_KEY`** on the Cloudflare Pages project and
   redeploy the frontend. Until this is done the live site cannot reach the API.

4. **Update any other holder of the old `service_role` key** — Make.com
   scenarios, GitHub Actions secrets, anything in `docs/setup/MAKE_COM_INTEGRATION.md`.

5. **Verify** the site loads, a sign-in works, and a public lead form submits.

## If a key was exposed

Rotating is necessary but not sufficient. A `service_role` key that was public
for any length of time could have read or written every row in every table,
`leads` and `profiles` included, without leaving an RLS trail. After rotating:

- Review `audit_logs` and `login_attempts` for the exposure window.
- Check Postgres logs for connections from unfamiliar addresses.
- If personal data may have been reached, the breach-notification duties in
  `SECURITY.md` apply.

Removing a secret from the working tree does not remove it from git history, and
on a public repository it does not remove it from clones, forks or the caches of
anyone who was watching. Assume anything ever committed is permanently public,
and rotate on that basis.
