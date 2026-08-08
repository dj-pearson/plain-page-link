# AgentBio — Full Codebase Review (2026-08-08)

Two passes. Scope: signup/login, authorization, RLS, storage, all 87 edge
functions, the dashboard modules, and the CI gates.

Nothing here is inferred from reading alone. The migrations were applied to a
real PostgreSQL 16, every exploit path was executed as the `anon` or
`authenticated` role, and the code's database calls were mechanically
cross-checked against the applied schema (`/tmp/colcheck.mjs`, `/tmp/selcheck.mjs`,
`/tmp/edgesel.mjs` — worth folding into `scripts/`, see §7).

---

## Verdict

The build is green, 277 unit tests pass, and the repo's own schema verifier
reports all eight checks OK. Underneath that, **the entire lead pipeline is
broken at three independent points**, signup produces no profile, and an
unauthenticated visitor can read Stripe IDs, OIDC client secrets, and every
agent's Zapier webhook URL.

One root cause dominates: **schema drift that no gate catches.** `verify:schema`
confirms every *table* referenced in code exists — it does not check *columns*.
Five edge functions select `profiles.email`, a column that has never existed.
`tsc` does catch the frontend half of this, and CI runs it, but the job has been
knowingly red for so long that its signal is gone.

| | Count |
|---|---|
| Critical | 6 |
| High | 9 |
| Medium | 10 |
| Low | 5 |

### Gate status

| Gate | Result |
|---|---|
| `npm run build` | ✅ passes (29.9 s) |
| `npx vitest run` | ✅ 277 tests / 22 files |
| `npm run verify:migrations` | ✅ 2 files valid |
| `npm run verify:schema` | ✅ 8/8 checks |
| `npm run types:check` | ✅ in sync |
| `npx tsc --noEmit` | ❌ **148 errors** — CI job red by design |
| `npx eslint src/` | ⚠️ 0 errors, 779 warnings |
| `npm audit` | ⚠️ 1 critical, 21 high |
| `npm run test:security` (47 specs) | ⛔ **never run by CI** |
| `npm run test:e2e` (5 specs) | ⛔ **never run by CI** |

---

## 1. The lead pipeline

This is the product's core value proposition, and it fails three times over,
independently. Each of these would be enough on its own.

### 1.1 CRITICAL — the public forms write columns that don't exist

`src/lib/leadSubmission.ts:38` inserts into `leads` using four columns that
aren't there, and omits both `NOT NULL` columns:

| Written | Actual |
|---|---|
| `agent_id` | `user_id` (NOT NULL) |
| `type` | `lead_type` (NOT NULL) |
| `data` | `form_data` |
| `referrer` | `referrer_url` |

`BuyerInquiryForm`, `SellerInquiryForm`, and `HomeValuationForm` all use it, and
all three are reachable from the public profile through `LeadFormModal`
(`src/pages/public/FullProfilePage.tsx:617`, `LeadCaptureCTA.tsx:151`). Every
submission is rejected by PostgREST, retried three times, then shown as a generic
failure.

`tsc` reports this exactly — `src/lib/leadSubmission.ts(41,21): error TS2769`.

A mechanical sweep of every `.insert()`/`.update()`/`.upsert()` payload in `src/`
against the live schema found **this and nothing else**, so the write path is
otherwise clean. The problem is one file, not a pattern.

**Fix:** don't repair it in place — route these three forms through the
`submit-lead` edge function, which `ContactBlock.tsx:111` already uses and which
does rate limiting, validation, and sanitisation properly.

### 1.2 CRITICAL — `profiles.email` does not exist, and five functions select it

The column is `email_display`; the agent's real address lives in
`auth.users.email`. Verified:

```
SELECT full_name, email, notification_preferences FROM public.profiles LIMIT 1;
ERROR:  column "email" does not exist
```

Every one of these is written best-effort with no error branch, so the query
400s, `profile?.email` is `undefined`, and the path silently no-ops:

| Function | Line | What silently stops working |
|---|---|---|
| `submit-lead` | 99 | agent notification email **and** the Zapier webhook — `zapier_webhook_url` comes from the same failed query |
| `notify-lead` | 71 | the trigger-driven new-lead notification |
| `submit-contact` | 66 | contact-form notification to the agent |
| `stripe-webhook` | 405 | the dunning email on `invoice.payment_failed` |

So even a lead that *does* get captured produces no email and no automation. And
customers whose card fails are never told — they churn without ever seeing a
warning.

`notify-lead` is the most quietly wrong of the four: it returns HTTP 200 with
`{ notified: false, reason: 'no_agent_email' }` and a comment reading
*"Nothing to notify; not an error."*

**Fix:** resolve the address via `auth.admin.getUserById(user_id)` (or a
`SECURITY DEFINER` helper), and make these paths log loudly instead of coalescing
to a falsy value.

### 1.3 HIGH — the Zapier webhook fires for nobody and is readable by everybody

The webhook URL never fires (§1.2) and, per §3.1, `zapier_webhook_url` is
simultaneously world-readable via the public `profiles` policy. The one integration
that should be private is public, and the one thing it should do it doesn't.

---

## 2. Critical — data an anonymous visitor can read

### 2.1 Twelve views bypass RLS for `anon`

All twelve views in `public` are owned by `postgres` and none sets
`security_invoker`, so they read their base tables with the owner's privileges.
All twelve grant `SELECT` to `anon`, and the anon key ships in the bundle.

```
anon rows via subscriptions TABLE:              0     ← RLS working
anon rows via user_subscription_details VIEW:   1     ← RLS bypassed
leaked stripe ids: cus_SECRET123/sub_SECRET456

anon rows via lead_activities TABLE:            0
anon rows via lead_activity_summary VIEW:       2     ← cross-tenant
```

`user_subscription_details` exposes every user's `stripe_customer_id`,
`stripe_subscription_id`, plan, status, trial and cancellation dates, and
per-user resource counts. `lead_activity_summary` exposes per-lead call, email,
and meeting counts across all tenants. The other ten leak aggregate funnel and
SEO metrics.

**Fix:** `SET (security_invoker = on)` on all twelve; `REVOKE SELECT … FROM anon`
where there's no public purpose.

### 2.2 `enterprise_sso_config` hands out its OIDC client secret

```sql
CREATE POLICY "Users can view active SSO configs for their domain"
  ON public.enterprise_sso_config FOR SELECT USING (active = true);
```

No `TO` clause means `TO PUBLIC`, `anon` included. The table holds
`oidc_client_secret` and `saml_certificate`. As `anon`:

```
 organization_name | oidc_client_id |    oidc_client_secret    |   saml_certificate
-------------------+----------------+--------------------------+----------------------
 Acme Realty       | client-abc     | SUPER_SECRET_OIDC_SECRET | -----BEGIN CERT-----
```

`verify:schema`'s over-permissive-policy check misses it because the qual is
`active = true` rather than a literal `true`.

**Fix:** expose only `organization_domain`/`sso_provider` through a
`security_invoker` view or an RPC keyed on email domain; restrict the table to
`service_role` and admins. **Rotate any client secret that has been live under
this policy.**

---

## 3. Critical / High — signup, storage, and public writes

### 3.1 HIGH — the public `profiles` policy publishes secrets

`"Public can view limited profile info" … USING (is_published = true)` — RLS
filters rows, not columns, so "limited" is aspirational:

```
 username |                 zapier_webhook_url                 |  phone   | license_number
----------+----------------------------------------------------+----------+----------------
 agent1   | https://hooks.zapier.com/hooks/catch/SECRET123/abc | 555-0100 | LIC-999
```

`src/types/profile.ts` already models a narrower public shape; the database just
doesn't enforce it. Move the public read to a `security_invoker` view over the
display columns and drop the table-level policy.

### 3.2 CRITICAL — signup creates no profile, no role, no subscription

`public.handle_new_user()` exists, but **nothing attaches it to `auth.users`.**
The squashed baseline came from a `public`-schema dump, and a trigger on
`auth.users` isn't part of the `public` schema, so US-060 dropped it. The original
survives at `supabase/migrations/archive/20251030155500_*.sql:118`. Verified on a
database built from `supabase/migrations/`:

```
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES (…);
profiles rows for new user: 0
user_roles rows for new user: 0
```

Downstream: `signUp` burns ~3.1 s retrying a profile that never arrives
(`useAuthStore.ts:254`); `getSecurityContext` defaults everyone to `'user'`, so
nobody can ever be an admin in a rebuilt environment; `create_default_subscription`
fires on `profiles` INSERT so it never runs, leaving `useSubscriptionLimits`'s
`.single()` (`useSubscriptionLimits.ts:34`) to throw; `generateSampleData` is
gated on `if (profile)` and never runs.

Production likely still carries the trigger from before the squash — which means
production and the declared schema have silently diverged, and any restore or new
environment comes up broken.

### 3.3 MEDIUM — and the trigger discards the chosen username

`Register.tsx` validates the username, checks availability live, and passes it in
`options.data.username`. The current function ignores it:

```sql
numeric_username := SUBSTRING(REPLACE(new.id::TEXT, '-', ''), 1, 9);
```

Every agent gets `/a1b2c3d4e` instead of `/janesmith` — on a link-in-bio product.
The archived version was correct:
`COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))`.

### 3.4 CRITICAL — public review submission is impossible

`/…/review` (`SubmitReview.tsx:76`, routed at `App.tsx:220`) is a public,
unauthenticated page that inserts into `testimonials` with `user_id: profile.id`
— the *agent's* id. The only INSERT policy is `WITH CHECK (auth.uid() = user_id)`.
As `anon`:

```
INSERT INTO public.testimonials (user_id, client_name, rating, review, date) VALUES (…);
ERROR:  new row violates row-level security policy for table "testimonials"
```

Every review submission fails and shows "Submission failed." `leads` has an
explicit `"Anyone can submit leads"` policy; `testimonials` has no equivalent.

**And the obvious fix is a trap.** `testimonials.is_published` defaults to
**`true`**, so adding an anon INSERT policy would let anyone publish arbitrary
text straight onto any agent's public profile with no moderation. The policy and
a `DEFAULT false` (or a forced `is_published = false` in the `WITH CHECK`) have to
land together.

### 3.5 HIGH — storage buckets and their policies exist nowhere in the migrations

There are **zero** `storage.buckets` rows and **zero** `storage.objects` policies
in the applied schema. Bucket creation lives only in
`supabase/migrations/archive/20251031000006_create_storage_buckets.sql`, which is
deliberately not applied — the same US-060 casualty as §3.2.

So every access rule for uploaded avatars, listing photos, and brokerage logos is
configured out of band: unversioned, unreviewable, and invisible to
`verify:schema`. A fresh environment has no buckets at all and every upload fails.

It also left the bucket names inconsistent. **Three different names for listing
photos, and no two agree:**

| Where | Bucket |
|---|---|
| `useListingImageUpload.ts:85` | `listings` |
| `OnboardingWizardPage.tsx:117` | `listing-images` |
| archived migration | `listing-photos` |

At most one exists, so at least one upload path is dead. The object *layouts*
disagree too: `useAvatarUpload.ts` writes `${user.id}/avatar.ext` (first folder =
uid, which is what a standard owner-scoped policy checks via
`(storage.foldername(name))[1] = auth.uid()::text`), while
`OnboardingWizardPage.tsx:64` writes `avatars/${user.id}-${ts}.ext` — first folder
is the literal string `avatars`, so an owner-scoped policy rejects it.

Both onboarding failures are swallowed: the avatar in a `catch` with
*"Continue even if avatar upload fails"*, the listing photo behind a bare
`if (!uploadError)` with no `else`. A new agent's first photo silently vanishes on
their first run.

### 3.6 HIGH — the magic-number file validator is imported by nothing

`supabase/functions/_shared/fileValidation.ts` is a complete implementation —
`validateFileType` against magic numbers, `validateFileSize`, `sanitizeFilename`,
`hasAllowedExtension`. **Zero functions import it.**

Meanwhile uploads go straight from the browser to Storage, validated only by
`file.type` (`useAvatarUpload.ts:16`) — the browser-declared MIME, trivially
spoofed — into buckets that have no `allowed_mime_types` because they have no
definition (§3.5). A user can host arbitrary content, including SVG, on the
platform's public storage domain under their own path.

---

## 4. High — authorization and abuse

### 4.1 Unauthenticated SSRF in seven functions

`crawl-site`, `check-broken-links`, `check-security-headers`,
`detect-redirect-chains`, `analyze-images`, `check-core-web-vitals`, and
`check-mobile-first` all take a caller-supplied URL, pass it through `new URL()`
— which parses, it does not validate — and `fetch` it. No scheme check, no
private-range or link-local block, no allow-list. `http://169.254.169.254/…` and
`http://127.0.0.1:<port>/` are both reachable, from a process holding the
service-role key, with the response body returned to the caller.

`_shared/url-validation.ts` exists but only covers *redirect* URLs for SSO. There
is no SSRF guard in the codebase.

### 4.2 Service-role functions with no authorization at all

`apply-seo-autofix` builds a service-role client and acts on the request body —
no `requireAuth`, no `requireAdmin`, no signature. It isn't in `config.toml`, and
`verify_jwt = true` wouldn't save it: **the anon key is itself a valid project
JWT**, so `verify_jwt` distinguishes "has the public key" from "has no key", not
"is an admin".

Same shape: `schedule-seo-audit`, `test-social-webhook`, `test-ai-model`,
`monitor-performance-budget`, and the AI-spend endpoints `generate-blog-content`,
`generate-content-suggestions`, `generate-social-post`. `notify-lead` too — anyone
can POST a `lead_id` (or a forged `record`) and drive email sends.

`import-keywords` shows the correct pattern (`await requireAdmin(req, supabaseClient)`)
and should be the template. **Correction to pass 1:** `process-account-deletions`
*is* properly guarded, via `isServiceRoleRequest` in `_shared/service-auth.ts` —
it was wrongly listed as unguarded.

### 4.3 The brute-force lockout can never fire

`login-security` signals a block with HTTP **429**. `callEdgeFunction` throws on
any non-2xx (`src/lib/edgeFunctions.ts:63`), so `edgeFunctions.invoke` returns
`{ data: null, error }`, and `checkLoginThrottle`'s fail-open branch
(`useLoginSecurity.ts:39-49`) returns `blocked: false`. The one response the
throttle exists to produce is the one it discards; `Login.tsx:96`'s
`if (throttleResult.blocked)` is unreachable.

`tests/security/auth.security.spec.ts:40` — *"should implement login rate
limiting"* — would catch this. CI never runs it (§6.1).

### 4.4 MFA is decorative

`signInWithPassword` completes and issues a full session *before* any second
factor (`useAuthStore.ts:318-377`). `requiresMFA` is ordinary Zustand state.
Someone with the password and no TOTP already holds a working `access_token`:
they can call PostgREST directly, or run
`useAuthStore.setState({ mfaVerified: true })`.

`SecureRoute`'s `requireMFA` prop is separately a no-op — `getSecurityContext`
hardcodes `isMFAVerified = true` (`authentication.ts:196-207`, comment: *"For now,
assume verified if they got past login"*).

**Fix:** Supabase native MFA (`auth.mfa.challenge`/`verify`, AAL2), so enforcement
lives in the JWT and RLS can require `aal2`.

### 4.5 Plan limits are not enforced server-side

`useSubscriptionLimits.canAdd()` gates the UI only. `check_subscription_limit` and
`check_feature_limit` exist in the database but **no trigger and no policy calls
either** — verified: no trigger function matching `%limit%` on any table. A
free-plan user (3 listings) can POST to `/rest/v1/listings` and create unlimited
rows; RLS only checks `auth.uid() = user_id`.

### 4.6 `/dashboard/lead-management` shows four fabricated leads

Routed (`App.tsx:273`), lazy-loaded, inside `ProtectedRoute`, rendering
`mockLeads` — "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim" —
with invented scores and timestamps:

```ts
const handleSendEmail = async (subject, body) => {
  await new Promise((r) => setTimeout(r, 500));   // "Simulate API call"
  toast.success('Email sent!');                    // nothing was sent
};
```

A paying agent can believe they replied to a lead.

---

## 5. Medium

### 5.1 The sitemap silently omits every article and every listing

`generate-sitemap` selects `articles.featured_image` (real: `featured_image_url`)
and `listings.title, images` (real: `address`, `photos`). Both queries 400; both
errors are logged and skipped. The emitted sitemap contains only profiles and
custom pages.

On a platform with ~40 SEO tables and a full SEO admin suite, dropping listings
and blog posts from the sitemap is a significant own-goal — and it is invisible
because the function still returns 200.

### 5.2 The money endpoints got the fake rate limiter

There are two: `_shared/rate-limiter.ts` is DB-backed (`rpc('check_rate_limit')`),
`_shared/rateLimit.ts` is `new Map<string, RateLimitEntry>()` in module memory —
useless across ephemeral, horizontally-scaled isolates.

The in-memory one guards `create-checkout-session`, `create-portal-session`,
`create-stripe-customer`, and `report-stripe-usage`. Migrate them to the DB-backed
one and delete `rateLimit.ts`.

### 5.3 An unmapped Stripe price grants the professional plan

`getPlanNameFromPriceId` (`stripe-webhook/index.ts:87`) ends
`return priceMap[priceId] || 'professional'`, and the result feeds
`getPlanLimits`. Any price ID not in the hardcoded map or the `STRIPE_PRICE_*`
env vars — a new tier, an add-on, a typo — silently grants professional
entitlements. Entitlement fallbacks should fail closed to `free`.

### 5.4 PII encryption is defence-in-depth theatre

`leads.encrypted_email`/`encrypted_phone` are dual-written by `useLeads.ts:78`,
but the **plaintext `email` and `phone` columns are still populated on the same
row under the same RLS**, so the ciphertext protects nothing an attacker couldn't
already read. Worse, `submit-lead` — the path every public capture should use —
writes no encrypted columns at all, so coverage is inconsistent as well as
ineffective.

Either drop the plaintext columns and decrypt on read (`gdpr-export/index.ts:174`
already has a TODO for this), or stop describing this as encryption at rest.

### 5.5 `tsc` is a red light nobody reads any more

148 errors across 66 files. CI *does* run `npx tsc --noEmit` (`ci.yml:36`), but
`test` is explicitly un-gated from it with this comment:

> *Intentionally NOT gated on typecheck: the repo carries a known tsc baseline
> (out-of-sync `src/integrations/supabase/types.ts`)…*

**That justification is now stale** — `types:check` passes and `types.ts` is in
sync. The baseline can be burned down and the gate re-armed. Until it is, `tsc` is
the only thing that caught §1.1 and its signal is discarded.

Error mix: 45 × TS2322, 30 × TS2345, 24 × TS2769, 20 × TS2339 — 55 in the
"wrong shape passed to a DB call" family. Worst files: `BlogArticle.tsx` (9),
`useAuthStore.ts` (6), `FullProfilePage.tsx` (6). Ratchet the count in CI and burn
the TS2769/TS2345 subset first; that's where the runtime defects are.

### 5.6 Analytics fabricates its comparison period

`AnalyticsDashboard.tsx:57-60`:

```ts
pageViews: Math.round(stats.totalViews * 0.85),   // "Estimate 15% growth"
```

Every trend arrow on `/dashboard/analytics-advanced` therefore reads a constant
+17.6 %, including during a decline. `revenue` and `avgResponseTime` are hardcoded
`0` in the same object and flow into the KPI cards.

### 5.7 The `keywords` admin policies error out for everyone

```sql
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM auth.users
  WHERE users.id = auth.uid() AND users.raw_user_meta_data->>'role' = 'admin'))
```

Evaluated with the caller's privileges, and `authenticated` has no grant on
`auth.users` — verified: `ERROR: permission denied for table users`. Keyword
management is broken for admins too. Separately, `raw_user_meta_data` is
user-writable via `auth.updateUser({ data: … })`, so if that grant ever appeared,
any user could self-declare `role: admin`. Use
`has_role(auth.uid(), 'admin'::app_role)` like the other 270-odd policies.

### 5.8 Stripe webhook idempotency doesn't survive a restart

`stripe-webhook/index.ts:33` keeps processed event IDs in a module-level `Map`.
Isolates are ephemeral and scaled horizontally, so Stripe's retries land on cold
instances and reprocess. The module-scope `setInterval` also pins the isolate for
no benefit. Persist to a table keyed on event ID and let the unique violation be
the check.

### 5.9 Billing state is split across two tables

`subscriptions` (flat: `plan_name` + the limit columns, read by
`useSubscriptionLimits`) and `user_subscriptions` (relational: `plan_id`, read by
the checkout/portal functions). `stripe-webhook` currently dual-writes both
consistently on all five event types, so it works — but entitlements and billing
state living in two places kept in sync by one function is a standing hazard.
`HealthDashboard.tsx:135` already selects `user_subscriptions.plan_name`, which
doesn't exist on that table, so that admin widget 400s.

### 5.10 SEO tooling data is readable too widely

`seo_core_web_vitals` and `seo_keyword_history` carry `USING (true)` with no `TO`
clause — anon-readable. A dozen more (`seo_alerts`, `seo_crawl_results`,
`seo_competitor_analysis`, `seo_page_scores`, `seo_mobile_analysis`,
`seo_security_analysis`, `seo_monitoring_log`, `seo_monitoring_schedules`) use
`auth.uid() IS NOT NULL`, so any signed-up user reads the whole SEO programme.

---

## 6. Low / hygiene

### 6.1 47 security specs and 5 e2e specs are never run

`tests/security/` holds 47 Playwright specs — 14 auth, 21 headers, 12 XSS — and
`tests/e2e/` holds 5. `ci.yml` runs `eslint` and `test:a11y`, and nothing else
from `tests/`. One of the unrun specs targets exactly the control §4.3 proves
broken. (They can't run in this sandbox — no `.env`, so no Supabase — but the CI
configuration is the finding.)

- **1 critical + 21 high npm advisories.** `jspdf` (path traversal, PDF/JS
  injection), `react-router`/`@remix-run/router` (open redirect → XSS), `axios`,
  `vite`, `postcss`, `sharp`, `ws`. `react-router` and `jspdf` touch user-facing
  paths — start there.
- **`analytics_views` accepts forged rows** — `FOR INSERT WITH CHECK (true)` with
  no `TO`, so anyone can inflate any profile's analytics. Probably an accepted
  trade-off for a public link-in-bio, but the counters should be treated as
  untrusted.
- **`src/components/dashboard/LinkManager.tsx` is dead code** — nothing imports
  it. Pure React state, never calls Supabase, toasts "Link added successfully!",
  and models a schema that doesn't match the `links` table. `useLinks.ts` is the
  real implementation. Delete it before someone routes it.
- **779 eslint warnings**, overwhelmingly `no-explicit-any`, zero errors.
- **Bundle**: `three-vendor` 820 kB (221 kB gz), `export-vendor` 594 kB (176 kB
  gz). Both lazy-loadable — the 3D hero and the PDF/Excel export aren't on the
  critical path.

---

## 7. What is genuinely in good shape

Worth stating, since the list above is one-sided — and several of these are
negative results I went looking for and didn't find:

- **Write payloads are clean.** Every `.insert`/`.update`/`.upsert` in `src/` was
  cross-checked against the live schema. `leadSubmission.ts` is the *only*
  mismatch. §1.1 is one bad file, not a pattern.
- **Error handling in the hooks is solid.** No empty `catch` blocks anywhere in
  `src/`; every Supabase result I traced checks its `error` and surfaces it
  through `onError`/toast.
- **Teams RLS is correct** — `is_team_member`/`is_team_admin` are `SECURITY
  DEFINER`, which avoids the infinite-recursion trap these policies usually fall
  into. Verified: a `team_members` select as `authenticated` returns cleanly.
- **The service worker is careful.** `public/sw.js` never caches anything with an
  `Authorization` header, any `supabase`/`api.`/`functions.` host, or any
  `/auth/v1`, `/rest/v1`, `/auth`, `/functions` path.
- **CSP is genuinely strict** — no `unsafe-inline` on `script-src`, explicit
  `connect-src`, `form-action 'self'`, `base-uri 'self'`.
- **XSS surface is tiny**: one `dangerouslySetInnerHTML` in the whole frontend
  (`ListingDetailModal.tsx:200`), and it escapes `<` in JSON-LD. No `eval`, no
  `new Function`, no unguarded `innerHTML`.
- **`submit-lead` is a model edge function**: DB-backed rate limiting, schema
  validation, per-field sanitisation, structured errors.
- **`api-keys` is done right** — `requireAuth`, CSPRNG key material, stored as
  `key_hash` with a separate `key_prefix`, full key returned exactly once.
- **CORS is an origin allow-list**, not `*`.
- **`user_roles` cannot be self-escalated** — verified: an `authenticated` insert
  of `role = 'admin'` is rejected by RLS.
- **No secrets committed** — the only JWT-shaped strings are placeholders in
  `AUTH_SETUP_DOCUMENTATION.md`.
- **All 46 `SECURITY DEFINER` functions pin `search_path`**; every RPC called from
  `src/` exists; `types.ts` matches the applied schema.
- **The `gdpr-export` `blog_posts` bug is fixed** — it queries `articles`.
- **The verification tooling is real.** Applying migrations to a live Postgres in
  CI is unusual and valuable. Most of what follows is checks it doesn't make yet.

---

## 8. Suggested order of work

**Before anything else** — restore the `on_auth_user_created` trigger (§3.2) and
fix lead capture (§1.1). Both are total failures of the core funnel.

**Same day** — the notification cluster (§1.2): one wrong column is costing you
lead emails, Zapier automations, contact-form alerts, and dunning. Then the anon
exposures: `security_invoker` on all twelve views (§2.1), lock down
`enterprise_sso_config` and **rotate the client secret** (§2.2), narrow the public
`profiles` read (§3.1).

**This week** — storage buckets and policies into a migration, with the three
bucket names reconciled (§3.5); public review submission plus the
`is_published` default, together (§3.4); SSRF guards and `requireAdmin` on the
service-role functions (§4.1, §4.2); server-side plan limits (§4.5); the throttle
fail-open (§4.3); remove or wire `/dashboard/lead-management` (§4.6).

**Next** — native Supabase MFA (§4.4), the sitemap columns (§5.1), the Stripe
rate limiter and fail-open plan default (§5.2, §5.3), the username regression
(§3.3), wire `test:security` into CI (§6.1), and start the `tsc` burn-down with a
ratchet now that its stated justification no longer holds (§5.5).

### Add to `verify:schema`

Each of these would have caught something above, and the last one is the highest
value in the list — it alone catches §1.2 and §5.1, six sites across four
subsystems:

1. **every column named in a `.select('…')` list exists on that table** — the
   current check verifies tables, not columns, which is the entire §1.2 blind
   spot. My throwaway `/tmp/edgesel.mjs` and `/tmp/selcheck.mjs` do this in ~40
   lines each; they belong in `scripts/`.
2. every trigger function in `public` is attached to at least one table (§3.2).
3. no view granted to `anon`/`authenticated` lacks `security_invoker` (§2.1).
4. no RLS policy reaching `anon` selects a column matching `*secret*`, `*token*`,
   `*_key`, `*webhook_url`, or `*certificate` — the existing over-permissive check
   only looks for a literal `true` qual (§2.2, §3.1).
5. every bucket named in a `storage.from('…')` call is created by a migration
   (§3.5).
6. no RLS policy references `auth.users` directly (§5.7).
