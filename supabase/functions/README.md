# Edge functions

Every directory here (except `_shared/`) is one Deno function. Production runs
them all from one Coolify app, `functions.agentbio.net`, built from the root
`Dockerfile` and served by `edge-functions-server.ts`.

- Deploying, secrets and smoke tests: `docs/deploy/edge-functions.md`
- Database schema: `supabase/migrations/` and `src/integrations/supabase/types.ts`
  (authoritative — do not copy SQL from older docs)

There are no push-notification functions. Push was removed on 2026-11-07.
