# AgentBio — Product-Flow Code Review (2026-09-01)

Scope: the agent's product journey end to end. A visitor views listings and
contacts the agent on the public page; the agent is notified and works the lead
in the dashboard CRM; the agent manages listings, profile and billing; a new
agent signs up and reaches a published page. Also: architecture, routing and
repository hygiene. Security and schema were the focus of the 2026-08 review
and were not re-audited except where the product flow crosses them.

Method: six parallel read-only passes (public surface, CRM, content
management, onboarding/billing, backend pipeline, architecture), each finding
verified against `src/integrations/supabase/types.ts` and the applied
migrations. The backend pass applied all 13 migrations to a real PostgreSQL 16
and executed the exploit paths as `anon`. Every critical finding below was
re-read in source by the reviewer before a story was written.

Every finding is tracked as a story in `prd.json` (US-094 to US-127). This
document is the index; the stories carry the file:line evidence and the
acceptance criteria.

## Gate status

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run test:run` | 304 tests / 27 files pass |
| `npx eslint src/` | 0 errors, 726 warnings (CI cannot fail on them) |
| `npm run verify:migrations` | 13 files valid |
| `npm run verify:schema` on Postgres 16 | 12/12 checks, 148 tables, one pass |
| `npx knip` | 222 unused files, 264 unused exports |

The gates are green and the product is broken. Two of the three legs of the
core flow fail outright, and the green gates are the reason nobody noticed:
the failures hide behind `as unknown as` casts, swallowed errors, and RPCs
matched by name only.

## Verdict

1. **The CRM does not load.** `/dashboard/leads` selects the plaintext
   `email` and `phone` columns that US-086 dropped. Every agent sees the
   error card. (US-094)
2. **Two of the four public contact paths cannot submit.** The "Send
   Message" form omits the required lead type and agent id; the buyer form
   writes a string into a boolean for three of its four pre-approval
   answers. (US-095, US-096)
3. **Onboarding loses everything when the agent fills in Location**, which
   the placeholder invites them to do. The first listing never saves and
   the mandatory template step is never applied. (US-108)
4. **Listing edits do not reach the public page.** Edit writes the legacy
   column pair; the public page reads the other pair. (US-106)
5. **Rate limiting is off everywhere.** The shared limiter calls the RPC
   with the wrong argument names and fails open. Combined with an
   unconditional anon INSERT policy on `leads`, anyone can flood any
   agent's CRM. (US-097, US-098)
6. **Nothing guides the agent.** No follow-up reminder, no task, no
   next-step, no scheduler in the repository at all. The activity timeline
   reads a table no trigger writes to. (US-101 to US-103)
7. **Two competing public pages.** Building anything in the page builder
   silently replaces the listings-and-lead-capture profile. (US-116)

## Findings by story

| Story | Area | Severity | One line |
|---|---|---|---|
| US-094 | CRM | Critical | Leads page selects dropped columns; cache key collision with useLeads |
| US-095 | Public | Critical | ContactForm omits lead_type/user_id; dead submit-contact function |
| US-096 | Public | High | Pre-approval string into boolean; listing_id never sent; Request a Showing dead |
| US-097 | Backend | High | Anon INSERT policy on leads, unused by any form, whitelisted in verify:schema |
| US-098 | Backend | Critical | check_rate_limit called with wrong argument names; fails open in 14 functions |
| US-099 | Backend | High | Notification email has no contact info; double send; preferences ignored; trigger never configured |
| US-100 | Backend | High | log_lead_* update nonexistent last_contacted_at; workflow writes leads.score |
| US-101 | CRM | High | Modal keeps previous lead's state; contacted_at/closed_at never written |
| US-102 | CRM | High | useLeadActivities dead; UI reads lead_notes; four dead CRM components |
| US-103 | CRM | High | No next-step, tasks, SLA job, or scheduler; notification click is a no-op |
| US-104 | CRM | Medium | No pagination or status filter; stale sibling caches; CSV unquoted |
| US-105 | CRM | Medium | ML score runs on zero features; zip routing never matches; assignees cannot read leads |
| US-106 | Listings | Critical | Edit writes beds/baths, public reads bedrooms/bathrooms; 2.5 baths and "2,400" fail |
| US-107 | Listings | High | Upload failure discards the form; edit cannot manage photos; optimize-image wrong bucket |
| US-108 | Onboarding | Critical | profiles.city does not exist; first listing insert fails; template never applied |
| US-109 | Onboarding | High | Sample data publishes fake reviews and consumes the free quota |
| US-110 | Public | High | Visibility toggles unreadable by anon; pending listings hidden |
| US-111 | Public | High | Hard-coded "Available Now", "Verified", "< 1 hour", fabricated stats, SOC 2 |
| US-112 | Public | Medium | Modal placeholder photo, stray "0"s, scroll-listener leak, dead buttons |
| US-113 | Public | Medium | Accessibility of cards, modal and carousel; review page collects and discards email |
| US-114 | Public | Medium | Share links have no deep link; social unfurls show the generic card |
| US-115 | Analytics | Medium | Unthrottled view/click RPCs; page-builder pages untracked; contact taps unrecorded |
| US-116 | Architecture | High | Two public page systems; autosave loop; slug collisions |
| US-117 | Settings | High | Fake billing block; unsafe username editor; duplicate profile query shape |
| US-118 | Billing | High | Placeholder Stripe price ids; pricing copy contradicts config; cancel drops to Free today |
| US-119 | Backend | Critical | SSRF proxy, open email relay, lockout-by-anyone, workflow IDOR, unguarded webhooks, decrypt oracle |
| US-120 | Architecture | Medium | Admin search-console UI shown to agents; orphan routes; two route guards |
| US-121 | Hygiene | High | 121 root markdown files, committed PDFs/backups/screenshots, test writes into the tree |
| US-122 | Hygiene | Medium | Four edge-function deploy paths; parallel migration trees; shadow github-actions/ |
| US-123 | Config | Medium | Env alias clusters; two PII key schemes; stale .env.example; static CORS |
| US-124 | Hygiene | Low | knip: 222 unused files; unused dependencies; half-wired flags/SSO |
| US-125 | Build | Medium | 17 MB of source maps deployed; chunks over budget; lint cannot fail |
| US-126 | Architecture | Decision | SEO suite: 32 tables, 37 uncalled functions, 460 KB admin UI |
| US-127 | Product | Medium | Zillow import and custom domain advertised but unbuilt; no first-run checklist |

## Suggested order

Ship in three batches. Each batch is independently valuable to an agent.

**Batch 1 — make the flow work (US-094 to US-100, US-106, US-108, US-119).**
CRM loads, every form submits, listings edit correctly, onboarding completes,
notifications carry contact details, the limiter limits. About two weeks.

**Batch 2 — make the CRM guide (US-101 to US-105, US-107, US-110, US-111,
US-117, US-118).** Contact actions log themselves, the timeline is real,
follow-ups and the SLA job exist, pricing and billing are honest.

**Batch 3 — lay it out properly (US-116, US-120 to US-127, US-109, US-112 to
US-115).** One public page, one deployment path, a root directory a new
contributor can read, and a decision on the SEO suite.

## What was checked and found sound

Listed so the next reviewer does not repeat it: `useLeads` decrypts in one
batched call and scopes every mutation; `submit-lead` encrypts, sanitises and
uses the service role; the public `profiles` grant is 33 columns and omits the
Zapier URL and custom CSS; `enforce_plan_limit` matches the 3/5/3 free tier in
config, webhook and trigger; the Stripe functions require auth, validate price
ids and are idempotent; OAuth redirects are env-driven; the 3D hero is CSS-only
and three.js is never on first paint; all 16 trigger functions on the tenant
tables reference real columns; every edge function imports from `_shared`;
`src/types/database.ts` derives from the generated types and has not drifted;
lazy loading and the admin `SecureRoute` gate are consistent.
