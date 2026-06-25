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
| `VITE_PII_ENCRYPTION_KEY` | ✅ | Generate: `openssl rand -base64 48` |
| `VITE_FIREBASE_*` | ⬜ | Firebase console (push notifications) |

### Edge Function secrets (set via `supabase secrets set ...`)

| Secret | Required | Notes |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Auto-available in Supabase functions |
| `STRIPE_SECRET_KEY` | ✅ (billing) | `sk_live_…` / `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | ✅ (billing) | `whsec_…` from the webhook endpoint |
| `RESEND_API_KEY` | ✅ (email) | https://resend.com/api-keys |
| `FROM_EMAIL` | ⬜ | Verified sender (default noreply@agentbio.net) |
| `PII_ENCRYPTION_KEY` | ✅ | Server-side at-rest encryption (MFA seeds) |
| `SITE_URL` | ⬜ | Base URL for links in emails |

> **Never** commit `.env.local` or any secret. `VITE_*` values are embedded in
> the client bundle — only put publishable/anon values there.

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
