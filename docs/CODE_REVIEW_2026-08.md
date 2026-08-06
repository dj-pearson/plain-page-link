# Code review — August 2026

A verification pass over `prd.json`: every gate re-run from a clean checkout, the
schema rebuilt in a real Postgres 16, and each story's acceptance criteria checked
against what the repo actually does rather than against what the previous pass
recorded.

Two things came out of it:

1. The seven stories already marked `passes: false` are **accurate** — every claim
   in them reproduces exactly as written.
2. Three defects that no story covers, one of them **critical and exploitable
   today with the anon key that ships in the production bundle**.

## Gates as they stand

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | **356 errors** (PRD says 357 — matches) |
| Unit tests | `npm run test:run` | green — 274 tests, 22 files |
| Build | `npm run build` | green |
| Bundle budgets | `npm run size-check` | green (1 documented exception) |
| ESLint | `npx eslint src/` | 0 errors, **902 warnings** |
| Prettier | `npm run format:check` | **fails — 299 files unformatted** |
| Schema | `npm run verify:schema` | green, with 50 unpinned `SECURITY DEFINER` notes |
| Migrations, single pass | 85 files, filename order, empty DB | **10 fail** (PRD says ten — matches) |

Note the shape of this: **53 of the 55 stories marked `passes: true` carry
"`tsc --noEmit` succeeds" as an acceptance criterion, and it does not.** The
criterion is real work captured by US-056; the `passes: true` on the other 53 is
best read as "the story's substantive work landed," not "every criterion holds."
Worth saying out loud so nobody reads the board as greener than it is.

---

## New — not covered by any story

### 1. CRITICAL: twelve tables are fully readable and writable by `anon`

Twelve policies are written as

```sql
CREATE POLICY "Service role can manage audit logs"
  ON audit_logs FOR ALL
  USING (true);
```

with no `TO service_role`. Postgres defaults an omitted `TO` clause to
`TO PUBLIC`, and Supabase grants `ALL` on every table in `public` to `anon` and
`authenticated`. The anon key ships in the frontend bundle. So each of these
policies grants every anonymous visitor unrestricted SELECT / INSERT / UPDATE /
DELETE over the table.

**Zero policies in the schema (0 of 271) correctly scope `TO service_role`.**

Affected tables:

| Table | What an anonymous visitor can do |
| --- | --- |
| `audit_logs` | Read and **delete** the compliance audit trail (US-013/014/043) |
| `user_subscriptions` | Read and **write** subscription status — set `status='active'` for free |
| `login_attempts` | **Delete** the brute-force throttle record (defeats `useLoginSecurity`) |
| `mfa_temp_codes` | Read code hashes and insert codes for another user (defeats US-030/031) |
| `user_sessions` | Read and revoke any user's sessions (US-029) |
| `sso_login_sessions` | Read and forge SSO session rows |
| `gdpr_data_requests` | Read and destroy subject-access requests (US-019/020) |
| `account_deletion_scheduled` | Cancel or forge scheduled deletions |
| `usage_tracking` | Rewrite metered usage |
| `rate_limit_entries` | Clear rate-limit state (legacy table; the live limiter uses `rate_limits`, which is correctly policy-less) |
| `workflow_executions`, `workflow_execution_queue` | Read and queue workflow executions |

Reproduced against the rebuilt schema, connected as `anon`:

```
SET ROLE anon; SELECT count(*) FROM audit_logs;          -> 5 rows readable
SET ROLE anon; DELETE FROM audit_logs;                   -> DELETE 5
SET ROLE anon; UPDATE user_subscriptions SET status='active';  -> UPDATE 1
```

This is the same class of defect the July pass found on `team_round_robin` and
fixed for that one table. It is systemic: 32 `USING (true)` policies exist across
the migrations.

Fix: one corrective migration that drops and recreates each of the twelve with
`TO service_role`. `service_role` is `BYPASSRLS` in hosted Supabase, so the
edge functions that write these tables are unaffected either way — the policies
exist only to *not* grant `anon`.

### 2. CRITICAL: any visitor can rewrite any user's public profile links

```sql
CREATE POLICY "Anyone can increment link clicks"
ON links FOR UPDATE
USING (true) WITH CHECK (true);
```

The intent is a click counter. What it grants is UPDATE on every column of every
row. Reproduced as `anon`:

```
UPDATE links SET url='https://evil.example/steal' WHERE title='My Listings';
-> ANON REWROTE URL TO: https://evil.example/steal
```

Link-in-bio is the product's core surface, so this is a live traffic-hijack and
phishing vector against every published profile. A `SECURITY DEFINER`
`increment_link_click(link_id)` function with the policy removed is the clean
fix; a column-scoped `WITH CHECK` that pins every field but `click_count` is the
minimum.

### 3. `verify-schema.mjs` cannot see either of the above

The script checks that RLS is *enabled* on every table — which is true for all
twelve — but never inspects what the policies grant. Both findings passed the
schema job. A blocking check for "permissive policy on `PUBLIC` with `USING
(true)` on a non-public-data table" closes the gap and would have caught
`team_round_robin` in July too.

---

## Story-level corrections

### US-051 (console → logger migration) is marked passing but is not complete

Its acceptance criterion reads: *"No raw console statements remain in
`src/hooks/`, `src/stores/`, `src/pages/`, or `src/components/`."*

**38 remain**, across 26 files — 34 in `src/components/`, 4 in `src/hooks/`,
excluding tests and comments. Concentrated in `components/admin/seo/*`,
`components/dashboard/*`, `components/mobile/*`, and `hooks/useListingImageUpload.ts`.
ESLint independently reports 20 `no-console` warnings. Flipped to `passes: false`.

### US-015/016 (PII encryption) — the control is nominal, not broken

Both stories' criteria are met as written. But `getMasterKey()` reads
`import.meta.env.VITE_PII_ENCRYPTION_KEY`, and Vite inlines `VITE_`-prefixed
values into the production bundle. The AES-256-GCM key protecting
`encrypted_email` / `encrypted_phone` is therefore public. Combined with the
still-plaintext `email`/`phone` columns the dual-write keeps (correct for the
transition per US-016), the encryption currently protects nothing.

That is a real gap for the enterprise/GDPR story the PRD is built around, and
the stories themselves flag Supabase Vault as the intended destination. Left as
`passes: true` — the criteria hold — with a new story for the key move.

---

## Observations, not defects

- **US-011 coverage thresholds** are set to 15% against a measured baseline of
  ~71%. The AC specifies 15 literally, so the story passes, but the gate cannot
  catch a regression that drops coverage by 55 points.
- **US-026 bundle budgets**: `three-vendor` at 820 kB exceeds the 600 kB vendor
  budget and passes via a documented exception in `check-bundle-size.mjs`. The
  exception is reasoned (lazy-loaded, never on first paint). `export-vendor` at
  594 kB is under budget — the July audit reported it as over.
- **902 ESLint warnings**, led by `react/no-unescaped-entities` (349),
  `no-explicit-any` (327) and `no-unused-vars` (139). The lint job runs with
  `--max-warnings=-1`, which disables the limit, so none of these gate.
- **299 files fail `prettier --check`**, so `npm run format:check` fails. Not
  wired into CI. US-001 deferred this deliberately.

---

## Suggested order

1. **US-063** — scope the twelve `FOR ALL USING (true)` policies to `service_role`.
2. **US-064** — replace the `links` UPDATE policy with a click-count RPC.
3. **US-065** — make `verify-schema.mjs` fail on over-permissive policies, so 1 and 2 cannot regress.
4. **US-062** — pin `search_path` on the 50 `SECURITY DEFINER` functions (already on the board; same migration window).
5. **US-060** — squashed baseline so a fresh environment provisions in one pass.
6. **US-056** — clear the 356 `tsc` errors and re-gate CI.
7. **US-066** — move the PII key server-side.
8. **US-051** — finish the logger migration.
9. **US-057 / US-058 / US-059** — the three product calls on unfinished subsystems.
10. **US-061** — correct the schema in `CLAUDE.md`.

## Method

Postgres 16 locally, `scripts/supabase-prelude.sql` for the Supabase objects the
migrations assume, then all 85 migrations. One pass to count real failures (10),
then the CI three-pass loop to converge (146 tables) before interrogating
policies and grants and exercising them as `anon`. Frontend gates run from a
clean `npm ci`.
