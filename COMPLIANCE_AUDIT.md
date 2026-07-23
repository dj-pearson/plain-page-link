# Compliance Audit — Legal Documents, Accessibility (ADA/WCAG) & Privacy (GDPR/CCPA)

**Date:** 2026-07-23
**Scope:** Required legal pages, WCAG 2.1 AA / ADA accessibility, and GDPR + US-state (CCPA/CPRA) privacy compliance — both the policy text and the functional implementation in code.
**Branch:** `claude/compliance-audit-docs-accessibility-vgs5rn`

This document records what was audited, the defects that were found, the fixes
applied in this change, and the items that still require a **business, legal, or
backend decision** and therefore could not responsibly be auto-fixed.

---

## 1. Executive summary

AgentBio already has an unusually mature compliance foundation: six substantive
legal pages, a working consent-gated analytics loader, a real data-export
backend, an accessibility widget, a documented a11y guideline, and an axe-core
CI job. The audit found **no missing top-level documents**, but a set of
targeted defects — one runtime crash in the privacy tooling, a broken consent
link at signup, a dead accessibility toggle, and several coverage gaps.

Findings are grouped as:

- **A. Fixed in this change** — unambiguous defects fixed with high confidence.
- **B. Requires business / legal input** — facts only the owner can supply
  (physical address, legal entity) or drafting decisions.
- **C. Requires backend work** — notably, account deletion does not actually
  erase data. This is the highest-severity open item.

---

## 2. Fixed in this change (Section A)

| # | Area | Defect | Fix |
|---|------|--------|-----|
| A1 | Privacy tooling (GDPR) | `src/hooks/useGDPR.ts` used `edgeFunctions` without importing it → `ReferenceError`, crashing the Settings "Privacy & Data" panel (export / delete / cancel all threw). | Imported `callEdgeFunction`/`edgeFunctions`; GET status & export now use `callEdgeFunction` (which honours `method: 'GET'`, matching the working `DeleteAccount.tsx`); removed the unused `supabase` import. |
| A2 | Consent at signup | `src/pages/auth/Register.tsx` linked the Acceptable Use Policy to `/legal/acceptable-use`, a 404 (real route is `/acceptable-use`). | Corrected the href to `/acceptable-use`. |
| A3 | Document discoverability | Cookie Policy (`/cookies`) was reachable only from the dismissible cookie banner — not linked in the footer. | Added **Cookie Policy** and **Your Privacy Choices** links plus a **Cookie Preferences** control to `PublicFooter`. |
| A4 | Accessibility (WCAG 2.3.3) | The accessibility widget's **"Reduce Motion"** toggle set a class/variable that **no CSS consumed** — a dead no-op; animations kept playing for users without an OS preference. | Added a `.a11y-reduced-motion` rule in `src/index.css` mirroring the `prefers-reduced-motion` media query. |
| A5 | Accessibility (landmarks / WCAG 2.4.1) | The public profile page (`FullProfilePage.tsx`) — a primary, high-traffic page — had no `<main id="main-content">`, so the global skip-link went nowhere and the page had no `main` landmark. | Converted the page's content wrapper to `<main id="main-content" tabIndex={-1}>`. |
| A6 | Accessibility (forms / WCAG 3.3.2, 1.3.1) | `FormField`/`TextareaField` showed a visual `*` but never exposed `required`/`aria-required`; label/error association silently broke if the caller omitted `id`. | Forwarded `required` + `aria-required`, marked the `*` `aria-hidden`, and added a `useId()` fallback so association always works. |
| A7 | Notice at collection (GDPR Art. 13 / CCPA / CAN-SPAM) | The four public lead-capture forms (Contact, Buyer, Seller, Home Valuation) collected name/email/phone with only a plain "your info is secure" line — no Privacy Policy link or consent notice. | Added a shared `FormPrivacyNotice` component (links Terms + Privacy, states consent to be contacted) to all four forms. |
| A8 | Withdraw consent (GDPR — as easy to withdraw as to give) | Once a cookie choice was stored, there was **no way to re-open** the banner short of clearing browser data. | Added `openCookiePreferences()` + a re-open event the banner listens for (seeded with the stored choice); wired to a footer **Cookie Preferences** button and the new Privacy Choices page. |
| A9 | CCPA/CPRA opt-out surface | No "Do Not Sell or Share / Your Privacy Choices" page or link existed anywhere. | Added `src/pages/legal/PrivacyChoices.tsx` at route `/privacy-choices` (Do-Not-Sell statement, GPC honoring, cookie controls, links to data export/delete), linked from the footer; updated Cookie Policy copy to reference the new controls. |

**Files touched (Section A):**
`src/hooks/useGDPR.ts`, `src/pages/auth/Register.tsx`,
`src/components/layout/PublicFooter.tsx`, `src/index.css`,
`src/pages/public/FullProfilePage.tsx`, `src/components/forms/FormField.tsx`,
`src/components/forms/FormPrivacyNotice.tsx` (new), `ContactForm.tsx`,
`BuyerInquiryForm.tsx`, `SellerInquiryForm.tsx`, `HomeValuationForm.tsx`,
`src/lib/cookie-consent.ts`, `src/components/ui/cookie-consent.tsx`,
`src/pages/legal/PrivacyChoices.tsx` (new), `src/App.tsx`,
`src/pages/legal/CookiePolicy.tsx`.

Type-check (`tsc --noEmit`) passes with no new errors (one pre-existing
`baseUrl` deprecation notice is unrelated to this change).

---

## 3. Requires business / legal input (Section B)

These are **facts or drafting decisions only the business can make** — they were
deliberately **not** auto-filled to avoid publishing incorrect legal statements.

### B1. Placeholder physical addresses — **compliance blocker** 🔴
Three published documents ship a bracketed placeholder address:
- `src/pages/legal/PrivacyPolicy.tsx:474-475` — `[Physical Address - To be added]` / `Des Moines, IA [ZIP]`
- `src/pages/legal/TermsOfService.tsx:185` — `Address: [Physical Address - To be added]`
- `src/pages/legal/DMCAPolicy.tsx:64-65` — `Physical Address: [To be added]` / `Des Moines, IA [ZIP]`

Why it matters: **CAN-SPAM** requires a valid physical postal address (the
Privacy Policy itself promises one), and the **DMCA §512(c) safe harbor** — a
core protection for a real-estate photo platform per `Legal.md` — requires a
complete, registered designated-agent address. **Action:** replace all three
with the real registered business address.

### B2. Legal entity is never named
Every document uses the trade name "AgentBio.net" but never states the operating
entity. `Legal.md` assumes an **Iowa LLC** (and prescribes signing "as [Name],
Manager of AgentBio.net, LLC"). **Action:** state the full legal entity
(e.g., "AgentBio.net, LLC") in Terms, Privacy, and DMCA.

### B3. DMCA designated-agent registration claim
`DMCAPolicy.tsx:67` states the agent "is registered with the U.S. Copyright
Office," but the address is a placeholder. **Action:** complete the $6
registration at dmca.copyright.gov and fill in the real agent details, or soften
the claim until done. (Registration expires every 3 years — set a renewal
reminder.)

### B4. GDPR substance in the Privacy Policy — **not required (US-only)**
**Decision (2026-07-23, product owner): AgentBio targets US realtors and does
not expect EU/EEA/UK customers.** Full GDPR drafting (Art. 6 legal bases,
restriction/objection rights, Chapter V transfer safeguards / SCCs,
supervisory-authority complaint right, Art. 27 representative) is therefore
**out of scope** and deferred unless the EU/UK ever becomes a target market.

Residual cleanup (low priority, not a compliance blocker):
- The Privacy Policy and Cookie Policy list "GDPR" as an SEO keyword only
  (`PrivacyPolicy.tsx:32`, `CookiePolicy.tsx:28`); consider replacing with
  US-relevant terms (CCPA/CPRA, "US state privacy laws") to match scope.
- The standalone `DeleteAccount.tsx` copy cites "GDPR Article 17"; the right to
  delete also exists under CCPA and other US state laws, so the reference is not
  wrong, but US framing would be more accurate to the audience.

The `/privacy-choices` page and lead-form notices added in this change are
**US-framed** (CCPA/CPRA + comparable state laws, GPC honoring).

### B5. CPRA "Notice at Collection" & rights-gating
- Add a formal **Notice at Collection** (categories + purposes + retention) — the
  point-of-collection notice on forms was added (A7), but the policy-level notice
  is still needed. *(Still open.)*
- ~~`PrivacyPolicy.tsx:291-293` gates consumer rights on business thresholds.~~
  **Fixed (2026-07-23):** reworded so California residents' rights are no longer
  conditioned on CCPA applicability thresholds; AgentBio now states it honors
  verified requests regardless. Have counsel confirm the final wording.

### B6. "Last updated" date inconsistency
Four docs compute `new Date().toLocaleDateString()` at render (so the date is
always *today*) while declaring `datePublished: "2024-01-01"` in JSON-LD; two
others hardcode different dates. **Action:** use real, static revision dates per
document (a fixed constant), consistent with the schema.

### B7. Cookie Policy vs Privacy Policy category mismatch
`PrivacyPolicy.tsx:354` lists a **"Targeting Cookies"** category that the Cookie
Policy does not (necessary / analytics / preferences only). Reconcile the two,
and add a per-cookie table with names, purpose, provider, and **expiry**.

### B8. Keep internal `Legal.md` out of the public build
`Legal.md` is an internal legal **research memo** (discusses litigation exposure,
cost strategy, veil-piercing). Confirm it is not served publicly.

---

## 4. Requires backend work (Section C)

> **UPDATE (2026-07-23): processor now implemented — deploy + schedule required.**
> A durable-audit deletion processor was added:
> `supabase/migrations/20260723000001_process_account_deletions.sql`
> (creates `account_deletion_log` + `process_scheduled_account_deletions()`) and
> the service-role-guarded edge function
> `supabase/functions/process-account-deletions/`. **Applying the migration is
> non-destructive** — nothing deletes until you enable the pg_cron schedule (a
> commented block at the bottom of the migration) or call the edge function from
> your scheduler with the service-role key. The `DeleteAccount.tsx` copy was also
> corrected (no more false "deactivated immediately"). **Remaining owner action:**
> deploy the migration + function, then enable one scheduling path, and verify an
> end-to-end erasure in staging before production.

### C1. Right to Erasure does not actually delete data — **highest severity** 🔴
`request_account_deletion` only **inserts a row** into
`account_deletion_scheduled` (`supabase/migrations/20251204000001_auth_security_features.sql:617-679`);
**no edge function, RPC, or cron job ever processes that queue.** The columns
`executed`, `executed_at`, `anonymization_completed` are never set, and there is
no immediate deactivation. Consequently, after the 30-day grace period the
account and all data **remain intact indefinitely** — the **CCPA / US state-law
right to delete** is not fulfilled. (This remains the top open item even though
GDPR is out of scope — the right to delete applies under US state privacy laws
too.)

`DeleteAccount.tsx:159-160` also overstates this ("deactivated immediately and
fully removed after a 30-day grace period"), which is currently inaccurate.

**Recommended action (not auto-applied — destructive, needs review/testing):**
1. Implement a scheduled processor (Supabase `pg_cron` or a scheduled edge
   function) that selects `account_deletion_scheduled` rows past `scheduled_for`
   with `cancelled = false AND executed = false`, deletes/anonymizes the user +
   cascaded data (via `auth.admin.deleteUser` and dependent tables), and sets
   `executed`/`executed_at`/`anonymization_completed`.
2. Optionally have `request_account_deletion` set an immediate `deactivated`
   flag and gate login on it, to make the "deactivated immediately" copy true.
3. Once implemented, reconcile the two parallel deletion UIs
   (`GDPRSettings` via `useGDPR` — now fixed — and the standalone
   `DeleteAccount.tsx` page) so users have one consistent flow.

The processor described above implements steps 1 and 3 (and corrects the copy);
the cron/edge scheduling that actually *runs* it is intentionally left for the
owner to enable and test, since it is destructive and cannot be validated in
this environment. Optional step 2 (immediate deactivation flag) is not yet
implemented.

### C2. No server-side consent ledger
Cookie consent is timestamped/versioned **only in `localStorage`**; there is no
server-side record. For GDPR proof-of-consent, persist a consent record
(user/anon id, choices, version, timestamp, IP/UA) server-side. (Export/deletion
*requests* are already logged server-side — this gap is specifically the
cookie-consent record.)

### C3. Confirm Cloudflare RUM beacon is consent-gated
The CSP allowlists `static.cloudflareinsights.com` / `cloudflareinsights.com`.
If Cloudflare Web Analytics/RUM is enabled at the edge, its beacon runs **outside**
the app's consent gate. Verify in the Cloudflare dashboard; disable or account
for it in the Cookie Policy. (First-party GA is correctly consent-gated.)

---

## 5. Accessibility — remaining lower-priority items (tracked, not blocking)

- **CI axe job is warn-only.** `.github/workflows/ci.yml` sets
  `continue-on-error: true`, and `tests/a11y/accessibility.spec.ts` only fails
  above a **baseline that bakes in existing violations** — including a
  **critical `button-name`** on the landing page and pervasive `color-contrast`.
  Drive the baseline toward zero, then drop `continue-on-error` to make a11y a
  real gate.
- **Duplicate skip-link components** (`components/SkipLink.tsx` vs
  `components/ui/skip-nav.tsx`) both render on the dashboard — consolidate.
- **Orphan `.a11y-large-cursor` CSS** exists with no widget control — add the
  control or remove the CSS.
- **Page-builder alt text** (`ImageBlock`, `VideoBlock`) derives `alt` from
  author config with no enforcement — consider requiring alt in the editor.

---

## 6. What was verified as already compliant ✅

- All six legal routes exist and resolve; five were already footer-linked (now
  all, plus Cookie Policy & Privacy Choices).
- Cookie banner is **global**, offers granular Accept / Reject / Manage, and is
  **persisted**; the deferred Google Analytics loader is **genuinely
  consent-gated** and reacts live to opt-in/opt-out. No unconditional trackers in
  `index.html`.
- **Data export** backend (`supabase/functions/gdpr-export`) is real and
  comprehensive (auth, rate-limited, secret-redacted, downloadable JSON) — and is
  now reachable from the UI again after the A1 fix.
- Signup has a required Terms/Privacy/Acceptable-Use consent checkbox (link fixed
  in A2).
- Strong a11y baseline: global skip link, semantic landmarks + ARIA labels,
  `focus-visible` rings, forced-colors support, focus trap/restore, route
  announcer, consistent `alt`/`aria-label` usage, `html lang`, zoom not disabled.

---

## 7. Recommended next steps (priority order)

1. **C1 (deploy)** — processor is now implemented; **deploy the migration + edge
   function, enable one scheduling path, and verify an end-to-end erasure in
   staging.** This is the last step to actually satisfy the right to delete.
2. **B1 / B2 / B3** — fill physical address, name the legal entity, complete DMCA agent registration.
3. **B5 (remaining)** — add a policy-level CPRA "Notice at Collection." (Threshold-gating already fixed; **B4 GDPR drafting is out of scope — US-only.**)
4. **C2 / C3** — server-side consent ledger; confirm Cloudflare RUM gating.
5. **Accessibility CI** — reduce the axe baseline to zero and make the job blocking.
6. **B6 / B7** — fix date handling and reconcile cookie categories.
