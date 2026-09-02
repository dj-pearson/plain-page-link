# AgentBio Deployment Runbook

Authoritative operations guide for deploying, verifying, and recovering the
AgentBio platform. Supersedes the scattered `*_DEPLOYMENT.md` notes in the repo
root.

- **Frontend**: React + Vite SPA → **Cloudflare Pages**
- **Backend**: **Supabase** (PostgreSQL, Auth, Storage, Edge Functions)
- **Default branch**: `main` (production); feature branches → PR → `main`

---

## 1. Prerequisites

| Tool | Version | Purpose |
| --- | --- | --- |
| Node.js | 20.x | Build the frontend (`npm ci`, `npm run build`) |
| npm | 10.x | Package manager (lockfile committed) |
| Supabase CLI | latest | Deploy edge functions + run migrations |
| Cloudflare access | — | Pages project for the frontend |
| Stripe account | — | Billing (live + test keys) |
| Resend account | — | Transactional email |

Access required: Cloudflare Pages project, Supabase project (owner/admin),
Stripe dashboard, Resend dashboard, GitHub repo write.

---

## 2. Environment configuration

Copy `.env.example` → `.env.local` for local dev. The full, annotated list of
variables lives in **`.env.example`** — treat it as the source of truth. Summary:

### Frontend (`VITE_*`, set in Cloudflare Pages → Settings → Environment variables)

| Variable | Required | Where to obtain |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ✅ | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase → Project Settings → API |
| `VITE_APP_URL` | ✅ | Your production URL (e.g. https://agentbio.net) |
| `VITE_FUNCTIONS_URL` | ⬜ | Supabase functions subdomain (self-hosted) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ⬜ | Stripe → Developers → API keys |

### Edge Function secrets (set via `supabase secrets set ...`)

| Secret | Required | Notes |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Auto-available in Supabase functions |
| `STRIPE_SECRET_KEY` | ✅ (billing) | `sk_live_…` / `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | ✅ (billing) | `whsec_…` from the webhook endpoint |
| `RESEND_API_KEY` | ✅ (email) | https://resend.com/api-keys |
| `FROM_EMAIL` | ⬜ | Verified sender (default noreply@agentbio.net) |
| `PII_ENCRYPTION_KEY` | ✅ | At-rest encryption: lead email/phone, profile phone, MFA seeds. See §2.1 |
| `SITE_URL` | ⬜ | Base URL for links in emails |

> **Never** commit `.env.local` or any secret. `VITE_*` values are embedded in
> the client bundle — only put publishable/anon values there.

### 2.1 Migrating the PII key off the client bundle (US-066)

`VITE_PII_ENCRYPTION_KEY` is gone. It was a `VITE_` variable, so Vite inlined it
into the production bundle — the key protecting `leads.encrypted_email`,
`leads.encrypted_phone` and `profiles.phone` was downloadable by anyone who
loaded the site. The browser now calls the `pii-crypto` Edge Function, which
holds `PII_ENCRYPTION_KEY`.

**Existing ciphertext keeps working, but only if you carry the key across.** The
envelope format is unchanged, so set the function secret to the value
`VITE_PII_ENCRYPTION_KEY` currently holds in Cloudflare Pages:

```bash
supabase secrets set PII_ENCRYPTION_KEY="<the current VITE_PII_ENCRYPTION_KEY value>"
supabase functions deploy pii-crypto
```

Then remove `VITE_PII_ENCRYPTION_KEY` from Cloudflare Pages → Settings →
Environment variables and redeploy the frontend.

Rotating to a fresh key is a **separate** job: every stored `enc:v1:` value
would become undecryptable, so it needs a backfill that decrypts under the old
key and re-encrypts under the new one before the old key is retired.

### 2.2 Retiring the plaintext lead columns (US-086)

`leads.email` and `leads.phone` are gone. They were dual-written beside
`encrypted_email` / `encrypted_phone` on the same row under the same RLS
policies, so the ciphertext protected nothing an attacker could not already
read — and `submit-lead`, the path every public capture form uses, wrote no
ciphertext at all.

**`PII_ENCRYPTION_KEY` is now the only way to read a lead's contact details.**
That is the point of the change, and it is also the risk: there is no longer a
plaintext column to reconstruct from. Back the key up somewhere durable and
separate from the database before deploying this, and treat losing it as
losing every lead's email and phone number. Key rotation now requires
decrypting under the old key first — it can no longer be reconstructed from
plaintext.

The order matters, because the AES key lives only in the function secrets and
no SQL migration can encrypt:

```bash
# 1. Deploy the functions that read and write the encrypted columns.
supabase functions deploy backfill-lead-pii
supabase functions deploy submit-lead
supabase functions deploy gdpr-export

# 2. Encrypt any lead still holding plaintext. Idempotent — safe to re-run,
#    and it reports how many rows it touched. Requires an admin JWT.
curl -X POST "$SUPABASE_URL/functions/v1/backfill-lead-pii" \
  -H "Authorization: Bearer <admin access token>"

# 3. Only then apply the migration that drops the columns.
supabase db push
```

Step 3 is guarded: `20260901000001_leads_drop_plaintext_pii.sql` counts rows
that still hold plaintext with no ciphertext and raises an exception rather
than dropping anything if it finds any. Running it out of order fails loudly
and changes nothing, so a partial or skipped backfill cannot silently destroy
contact data — but run the steps in order anyway.

---

## 3. Deployment steps

### 3.1 Frontend (Cloudflare Pages)

Cloudflare Pages auto-builds on push to the connected branch.

- **Build command**: `npm run build`
- **Build output dir**: `dist`
- **Node version**: 20 (`.node-version` / `NODE_VERSION=20`)

Manual deploy:

```bash
npm ci
npm run build:check     # tsc --noEmit && vite build
# upload dist/ via Cloudflare Pages (CI does this automatically)
```

### 3.2 Database migrations (Supabase)

Migrations live in `supabase/migrations/` (timestamped SQL). Apply in order:

```bash
supabase link --project-ref <project-ref>
supabase db push          # applies pending migrations
```

- Migrations are forward-only; write them idempotently (`IF NOT EXISTS`, additive
  columns) so re-runs are safe.
- Review the diff on staging first (see §6).

#### One-time step for the squashed baseline (US-060)

`supabase/migrations/` was collapsed to a single baseline,
`20260806000005_squashed_baseline.sql`, on 2026-08-06. The 89 migrations it
replaces are preserved under `supabase/migrations/archive/`, which `db push`
does not read.

The baseline **must not be applied to the existing production database** — it
creates 134 tables that are already there. Before the next `db push` against a
project that predates it, mark it as applied:

```bash
supabase link --project-ref <project-ref>
supabase migration repair --status applied 20260806000005
supabase db push          # now a no-op for the baseline
```

A **new** environment needs no repair step: `db push` applies the baseline to
the empty database in one pass, which is the whole point of the change. Verify
with `npm run verify:schema` afterwards.

### 3.3 Edge functions (Supabase, Deno)

```bash
supabase functions deploy <name>     # one function
# or deploy all:
supabase functions deploy
```

Set secrets once (and after rotation):

```bash
supabase secrets set RESEND_API_KEY=re_xxx STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx PII_ENCRYPTION_KEY="$(openssl rand -base64 48)"
```

Stripe webhook endpoint: point Stripe → Developers → Webhooks at
`<functions-url>/stripe-webhook` and copy its signing secret into
`STRIPE_WEBHOOK_SECRET`.

---

## 4. Post-deploy verification checklist

After every production deploy, confirm:

- [ ] Site loads at the production URL; no console errors on first paint.
- [ ] CI is green for the deployed commit (typecheck, build, tests, security).
- [ ] Auth: log in, log out, and (if enabled) MFA challenge work.
- [ ] A public profile page renders (listings, links).
- [ ] Lead capture form submits and the agent receives a notification email.
- [ ] Stripe: open the subscription page; "Manage Billing" reaches the portal.
- [ ] Edge functions respond (check Supabase → Functions → Logs for errors).
- [ ] No new Sentry issues spiking (see MONITORING.md).
- [ ] Service worker updates cleanly (hard refresh shows new version).

---

## 5. Rollback procedures

### Frontend

- **Cloudflare Pages → Deployments → previous successful deployment → "Rollback"**
  (instant; serves the prior immutable build).
- Or revert the offending commit on `main` and let CI redeploy.

### Edge functions

- Redeploy the previous version from a known-good commit:
  `git checkout <good-sha> -- supabase/functions/<name> && supabase functions deploy <name>`.

### Database

- Migrations are forward-only. To undo, write a new **compensating** migration
  (e.g. drop the column/index just added) rather than editing history.
- For data corruption, restore from backup (see §6).

---

## 6. Staging vs production

| Aspect | Staging | Production |
| --- | --- | --- |
| Supabase project | separate staging project | production project |
| Stripe keys | `sk_test_…` / test mode | `sk_live_…` |
| Resend | sandbox/from test domain | verified production domain |
| Cloudflare | preview/branch deployment | production branch (`main`) |
| Data | disposable seed data | real customer data — handle with care |

Always validate migrations and edge-function changes on staging before
production. Never point staging at the production database.

---

## 7. Database backup & restore

- **Automated backups**: Supabase takes daily backups (Pro plan: PITR). Verify
  in Supabase → Database → Backups.
- **Manual backup** before risky migrations:
  ```bash
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```
- **Restore**:
  - Point-in-time: Supabase → Database → Backups → Restore (choose timestamp).
  - From dump: `psql "$DATABASE_URL" < backup_YYYYMMDD.sql` into a fresh project,
    then re-point `VITE_SUPABASE_URL`.
- Test the restore path on staging at least once per quarter.

---

## 8. Incident response

1. **Detect**: Sentry alert, Cloudflare/Supabase status, or user report.
2. **Assess severity**: is auth, billing, or data integrity affected?
3. **Communicate**: notify the on-call owner (see below); post status internally.
4. **Mitigate first**: roll back the frontend (§5) and/or the offending edge
   function — fastest path to a known-good state.
5. **Diagnose**:
   - Frontend errors → Sentry (see `MONITORING.md`) + Cloudflare Pages logs.
   - Backend errors → Supabase → Functions → Logs; Database → Logs.
   - Payments → Stripe → Developers → Events/Webhooks.
6. **Fix forward**: land a patch via PR → CI → deploy once root cause is clear.
7. **Postmortem**: record cause, timeline, and follow-ups.

**Contacts**: Primary on-call — platform owner (`support@agentbio.net`).
Escalation — repository admins listed in GitHub.

---

## 9. Related docs

- `MONITORING.md` — Sentry, alert thresholds, dashboards.
- `SECURITY.md` — security policy and reporting.
- `SECURITY_NOTES.md` — known/accepted dependency advisories.
- `.env.example` — full annotated environment variable reference.
