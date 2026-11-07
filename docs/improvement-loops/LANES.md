# Continuous improvement loops — lanes and protocol

Started 2026-11-07. Goal: take AgentBio (web app + installable PWA, which is
what iOS and Android users run today — there is no native build in this repo)
to an enterprise-grade platform, by running many small, verified improvements
in parallel instead of one big rewrite.

## Lanes

Each lane is one agent per round. A lane only looks inside its own scope.

| Lane | Scope (where it looks) |
| --- | --- |
| `listings` | Listings: CRUD, photos, import, per-listing pages, open houses, listing display on the public profile (`src/pages/dashboard/Listings.tsx`, `src/components/listings/`, `useListings`, related functions/migrations) |
| `leads` | Leads and CRM: capture, submit-lead, lead detail, contacts/clients, routing, notifications, locked leads (`Leads.tsx`, `Clients.tsx`, `src/components/leads/`, `submit-lead`, `notify-lead`, `pii-crypto`) |
| `profile` | The agent's public page and page builder: `/:username`, themes, links, testimonials, conversion on that page |
| `uiux` | Dashboard UX across flows: onboarding, empty/loading/error states, consistency, accessibility, mobile layouts, the craft floor in CLAUDE.md |
| `performance` | Bundle weight, route weight, render cost, query cost, caching, Core Web Vitals |
| `security` | Auth, RLS, SECURITY DEFINER functions, edge-function input handling, secrets, PII, CSP |
| `enterprise` | Teams/brokerage seats, roles, SSO/MFA, audit logs, admin, billing correctness, data export, reliability of scheduled jobs |
| `marketing` | Landing, pricing, feature pages, signup funnel, activation and retention emails, referral |
| `seo` | Technical SEO and GEO (being cited by AI answer engines): prerender, sitemaps, structured data, metadata, llms.txt, content structure |
| `mobile` | PWA on iOS and Android: installability, manifest, service worker, offline, touch targets, safe areas, push, path to store builds |

## Owner decisions

- 2026-11-07: **No native iOS/Android apps yet.** Phones use the installed
  PWA. The `mobile` lane improves the PWA only; do not add Capacitor or any
  other native shell, and do not open stories for store builds.
- 2026-11-07: **Push notifications removed.** Do not add FCM/web push back.
- 2026-11-07: **Agents get a time zone setting.** Use it for reminder quiet
  hours and local-morning digests (unblocks US-318, US-343).
- 2026-11-07: **Lead statuses include `nurturing` and `closed`** in the one
  status vocabulary (unblocks US-278).
- 2026-11-07: **Silent updates stay.** The service worker keeps calling
  skipWaiting, so a deploy takes over open tabs without a Refresh prompt.

## One improvement per lane per round

1. Read `prd.json` for stories tagged with your `lane` that are not passing.
   An open slice of earlier work comes first.
2. Otherwise audit your scope and pick the single highest-value improvement
   that fits one session. Cite file:line evidence.
3. If the real fix is bigger than one session, do the first slice only and
   return the remaining slices; they become open stories for the next round.
4. Implement with tests. Run `npx tsc --noEmit` and the relevant
   `npx vitest run <paths>`; migrations must follow the RLS / SECURITY DEFINER
   rules in CLAUDE.md.
5. Do **not** edit `prd.json` or `progress.txt` — the integrator writes them,
   so parallel lanes never conflict on them.
6. An independent reviewer reads the diff before it is integrated.

## Integration

The integrator merges lanes one at a time onto the loop branch, re-runs
`tsc` and the full unit suite after each, records the story in `prd.json`
(with `lane`) and `progress.txt`, and lists owner actions (migrations to
apply, functions to redeploy, secrets to set).

## Running another round

Ask Claude in this repo: "run another improvement loop round". Each round
reads this file and the open lane stories in `prd.json`.
