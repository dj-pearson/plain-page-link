# Regenerating `src/integrations/supabase/types.ts`

`types.ts` is the generated mirror of the database schema. When it drifts from
`supabase/migrations/`, every query against a missing table degrades to `never`,
which is what produced the long-standing red `tsc` baseline in CI: ~700 type
errors, the bulk of them `Argument of type '"some_table"' is not assignable to
parameter of type 'never'`.

## The normal path

If you have the Supabase CLI and Docker available, prefer the upstream tool:

```bash
supabase gen types typescript --linked --schema public > src/integrations/supabase/types.ts
```

## The Docker-free path

CI and sandboxed environments have no Docker, so `supabase gen types` cannot
run there (it pulls a `postgres-meta` container). `scripts/gen-supabase-types.mjs`
reads the same information straight out of the system catalogs over `psql` and
emits the same shape.

It needs a database with the migrations applied. To build a throwaway one:

```bash
# 1. Start a scratch Postgres.
initdb -D /tmp/pgdata -U postgres --auth=trust
pg_ctl -D /tmp/pgdata -o '-p 55432' start
createdb -h localhost -p 55432 -U postgres agentbio

# 2. Create the Supabase objects the migrations reference (auth.users,
#    auth.uid(), storage.*, the anon/authenticated/service_role roles, and the
#    extensions schema). See scripts/supabase-prelude.sql.
psql -h localhost -p 55432 -U postgres -d agentbio -f scripts/supabase-prelude.sql

# 3. Apply every migration. Run the loop more than once: a few migrations are
#    not order-independent (see "Known migration ordering issues" below), so a
#    second and third pass lets the schema converge.
for pass in 1 2 3; do
  for f in $(ls supabase/migrations/*.sql | sort); do
    psql -h localhost -p 55432 -U postgres -d agentbio -q -f "$f" >/dev/null 2>&1
  done
done

# 4. Generate.
npm run types:generate -- --db-url postgresql://postgres@localhost:55432/agentbio
```

`npm run types:check -- --db-url ...` exits non-zero instead of writing, for use
as a CI drift guard.

The script only rewrites the `Database` type. The helper types below it
(`Tables<>`, `TablesInsert<>`, `Enums<>`, ...) are static boilerplate and are
copied through verbatim, keyed off the `type DatabaseWithoutInternals =` marker.
`PostgrestVersion` is likewise preserved from the committed file, since a scratch
database cannot know the deployed Supabase version.

## What the generator deliberately omits

- **Functions with unnamed arguments.** PostgREST calls RPCs with a named-parameter
  JSON body, so these are unreachable from the client. Emitting them also produced
  duplicate empty keys in `Args`. In practice these are `pgcrypto` functions.
- **Overloads.** The `Database` type is keyed by function name, so only one
  signature can be represented; the one with the most arguments wins.

Install extensions into the `extensions` schema (as `supabase-prelude.sql` does),
matching hosted Supabase. If `pgcrypto` lands in `public` instead, its functions
leak into the generated `Functions` block.

## Known migration ordering issues

Applying the migrations to an empty database in filename order surfaces real
ordering problems. These do not affect the existing production database, where
the migrations were applied incrementally, but they do mean a **fresh
environment cannot be provisioned from `supabase/migrations/` in one pass**:

- Four timestamp prefixes are used by more than one file (`20250110`,
  `20251031000001`, `20251031000002`, `20251031000003`), so their relative order
  is decided by the alphabetical tail of the filename. That puts
  `20251031000001_create_keywords_table.sql` before
  `20251031000001_create_listings_table.sql`, and `keywords` has a foreign key to
  `articles`, which is created later.
- Several migrations create a table with `IF NOT EXISTS`, then index or add
  policies to columns added by a *later* migration, so the first pass aborts
  partway through the file.
- `20260517000001_rate_limits_table.sql` uses `CREATE OR REPLACE FUNCTION` to
  rename an existing function's parameter, which Postgres rejects without a
  `DROP FUNCTION` first.
- `20260525000001_lead_notifications.sql` requires the `pg_net` extension, which
  is not available in a plain Postgres install.

Re-running the loop works around all of these, which is why step 3 loops.
