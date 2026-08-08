# AgentBio — Full Codebase Review (2026-08-08)

Scope: signup/login, authorization, RLS, edge functions, dashboard modules, build
and test gates. Every finding below was reproduced — the migrations were applied
to a real PostgreSQL 16 and interrogated, the build and test suites were run, and
the exploit paths were executed as the `anon` role.

---

## Verdict

The platform builds, the unit tests pass, and the repo's own schema verifier is
green. But three things are broken badly enough to affect every user, and four
give an unauthenticated visitor data they should never see.

The recurring theme: **the checks that would have caught these are not gating.**
`npm run build` does not typecheck, and `tsc --noEmit` currently reports 148
errors — one of which (`src/lib/leadSubmission.ts:41`) *is* the broken lead
capture described in §2.2. The type system found it; nothing enforced the answer.

| | Count |
|---|---|
| Critical | 4 |
| High | 6 |
| Medium | 8 |
| Low | 4 |

### Gate status as of this review

| Gate | Result |
|---|---|
| `npm run build` | ✅ passes (29.9 s) |
| `npx vitest run` | ✅ 277 tests / 22 files, all pass |
| `npx tsc --noEmit` | ❌ **148 errors** |
| `npx eslint src/` | ⚠️ 0 errors, 779 warnings |
| `npm run verify:migrations` | ✅ 2 files structurally valid |
| `npm run verify:schema` | ✅ all 8 checks pass |
| `npm run types:check` | ✅ `types.ts` in sync |
| `npm audit` | ⚠️ 1 critical, 21 high |

---

## 1. Critical

### 1.1 Signup creates no profile and no role — the trigger was lost in the squash

`public.handle_new_user()` exists in the baseline, but **nothing attaches it to
`auth.users`.** The squashed baseline (`20260806000005`) was produced from a
`public`-schema dump, and a trigger that lives on `auth.users` is not part of the
`public` schema, so it did not survive US-060. The original is still visible in
`supabase/migrations/archive/20251030155500_*.sql:118`:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Reproduced on a database built from `supabase/migrations/` in filename order:

```
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES (…);
profiles rows for new user: 0
user_roles rows for new user: 0
```

Consequences, all on the primary signup path:

- `useAuthStore.signUp` (`src/stores/useAuthStore.ts:254`) retries the profile
  fetch five times with exponential backoff — ~3.1 s of dead waiting — then
  settles on `profile: null`.
- No `user_roles` row, so `getSecurityContext` (`src/lib/security/authentication.ts:189`)
  falls through to its `'user'` default for everyone. Nobody can ever be an admin
  in a rebuilt environment.
- `create_default_subscription` fires on `profiles` INSERT, so it never runs
  either. No `subscriptions` row → `useSubscriptionLimits`'s `.single()`
  (`src/hooks/useSubscriptionLimits.ts:34`) throws → the plan/limit UI errors out.
- `generateSampleData` is gated on `if (profile)` and never runs.

Note the existing production database probably still carries the trigger from
before the squash. That does not make this safe: it means production and the
declared schema have silently diverged, and any rebuild, restore, or new
environment comes up broken.

**Fix:** re-add the trigger in a new migration. Also extend `verify:schema` to
assert that `on_auth_user_created` is attached — the current "trigger functions
reference only real columns" check passes happily on a trigger function that is
never wired to anything.

### 1.2 Every public lead-capture form silently fails

`src/lib/leadSubmission.ts:38` inserts into `leads` using columns that do not
exist, and omits the two `NOT NULL` columns that do:

| Written | Actual column |
|---|---|
| `agent_id` | `user_id` (NOT NULL) |
| `type` | `lead_type` (NOT NULL) |
| `data` | `form_data` |
| `referrer` | `referrer_url` |

Three forms use it — `BuyerInquiryForm`, `SellerInquiryForm`, `HomeValuationForm`
— and all three are reachable from the public profile via
`LeadFormModal` (`src/pages/public/FullProfilePage.tsx:617`,
`src/components/profile/LeadCaptureCTA.tsx:151`). Every submission rejects at
PostgREST, is retried three times, and returns a generic failure to the visitor.

For a platform whose value proposition is lead capture, this is the most damaging
bug in the repo. `tsc` reports it as `src/lib/leadSubmission.ts(41,21): error
TS2769`; it shipped because `build` does not run `tsc`.

Note the codebase already has a correct, hardened path — the `submit-lead` edge
function does rate limiting, validation, and sanitisation, and `ContactBlock.tsx:111`
uses it. These three forms should be moved onto it rather than repaired in place.

### 1.3 Twelve views bypass RLS for `anon`

All twelve views in `public` are owned by `postgres` and none sets
`security_invoker`. In PostgreSQL a view without `security_invoker` reads its
base tables with the **owner's** privileges, so RLS on those tables does not
apply. All twelve are granted `SELECT` to `anon`, and the anon key ships in the
frontend bundle.

Reproduced as `anon`:

```
anon rows via subscriptions TABLE:                0     ← RLS working
anon rows via user_subscription_details VIEW:     1     ← RLS bypassed
leaked stripe ids: cus_SECRET123/sub_SECRET456

anon rows via lead_activities TABLE:              0
anon rows via lead_activity_summary VIEW:         2     ← cross-tenant
```

`user_subscription_details` exposes every user's `user_id`, `plan_name`,
`status`, `stripe_customer_id`, `stripe_subscription_id`, trial and cancellation
dates, and per-user listing/link/testimonial counts. `lead_activity_summary`
exposes per-lead call/email/meeting counts and timestamps across all tenants.
The remaining ten leak aggregate funnel and SEO metrics — business intelligence
rather than PII, but still not public data.

**Fix:** `ALTER VIEW … SET (security_invoker = on)` on all twelve, and
`REVOKE SELECT … FROM anon` on the ones with no public purpose. Then add a
`verify:schema` check that fails on any `anon`-granted view lacking
`security_invoker`.

### 1.4 `enterprise_sso_config` hands its OIDC client secret to anyone

```sql
CREATE POLICY "Users can view active SSO configs for their domain"
  ON public.enterprise_sso_config FOR SELECT USING (active = true);
```

No `TO` clause, so this is `TO PUBLIC` — `anon` included. The table holds
`oidc_client_secret`, `saml_certificate`, `oidc_client_id`, and every endpoint
URL. Reproduced as `anon`:

```
 organization_name | oidc_client_id |    oidc_client_secret    |   saml_certificate
-------------------+----------------+--------------------------+----------------------
 Acme Realty       | client-abc     | SUPER_SECRET_OIDC_SECRET | -----BEGIN CERT-----
```

This is precisely the `FOR ALL USING (true)` class that migration `20260806000001`
was written to eliminate, and `verify:schema`'s "no undeclared over-permissive
RLS policy" check does not catch it because the qual is `active = true` rather
than literal `true`.

**Fix:** the discovery flow needs at most `organization_domain`, `sso_provider`,
and `active`. Expose those through a `security_invoker` view (or a
`SECURITY DEFINER` RPC that takes an email domain) and restrict the table to
`service_role` and admins. Rotate any client secret that has been live under this
policy.

---

## 2. High

### 2.1 `profiles` publishes each agent's Zapier webhook URL

`"Public can view limited profile info" … USING (is_published = true)` — but RLS
filters rows, not columns, so "limited" is aspirational. Reproduced as `anon`:

```
 username |                 zapier_webhook_url                 |  phone   | license_number
----------+----------------------------------------------------+----------+----------------
 agent1   | https://hooks.zapier.com/hooks/catch/SECRET123/abc | 555-0100 | LIC-999
```

`zapier_webhook_url` is a bearer secret: anyone holding it can inject fabricated
records straight into the agent's automations. `custom_domain`, `license_number`,
and `phone` come along too. (`src/types/profile.ts` already models a narrower
public shape — the database just doesn't enforce it.)

**Fix:** move the public read to a `security_invoker` view listing only the
display columns, and drop the table-level public policy.

### 2.2 The brute-force lockout can never fire

`login-security` returns HTTP **429** when an account is throttled
(`supabase/functions/login-security/index.ts`, `status: result.is_blocked ? 429 : 200`).
`callEdgeFunction` throws on any non-2xx (`src/lib/edgeFunctions.ts:63`), so
`edgeFunctions.invoke` returns `{ data: null, error }`, and
`checkLoginThrottle`'s fail-open branch (`src/hooks/useLoginSecurity.ts:39-49`)
returns:

```ts
{ success: false, blocked: false, attemptsRemaining: 5, blockedUntil: null, reason: null }
```

The one response the throttle exists to produce is the one response that is
discarded. `Login.tsx:96`'s `if (throttleResult.blocked)` is unreachable.

**Fix:** return 200 with `blocked: true` in the body (the HTTP status is doing
semantic work the transport layer swallows), or teach `callEdgeFunction` to pass
429 bodies through. Note also that this control is client-side — an attacker
posts directly to GoTrue's `/token` endpoint and never touches it — so it should
be treated as UX, with the real limit set at the gateway.

### 2.3 MFA is decorative

`signInWithPassword` completes and a full-AAL1 session is issued *before* any
second factor is considered (`src/stores/useAuthStore.ts:318-377`). `requiresMFA`
is ordinary Zustand state; `MFAChallenge` calls `setMFAVerified(true)` on
success, and `ProtectedRoute` reads that flag. An attacker with a valid password
and no TOTP already holds a working `access_token`: they can call PostgREST
directly, or simply run `useAuthStore.setState({ mfaVerified: true })`.

Separately, `SecureRoute`'s `requireMFA` prop is a no-op —
`getSecurityContext` hardcodes `isMFAVerified = true`
(`src/lib/security/authentication.ts:196-207`, with the comment *"For now, assume
verified if they got past login"*).

**Fix:** use Supabase's native MFA (`auth.mfa.challenge`/`verify` and AAL2), so
enforcement lives in the JWT and RLS can require `aal2` on sensitive tables.
Anything short of that means MFA does not survive a browser devtools console.

### 2.4 Plan limits are not enforced anywhere server-side

`useSubscriptionLimits.canAdd()` gates the UI. `check_subscription_limit` and
`check_feature_limit` exist in the database but **no trigger and no RLS policy
calls either** (verified: no trigger function matching `%limit%` on any table).
The only constraint on `listings`, `links`, and `testimonials` is
`auth.uid() = user_id`.

A free-plan user (3 listings) can POST to `/rest/v1/listings` with the anon key
and their own JWT and create unlimited rows. Every plan tier is advisory.

**Fix:** a `BEFORE INSERT` trigger on each metered table calling
`check_subscription_limit`. The client-side check stays as UX.

### 2.5 Service-role edge functions with no authorization

`apply-seo-autofix` builds a service-role client and acts on request body alone —
no `requireAuth`, no `requireAdmin`, no signature. It is not declared in
`config.toml`, and even `verify_jwt = true` would not help: the anon key *is* a
valid project JWT, so `verify_jwt` distinguishes "has the public key" from
"has no key", not "is an admin".

Others in the same shape (service role + no in-code auth check):
`schedule-seo-audit`, `test-social-webhook`, `test-ai-model`,
`monitor-performance-budget`, `manage-blog-titles`, and the AI-spend functions
`generate-blog-content`, `generate-content-suggestions`, `generate-social-post`.
The URL-fetching family (`crawl-site`, `check-broken-links`,
`check-security-headers`, `detect-redirect-chains`, `analyze-images`,
`check-core-web-vitals`, `check-mobile-first`) additionally takes an
attacker-supplied URL with no allow-list — SSRF against internal services, and
the calls originate from a host holding the service-role key.

`import-keywords` shows the right pattern (`await requireAdmin(req, supabaseClient)`)
and should be the template.

CORS itself is correctly implemented (`_shared/cors.ts` uses an origin allow-list,
not `*`) — but CORS constrains browsers, not `curl`, so it is not the control here.

### 2.6 `/dashboard/lead-management` shows four fabricated leads

`src/pages/LeadManagementDashboard.tsx` is routed (`App.tsx:273`), lazy-loaded,
and inside `ProtectedRoute`. It renders `mockLeads` — "Sarah Johnson",
"Michael Chen", "Emily Rodriguez", "David Kim" — with invented scores, tags, and
timestamps. Handlers mutate local state and toast success:

```ts
const handleSendEmail = async (subject, body) => {
  await new Promise((r) => setTimeout(r, 500));   // "Simulate API call"
  logger.debug('Sending email', { subject, body });
  toast.success('Email sent!');                    // nothing was sent
};
```

A paying agent can believe they replied to a lead. Either wire it to `useLeads`
or remove the route.

---

## 3. Medium

### 3.1 `tsc` is not a gate, and it is hiding real bugs

148 errors across 66 files. `build` runs `vite build` only; `build:check` exists
but nothing invokes it. Error mix: 45 × TS2322, 30 × TS2345, 24 × TS2769,
20 × TS2339 — with 55 in the "wrong shape passed to a DB call" family that
produced §1.2. Worst files: `BlogArticle.tsx` (9), `useAuthStore.ts` (6),
`FullProfilePage.tsx` (6).

Suggested approach: freeze the count in CI (fail if it rises above 148) and burn
down the TS2769/TS2345 database-call errors first — that subset is where runtime
defects live.

### 3.2 `oauth-proxy` breaks past 50 users, and trusts unverified emails

`supabase/functions/oauth-proxy/index.ts:164`:

```ts
const { data: existingUsers } = await supabase.auth.admin.listUsers();
const existingUser = existingUsers?.users?.find((u) => u.email === payload.email);
```

`listUsers()` defaults to page 1, 50 per page. Once the platform passes 50 users,
returning users stop being found, `createUser` is called, it fails on the
duplicate email, and Google/Apple sign-in dies with `create_user_failed`. Use
`listUsers({ page, perPage })` in a loop, or better, query `auth.users` by email
directly.

Three more in the same function:

- **No `email_verified` check.** The ID-token payload is decoded
  (`JSON.parse(atob(id_token.split('.')[1]))`) and `payload.email` is matched
  against existing accounts, then `generateLink({ type: 'magiclink' })` mints a
  session for whatever matched. A provider that returns an unverified email turns
  into account takeover of the password account with the same address. Require
  `payload.email_verified === true`.
- **PKCE is decorative.** The code verifier is carried inside the `state`
  parameter (`btoa(JSON.stringify({ verifier, redirectTo, provider }))`), so it
  travels through the browser, the provider, and every log along the way. The
  verifier must stay server-side (or in an `HttpOnly` cookie) for PKCE to mean
  anything.
- **`state` provides no CSRF protection.** It is attacker-forgeable and bound to
  nothing. Store a nonce server-side or in a cookie and compare on callback.

Credit where due: the frontend end of this flow is correct —
`AuthCallback.tsx:31` runs `redirect_to` through `validateRedirectPath`, which
blocks `//evil.com` and external hosts.

### 3.3 The chosen username is discarded at signup

`Register.tsx` validates the username with `usernameSchema`, checks availability
live via `useUsernameCheck`, and passes it in `options.data.username`. The current
`handle_new_user` then ignores it:

```sql
numeric_username := REPLACE(new.id::TEXT, '-', '');
numeric_username := SUBSTRING(numeric_username, 1, 9);
```

Every new agent gets `/a1b2c3d4e` instead of `/janesmith` — on a link-in-bio
product. The archived version did this correctly:

```sql
COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
```

Restore that, keeping a uniqueness fallback for the race the availability check
can't close.

### 3.4 Analytics fabricates its comparison period

`src/pages/AnalyticsDashboard.tsx:57-60`:

```ts
pageViews: Math.round(stats.totalViews * 0.85),      // "Estimate 15% growth"
uniqueVisitors: Math.round(stats.uniqueVisitors * 0.85),
```

Every trend arrow on `/dashboard/analytics-advanced` therefore reads a constant
+17.6 % regardless of what actually happened, including during a decline. Query
the prior window properly, or hide the deltas until you can.

`revenue` and `avgResponseTime` are hardcoded `0` in the same object and flow
into the KPI cards.

### 3.5 The `keywords` admin policies error out for everyone

```sql
CREATE POLICY "Only admins can insert keywords" ON public.keywords
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid() AND users.raw_user_meta_data->>'role' = 'admin'));
```

Two problems. The policy is evaluated with the caller's privileges and
`authenticated` has no grant on `auth.users`, so it raises
`ERROR: permission denied for table users` — reproduced; keyword management is
broken for admins too. And `raw_user_meta_data` is user-writable via
`supabase.auth.updateUser({ data: … })`, so if that grant ever appeared, any user
could self-declare `role: admin`. The rest of the codebase correctly uses
`has_role(auth.uid(), 'admin'::app_role)` (a `SECURITY DEFINER` function); these
three policies should too.

### 3.6 Stripe webhook idempotency does not survive a restart

`stripe-webhook/index.ts:33` keeps processed event IDs in a module-level `Map`.
Edge function isolates are ephemeral and horizontally scaled, so Stripe's retries
land on cold instances with empty maps and reprocess. The module-scope
`setInterval` also keeps the isolate warm for no benefit.

Persist to a `stripe_processed_events` table with the event ID as primary key and
let the unique violation be the idempotency check.

### 3.7 SEO tooling data is readable too widely

`seo_core_web_vitals` and `seo_keyword_history` carry `USING (true)` with no `TO`
clause — anon-readable. A dozen more (`seo_alerts`, `seo_crawl_results`,
`seo_competitor_analysis`, `seo_page_scores`, `seo_mobile_analysis`,
`seo_security_analysis`, `seo_monitoring_log`, `seo_monitoring_schedules`) use
`auth.uid() IS NOT NULL`, so any signed-up user reads the whole SEO programme,
including `seo_security_analysis`. Scope these to admins.

### 3.8 Dependency advisories

1 critical (`jspdf` — path traversal, PDF/JS injection, several DoS) and 21 high,
including `react-router`/`@remix-run/router` (open redirect → XSS), `axios`
(prototype-pollution family, SSRF), `vite` (arbitrary file read via dev server),
`postcss`, `sharp`, and `ws`. `react-router` and `jspdf` are the two that touch
user-facing paths; start there.

---

## 4. Low / hygiene

- **`analytics_views` accepts forged rows.** `FOR INSERT WITH CHECK (true)` with
  no `TO` clause means anyone can inflate any profile's view analytics at will.
  Probably an accepted trade-off for a public link-in-bio, but it should be rate
  limited and the counters treated as untrusted.
- **`src/components/dashboard/LinkManager.tsx` is dead code** — nothing imports
  it. It keeps links in React state, never calls Supabase, toasts "Link added
  successfully!", and models a schema (`link`, `type`, `up_link`, `click_number`,
  numeric `id`) that does not match the `links` table. `useLinks.ts` is the real
  implementation. Delete it before someone routes it.
- **779 eslint warnings**, overwhelmingly `no-explicit-any`. Zero errors. Worth
  ratcheting `--max-warnings` down over time rather than in one pass.
- **Bundle size**: `three-vendor` 820 kB (221 kB gz) and `export-vendor` 594 kB
  (176 kB gz). Both are lazy-loadable — the 3D hero and the PDF/Excel export path
  are not on the critical render path.

## 5. What is in good shape

Worth stating plainly, since the list above is one-sided:

- **CSP** (`public/_headers`) is genuinely strict — no `unsafe-inline` on
  `script-src`, explicit `connect-src`, `form-action 'self'`, `base-uri 'self'`.
- **XSS surface is tiny**: one `dangerouslySetInnerHTML` in the whole frontend
  (`ListingDetailModal.tsx:200`), and it escapes `<` in JSON-LD. No `eval`, no
  `new Function`, no unguarded `innerHTML`.
- **`submit-lead`** is a model edge function: DB-backed rate limiting, schema
  validation, per-field sanitisation, structured error responses.
- **CORS** is an origin allow-list, not `*`.
- **No secrets committed** — the only JWT-shaped strings in the repo are
  placeholders in `AUTH_SETUP_DOCUMENTATION.md`.
- **`user_roles` cannot be self-escalated** — verified: an `authenticated` insert
  of `role = 'admin'` is rejected by RLS.
- **The `gdpr-export` `blog_posts` bug is fixed** — it queries `articles`.
- **All 46 `SECURITY DEFINER` functions pin `search_path`**, and
  `types.ts` is in sync with the applied schema.
- **The verification tooling is real.** `verify:schema` applying migrations to a
  live Postgres is unusual and valuable; several findings above are simply checks
  it does not yet make (see §6).

---

## 6. Suggested order of work

**Before anything else** — restore the signup trigger (§1.1) and fix lead capture
(§1.2). Both are total failures of the core funnel.

**Same day** — the four anon data exposures: `security_invoker` on all views
(§1.3), lock down `enterprise_sso_config` and rotate the client secret (§1.4),
narrow the public `profiles` read (§2.1).

**This week** — server-side plan limits (§2.4), `requireAdmin` on the
service-role functions and an allow-list on the URL fetchers (§2.5), the throttle
fail-open (§2.2), and remove or wire `/dashboard/lead-management` (§2.6).

**Next** — native Supabase MFA (§2.3), the `oauth-proxy` pagination and
`email_verified` fixes (§3.2), the username regression (§3.3), and start the
`tsc` burn-down with a CI ratchet (§3.1).

**Add to `verify:schema`**, since each would have caught something above:

1. every trigger function in `public` is attached to at least one table
   (catches §1.1);
2. no view granted to `anon`/`authenticated` lacks `security_invoker`
   (catches §1.3);
3. no RLS policy reaching `anon` selects a column named `*secret*`, `*token*`,
   `*_key`, `*webhook_url`, or `*certificate` (catches §1.4 and §2.1 — the
   existing "over-permissive policy" check only looks for a literal `true` qual);
4. no RLS policy references `auth.users` directly (catches §3.5).
