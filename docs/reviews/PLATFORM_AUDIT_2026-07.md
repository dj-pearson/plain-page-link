# Platform deep-dive audit — July 2026

All 55 user stories in `prd.json` were marked `passes: true`, so this pass was an
open-ended audit of the platform rather than backlog work. Its purpose was to
find what actually needs attention.

## Method

The productive move was to stop reading code and start running it:

1. Ran the existing gates to establish a baseline (`tsc`, `vitest`, `eslint`,
   `vite build`).
2. Rebuilt the database in a scratch Postgres 16 — all 80 migrations applied over
   the Supabase objects they assume (`auth.users`, `auth.uid()`, `storage.*`, the
   API roles) — and interrogated the result.
3. Diffed what the code *uses* against what the schema *provides*: every
   `.from('<table>')` and `.rpc('<name>')` in `src/` and `supabase/functions/`.
4. Exercised the lead pipeline and the RLS policies as `anon` and as two
   different authenticated users.

Step 2 is what found everything important. **Every database defect below passed
`tsc`, the unit tests, the build, and `validate-migrations.mjs`.** That is now
closed: `scripts/verify-schema.mjs` runs in CI against a real Postgres.

## Baseline as found

| Gate | Status as found |
| --- | --- |
| `tsc --noEmit` | **694 errors** — CI's typecheck job red, and documented as a known baseline |
| `vitest` | **1 suite failed to collect**, taking the whole run down → CI's test job red |
| `eslint` | 0 errors, 1029 warnings |
| `vite build` | green |

Both red CI jobs are now green. `tsc` is down to 357 and still needs work.

## Fixed in this pass

### Critical — no lead could be created

The `on_lead_created` trigger called `NEW.type`, but the column is `lead_type`.
PL/pgSQL resolves record fields at run time and the function had no exception
handler, so **every INSERT into `leads` aborted**: all public lead-capture forms
and CSV import. Lead capture is the platform's core value proposition.

Confirmed by reproduction: the insert errors before the fix and succeeds after.
Fixed in `20260730000002`.

### Critical — round-robin lead routing never rotated

`auto_assign_lead()` passed `jsonb_build_object(...)::text` to
`log_audit_event()`, whose parameter is `jsonb`. There is no implicit text→jsonb
cast, so the call failed and the function's `EXCEPTION WHEN OTHERS` handler
swallowed it silently.

The failure mode was subtle. `NEW.assigned_to` is a PL/pgSQL variable so the
assignment survived, but the cursor increment is a database write and rolled back
every time — so **every lead went to the same first team member forever**, and no
audit event was ever recorded. Verified: four leads all landed on one member
before, and rotate correctly after. Fixed in `20260730000005`.

### Critical — every UPDATE to `seo_monitoring_schedules` failed

The table carries an `updated_at` trigger but has no `updated_at` column, so
every UPDATE aborted. `run-scheduled-audit` also writes `last_run_status` and
`last_run_duration_ms`, neither of which existed, and dispatches on
`schedule_type` values that no CHECK constraint allowed.

Root cause is the schema-divergence pattern already documented in
`20260525120000_reconcile_leads_columns.sql`: a Lovable-era migration created a
minimal table, then the next day's richer `CREATE TABLE` (no `IF NOT EXISTS`)
aborted with "already exists", so its extra columns never landed. Reconciled
additively in `20260730000003`.

### Security — `team_round_robin` had RLS disabled

The only table in `public` without row level security. Supabase grants ALL on
public tables to `anon` and `authenticated`, and the anon key ships in the
frontend bundle, so any visitor could read and write the cursor that decides who
gets the next lead. Enabled with no policies in `20260730000004`; the sole writer
is `SECURITY DEFINER` and unaffected.

### Compliance — GDPR export silently omitted user data

`gdpr-export` queried `blog_posts` (the table is `articles`) and `profile_views`
(the table is `analytics_views`, keyed by `user_id`). Both results are coalesced
with `|| []`, so the export did not fail — it returned zero articles and zero
profile views. A subject access request therefore omitted data the platform
holds. The deletion path was checked and is correct.

### Three tables the app queried that no migration created

`lead_notes`, `invoices`, `mortgage_calculations`. Each caller swallows the error,
so the features looked present and did nothing: the lead notes timeline never
loaded, and billing history was permanently empty while `stripe-webhook` logged
"Could not record invoice" and dropped the row. Created in `20260730000001` with
RLS verified across tenants.

### `types.ts` declared 47 tables; the migrations create 131

Every query against one of the missing 84 collapsed to `never` — the root cause
of the red typecheck baseline. Regenerated to 134 tables, verified against the
previous file for the 47 overlapping tables with no column dropped and no type
changed. `leads` alone was missing 17 columns, including the
`encrypted_email`/`encrypted_phone` PII columns from US-016.

`supabase gen types typescript` needs Docker, which CI and sandboxes lack, so
`scripts/gen-supabase-types.mjs` reads the same information over `psql`.

### Frontend

- `ProfileCompletionWidget` destructured `{ data: profile }` from hooks that
  return named values, so `profile` was always `undefined` and its
  `if (!profile) return null` guard meant **the widget never rendered**.
- `accessible-loading.tsx` declared five components with `export function` and
  re-exported all five again.
- Removed 138 unused imports across 76 files via TypeScript's own code fix.
- The crashing `feature-flags` suite: 7 tests were never running.

## Open — recommended next, roughly in priority order

### 1. 357 remaining `tsc` errors; typecheck still not gating

Now that `types.ts` is accurate, many remaining errors are *genuine* mismatches
rather than noise. `ci.yml` still carries the carve-out comment and the test job
still is not gated on typecheck. Clear the remainder, then restore
`needs: typecheck` and delete the comment. Largest clusters:
`useWorkflowBuilderStore` (20), `FullProfilePage` (19), `security/ownership` (18).

### 2. The usage-metering / overage-billing subsystem does not work

`src/lib/usageTracking.ts` (25 errors) and `src/hooks/useFeatureUsage.ts` are
written against a schema that was **never migrated**. Against the real schema:

- `check_feature_limit`/`record_feature_usage` are called with `p_`-prefixed
  argument names; the functions take `_`-prefixed ones, so the RPCs 404.
- `record_feature_usage` returns `boolean`, but the code treats the result as a
  usage-record id and passes it to `getUsage()`.
- `feature_usage` has no `used_at`, `included_in_plan`, `charged_amount`,
  `billing_status` or `billed_at` — all of which the code reads or writes.
- `monthly_usage_summary` has `period_year`/`period_month` and a `features_used`
  jsonb blob, not `year`/`month`/`feature_key`/`total_usage`.
- `feature_catalog` has `name`/`unit_price`, not `feature_name`/`price_per_use`.
- `getUsageSubscriptionItem()` is a stub that returns `null`, so Stripe metering
  could never fire even if the rest worked.

`src/types/features.ts` describes the aspirational schema, not the real one.
**No UI consumes any of it** — the hooks have zero callers. Deciding between
"migrate the schema up to the design" and "rewrite the code down to the schema"
is a product call, and per-feature stats cannot be derived from a jsonb blob
without knowing the intended shape. Left untouched deliberately.

### 3. `MortgageCalculator` is unreachable and cannot build

Nothing imports it, and it imports `@/components/ui/slider`, which does not
exist (`@radix-ui/react-slider` is not a dependency). Its lead capture is also
inverted: it updates the calculation row *before* `trackCalculatorUsage()`
inserts it, and the update has no `id` filter — it relies on `.order().limit()`,
which does not scope an UPDATE the way it appears to. Either wire it up properly
or delete it. `mortgage_calculations` is created and ready either way.

### 4. Five tables referenced only by unreachable edge functions

`analytics_events`, `purchases`, `push_tokens`, `seo_backlinks`,
`seo_keyword_tracking_summary`. None of their callers is reachable from `src/`,
so these are unfinished features rather than live breakage. They are allowlisted
in `verify-schema.mjs`; remove an entry as each is built or deleted. Note that
push notifications (US-049) cannot work without `push_tokens`, and
`src/lib/visitorAnalytics.ts` is imported by nothing.

### 5. A fresh environment cannot be provisioned from `supabase/migrations/`

Applying the migrations to an empty database in filename order fails in ten
places. This does not affect the existing production database, which was built
incrementally, but it means new environments cannot be stood up in one pass:

- Four timestamp prefixes are duplicated (`20250110`, `20251031000001`,
  `20251031000002`, `20251031000003`), so ordering falls to the filename tail —
  which puts `keywords` (FK to `articles`) before `articles`.
- Several migrations create a table `IF NOT EXISTS` and then index or add
  policies to columns a *later* migration adds, aborting the file partway.
- `20260517000001` uses `CREATE OR REPLACE FUNCTION` to rename a parameter,
  which Postgres rejects without a `DROP FUNCTION` first.
- `20260525000001` requires `pg_net`, absent from a plain Postgres.

The CI job works around this with three passes. A squashed baseline migration
would fix it properly.

### 6. Smaller items

- **`CLAUDE.md` documents a schema that does not exist.** It describes a
  `blog_posts` table (the real one is `articles`) and omits most of the 134
  tables. It is the first thing an AI assistant reads, so the inaccuracy
  propagates — the `gdpr-export` bug above is exactly this mistake.
- **50 `SECURITY DEFINER` functions do not pin `search_path`** — a
  privilege-escalation risk. Reported by `verify-schema.mjs`, not yet enforced.
- **1029 eslint warnings**, and 360 files are not Prettier-formatted, so
  `format:check` fails. US-001 deliberately deferred this.
- **Bundle budgets**: `three-vendor` 820 kB and `export-vendor` 594 kB exceed the
  600 kB warning. Both are lazy-loadable.
- **No test covers any of the defects found here.** The unit suite is 274 tests
  over pure functions and hooks; there is no test that inserts a lead. The new
  CI schema job is the safety net, and it is worth growing.
