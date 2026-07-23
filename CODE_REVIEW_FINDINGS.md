# AgentBio Web Platform — Code Review Findings

**Reviewed:** 2026-07-23 · React 18 + TypeScript + Vite + Supabase · ~115k LOC, 474 source files, 87 edge functions
**Method:** Static analysis (`tsc`, `eslint`, production build) + targeted manual review of auth, data/state, routing/PWA, and backend edge functions. Every item below was verified against actual code.

---

## Executive summary

The app **builds and runs**, but its type-safety net is effectively disabled and there are genuine **security holes** and **correctness bugs** that affect real user flows (login/MFA/SSO, lead PII, the public profile page, offline sync). The recurring backend theme: functions trust `verify_jwt` (satisfied by the public anon key) instead of doing in-code authorization, ownership checks, and input-URL validation. Highest priority: fix the three Critical security issues, then restore the TypeScript gate so regressions can't ship unnoticed.

**Scorecard**
| Signal | Result |
|---|---|
| `tsc --noEmit` | ❌ **709 errors** |
| `vite build` (ships to prod) | ✅ passes — **type errors are not caught** |
| `eslint src/` | 0 errors, 1037 warnings |
| `console.*` calls in src | 69 (should use `logger`) |
| `as any` casts | 61 |
| Edge functions with no auth reference | 28 / 87 |

---

> **Backend architecture note that amplifies severity:** In `supabase/config.toml`, most functions rely on `verify_jwt = true` as their *only* gate and do no auth check in code. But `verify_jwt=true` is satisfied by the project's **public anon key** (shipped in the frontend JS) and by any free registered user — it is not per-user access control. So a function with `verify_jwt=true` and no in-code ownership check is effectively callable by anyone on the internet.

## 🔴 Critical — fix first

### C1. PII "encryption at rest" key is shipped in the browser bundle
`src/lib/pii.ts:24` reads the master key from `import.meta.env.VITE_PII_ENCRYPTION_KEY`. Any `VITE_`-prefixed variable is inlined into the public client bundle, and all encrypt/decrypt runs client-side (`useLeads.ts:56`, `useProfile.ts:88`). Anyone can open the deployed JS, extract the key, and decrypt every lead email/phone and profile PII. The encryption provides **zero** confidentiality.
**Fix:** move encryption server-side (Supabase Vault / an edge function holding the key in a non-`VITE_` secret). Rotate the key after migrating.

### C2. Unauthenticated SSRF across the SEO fetch functions (service-role)
Six functions take a user-supplied URL from the body and `fetch()` it server-side with a service-role client and **no URL validation** — none call the existing `_shared/validation.ts` `isValidSafeUrl` helper, and none do an in-code auth check (they lean on `verify_jwt`, i.e. the anon key):
`crawl-site/index.ts:62`, `check-security-headers/index.ts:28`, `check-broken-links/index.ts:30`, `analyze-images/index.ts:28`, `check-mobile-first/index.ts:29`, `validate-structured-data/index.ts:28`.
POST `{"startUrl":"http://169.254.169.254/latest/meta-data/..."}` and the function returns the fetched content — exfiltrating cloud metadata / internal-only services. `crawl-site` recurses into discovered links, widening it.
**Fix:** require admin auth; validate each URL is public http/https and block private/loopback/link-local ranges and redirects to them.

### C3. SSO — SAML/OIDC assertion signature is never verified (account takeover)
`sso-callback/index.ts` base64-decodes the SAML response and parses it with regexes; the assertion **signature is never validated** (`:21`, `:123`). The OIDC `id_token` is likewise decoded without signature verification (`:81`, `:196`, comment admits it). The attacker-supplied `email` is then used to `supabase.auth.admin.generateLink` (service role). For any SSO-enabled config, a forged `SAMLResponse` asserting `email=victim@corp.com` yields a valid session → account takeover.
**Fix:** verify the SAML signature against the IdP certificate (use a real SAML library, not regex) and validate the OIDC `id_token` signature/issuer/audience.

---

## 🟠 High

### H1. MFA is never enforced — full session granted before verification
`useAuthStore.ts:333` sets `user` + `session` while only flipping `requiresMFA:true`; `Login.tsx:49` navigates as soon as `user` is truthy; `ProtectedRoute.tsx:38` only checks `getSession()` (now valid). Helper `authentication.ts:196` hardcodes `isMFAVerified=true` and `requireMFA()` never throws. A stolen password fully bypasses TOTP.

### H2. Login throttling fails open and is client-side only
`useLoginSecurity.ts:39` returns `blocked:false` on any error, and `Login.tsx:89` swallows throttle errors and proceeds. `signInWithPassword` isn't gated server-side — calling it directly (or DoS-ing the throttle function) bypasses brute-force protection entirely.

### H3. Chunk-load failures on major routes show an unrecoverable "Try Again"
`RouteErrorBoundary.tsx:63` wraps Profile/Tools/Dashboard/Admin *inside* Suspense, so it catches lazy-import failures before the chunk-aware `LazyLoadErrorBoundary`. Its only recovery is a re-render, but `React.lazy` caches the rejected promise → same error every click. After any deploy, users with a stale `index.html` (open tabs, shared `/username` links) get a dead button. **This hits the most-shared route in a link-in-bio product.**
**Fix:** make `RouteErrorBoundary` detect chunk errors and `window.location.reload()`, or move it outside Suspense.

### H4. Two service workers fight over scope `/`
`register-sw.ts:21` registers `/sw.js` (offline/cache); `push-notifications.ts:78` registers `/firebase-messaging-sw.js` at `{scope:'/'}`. One scope holds one registration, so whichever registers last evicts the other — logging in (FCM) silently kills offline caching and triggers a reload loop.
**Fix:** give FCM its own scope (`/firebase-cloud-messaging-push-scope`).

### H5. Auth-store listener/subscription leak
`useAuthStore.initialize()` (`:81`, `:158`) adds a `window` `storage` listener and a `supabase.auth.onAuthStateChange` subscription with no cleanup, and is called twice (`App.tsx:119`, `SSOCallback.tsx:77`). After SSO you get duplicate subscriptions → duplicate profile/role fetches on every token refresh; doubles again under StrictMode.

### H6. `useSoftDelete` — undo is broken; deletes are always permanent
`useSoftDelete.ts:107` passes `action`/`duration` shapes the toast API doesn't support, so the **Undo button never renders** and the delete `setTimeout` always fires. Worse, timers aren't cleared on unmount (`:59`) — unmounting mid-window still deletes and calls setState after unmount.

---

### H7. `generate-article` — optional auth, no rate limit, auto-publishes attacker content
`generate-article/index.ts:98` treats auth as best-effort: if `getAuthenticatedUser` returns null/throws it logs and proceeds with the service-role key. No rate limiting; it calls Claude with `max_tokens:8000` and inserts with `status:'published'` (`:384`). Anyone can burn the Claude API budget (cost DoS) and auto-publish arbitrary articles (via `topic`/`customInstructions`) live on the public blog.

### H8. Service-role key partially logged
`generate-article/index.ts:88` logs `SUPABASE_SERVICE_ROLE_KEY.substring(0,20)` plus its length. The service-role key is the RLS-bypass master secret — no portion should ever be written to logs.

---

## 🟡 Medium

### M1. Generated Supabase types are stale → most of the 709 type errors
`src/integrations/supabase/types.ts` is missing tables/RPCs that exist in applied migration `20251108000003_admin_operations_hub.sql` (`error_logs`, `system_metrics`, `get_user_statistics`, `get_system_health_summary`, `log_admin_action`, and more). Supabase then types those queries as `never`/wrong-table, so admin & SEO dashboards lose all type safety and `tsc` fails in bulk.
**Fix:** regenerate types (`supabase gen types typescript`) and wire it into CI.

### M2. TypeScript strictness is not enforced anywhere
`vite build` (the deploy path) skips type-checking, so all 709 errors ship. `build:check` exists but isn't the build command and currently can't pass.
**Fix:** run `tsc --noEmit` in CI as a required check; fix errors (starts with M1) so it can gate.

### M3. Admin routing has no authorization layer
`/admin*` routes use only `<ProtectedRoute>` (authenticated), never a `requireAdmin` guard; `AdminDashboard.tsx:31` trusts `role` read from `localStorage` (`useAuthStore.ts:587`). A user can set `role:"admin"` in `localStorage` and render admin UI. Server data stays RLS-protected, but no router-level authz exists.

### M4. `useLinks` mutations omit the ownership filter
`updateLink`/`deleteLink`/`toggleActive` (`useLinks.ts:87,115,140`) filter only `.eq('id', id)` — unlike `useListings`/`useLeads`, which also `.eq('user_id', user.id)`. Relies entirely on RLS; inconsistent with the codebase's own IDOR-defense pattern.

### M5. `oauth-proxy` — wildcard CORS + unsigned PKCE state + token in URL
`oauth-proxy/index.ts:13` hardcodes `Access-Control-Allow-Origin:'*'`; the OAuth `state` is unsigned `btoa(JSON)` carrying the PKCE `code_verifier` (`:46`), and the magic-link token is placed in a redirect query param (`:211`) where it can leak via referrer/logs.

### M6. Offline-sync feature is dead code that writes to the wrong table
`src/lib/sync-manager.ts` is never imported — the advertised "sync when back online" never runs. If wired up, it targets the `pages` table while local storage uses `listings` (`:111,135,159`), and permanently discards edits after 5 failed attempts (`:68`). It also starts an unbounded 5s `setInterval` on import.

### M7. Auto-save timer resets on every keystroke
`useAutoSave.ts:55` depends on `data`, so the 30s `setInterval` is torn down/recreated on each change — while actively editing it never elapses, defeating periodic auto-save.

### M8. Analytics write/read column mismatch
`useProfileTracking.ts:29` writes `visitor_id, device, source, location`; `useAnalytics.ts:26` reads `viewed_at, visitor_id, page_url, referrer`. The read columns are never written, so views-by-date/referrer analytics are effectively empty.

### M10. `verify_jwt=false` service-role functions with IDOR + cascade/cost abuse
- `run-scheduled-audit/index.ts` (no auth, service role): arbitrary `scheduleId`; `manualTrigger:true` bypasses the `is_active` check (`:29`) and fans out expensive SEO crawls.
- `publish-article-to-social/index.ts` (no auth, service role): arbitrary `articleId`; if `author_id` is null it posts to **all** active webhooks (`:56`) and spends the Claude key.
- `send-seo-notification/index.ts` (no auth, service role): attacker-controlled `recipients`/`customMessage` (`:49,131`) posted to a user's configured Slack/webhook with a known `alertId`.

### M11. `login-security` — unauthenticated lockout DoS + session-record forgery
`login-security/index.ts:102` is callable with the anon key and trusts body fields. Flood `record_attempt` for a victim email to exhaust the 5-attempt window and **lock them out** (M2/H2's throttle turned into a weapon); `register_session` inserts a `user_sessions` row for any `userId` with an attacker-chosen token hash.

### M12. `notify-lead` — HTML/email injection → phishing from your domain
`notify-lead/index.ts:54` + `_shared/email.ts:106` interpolate `name`/`message` into the email HTML **with no escaping** (unlike `submit-lead`, which sanitizes). An attacker sends a branded phishing email from `noreply@agentbio.net` to any chosen agent.

### M13. Client-controlled ownership fields in public lead/contact intake
`submit-lead/index.ts:60` (`user_id` from body) and `submit-contact/index.ts:50` (`agentId`/`leadId` from body) let an attacker create leads against any agent and trigger auto-response emails to arbitrary addresses. The per-IP rate limit falls back to a shared `'unknown'` bucket when `x-forwarded-for` is absent (`_shared/validation.ts:168`).

### M9. Large bundles / heavy main chunk
`three-vendor` 820 kB, `charts-vendor` 402 kB, `export-vendor` 594 kB, and the main `index` chunk is **661 kB** (193 kB gzip). 24 MB of JS across 148 chunks. Review what's in the eager main chunk and lazy-load heavy libs (three.js, recharts, xlsx/jspdf export utils) only where used.

---

## 🟢 Low / hygiene

- **L1.** `.env.local` is tracked in git (despite `.gitignore:47`) — it's the intended home of `VITE_PII_ENCRYPTION_KEY`. Untrack it: `git rm --cached .env.local`.
- **L2.** `logger.ts:72` redaction regex misses bare JWT values (JWTs contain `.`); key-name redaction still covers `{token:…}`.
- **L3.** `AuthCallback.tsx:28` navigates to an unvalidated `redirect_to` (unlike `Login.tsx`, which sanitizes). Low impact via react-router, but close the inconsistency.
- **L4.** `useLeads.addLead` (`:52`) spreads caller-supplied data without forcing `user_id: user.id` on insert (unlike `addListing`).
- **L5.** `ListingDetailModal.tsx:204` injects JSON-LD via `dangerouslySetInnerHTML`; escape `</script>` sequences in listing fields (`.replace('<','\\u003c')`).
- **L6.** `main.tsx:29` uses `getElementById('root')!`, making the `if (!rootEl)` guard dead code → blank screen with no fallback if `#root` is missing.
- **L7.** 69 raw `console.*` calls and 61 `as any` casts in `src/` — route logging through `logger`, tighten types.
- **L8.** Single-segment unknown paths (`/pricingg`) render the profile page with HTTP 200 instead of the 404 route — hurts SEO/correctness.
- **L9.** `_shared/auth.ts` `requireAdmin` uses `.single()` on `user_roles`, which throws for users with multiple role rows.
- **L10.** 1037 eslint warnings (mostly `no-explicit-any`, `no-useless-escape`) — worth burning down and setting `--max-warnings` in CI.
- **L11.** `stripe-webhook/index.ts:32` idempotency is an in-memory `Map` (per-instance, cleared on cold start). Most handlers `upsert` (safe), but the one-time `purchases` insert (`:280`) can duplicate on redelivery. (Signature verification itself is correct.)
- **L12.** `_shared/webhook-auth.ts:33` compares the **raw** API key against the SHA-256 `key_hash` column, so API-key auth silently never matches (fails closed) — a broken/dead code path.
- **L13.** Several functions return raw `error.message` to clients (`create-checkout-session:221`, `check-security-headers:243`, etc.), bypassing the sanitized `handleUnexpectedError` helper.

---

## Suggested order of work
1. **C1, C2, C3** — security holes (PII key, SSRF ×6, SSO signature bypass). Days, not weeks.
2. **H1, H2, H7, H8** — auth/MFA/throttle enforcement, `generate-article` gating, stop logging the service-role key.
3. **M1 + M2** — regenerate Supabase types, turn on the `tsc` CI gate (unblocks catching everything else).
4. **H3, H4, H5, H6** — user-facing reliability (deploys, service workers, session, deletes).
5. Backend authz hardening (M3, M4, M5, M10–M13), then remaining correctness (M6–M8), bundle (M9), then Low hygiene.

---
*Full backend detail (31 of 87 edge functions read in depth, all 12 `_shared/` modules) and per-finding failure scenarios are captured above. Solidly-implemented functions needing no action: `verify-mfa`, `api-keys`, `gdpr-deletion`, `_shared/encryption.ts`, and Stripe signature verification.*
