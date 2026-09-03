# AgentBio — Product Deep-Dive (2026-09-03)

Question asked: what else does the platform need to be a cheaper-than-a-website
showcase for an agent and their listings, a full prospect manager for buyers
and sellers, and the thing that remembers what agents forget — the open-house
sign-in, the past buyer's birthday, the home anniversary, the family details
that keep an agent top of mind for the next transaction and the referral.

Method: three parallel read-only passes over the CRM lifecycle, the public page
and open-house surface, and the messaging and scheduling infrastructure, each
checked against `src/integrations/supabase/types.ts`, the applied migrations
and the story notes in `prd.json`. Every finding below is tracked as a story
(US-128 to US-143) or as a refinement to an open one (US-124, US-126, US-127).
The stories carry the file:line evidence; this file is the index.

## What exists today

The inquiry inbox is real and, after US-094 to US-105, works: four public forms
encrypt and rate-limit through `submit-lead`, the agent is emailed with the
contact details, the Leads page filters, paginates, logs calls and emails,
sets a next step, and holds follow-up tasks. An hourly GitHub Actions cron
drives `scheduled-maintenance`, which chases unanswered leads past the agent's
SLA. Email goes out through Resend from one platform address.

The public page renders a header, contact buttons, a listings gallery with a
detail modal (photos, virtual tour, showing request via Calendly or the lead
form), sold properties, testimonials with a review invite, page-builder
blocks, links and a compliance footer, with crawler-side OG tags per listing.

## What does not exist

| Ask | State |
| --- | --- |
| A person who outlives a form submission | No contacts table. One submission is one `leads` row; the same buyer asking about three listings is three strangers, and email is ciphertext so duplicates cannot even be found. |
| Past clients, sphere, tags | No stage beyond lead status, no tags, no import. An agent with ten years of clients starts at zero. |
| Birthdays, home anniversaries, important dates | No date fields, no reminder job, no digest. Due tasks are visible only if the agent opens the dashboard that morning. |
| Buyer and seller pipelines | `converted` sets `closed_at` and the story ends: no deal, no side, no stage, no property, no price. |
| Open house | Two listing columns written by the forms and rendered nowhere; a plan flag; a 2025 spec. No event, no sign-in, no guest list, no QR, no flyer. |
| Email in the agent's name | Everything is `noreply@agentbio.net`. No unsubscribe route, no suppression list, no consent capture, no bounce handling; the privacy policy promises all of it. |
| Follow-up sequences | A complete builder with no runtime: `send_email` logs, delay is a 5-second `setTimeout`, no trigger dispatches, templates have zero rows. Sold on every paid tier. |
| Appointments | A showing request is a lead with a listing id. One Calendly URL. The feature page promises Google Calendar sync and availability rules. |
| Per-listing page and views | Listings are a `?listing=` modal; `listing_view` is not an accepted event; "see which listings visitors view most" is untrue. |
| Publish and branding controls | `is_published` has no UI; logo is a URL field; only the first service city renders; `remove_branding` has no effect; four page templates ship invented stats. |
| Honest pricing | The plan matrix sells SMS (no provider), CMA, market reports, staging, video tours and sequences; the seeded plans carry seven limits, none of those. |

## The stories

The order is the dependency order, and the first eight are the core of the
user's ask. Each is independently shippable.

| Story | Builds | Depends on |
| --- | --- | --- |
| US-128 | `contacts` and `contact_important_dates`; hashed email dedupe in `submit-lead`; backfill from leads | — |
| US-129 | People page with stages, tags, personal card, dates, unified timeline; CSV import with dedupe | 128 |
| US-130 | Lead detail shows every captured field and the listing; quick responses send; task priority; phone-width filters; one status vocabulary | — |
| US-131 | `deals` with buy and sell stage lists; pipeline board; Start a deal from a lead | 128 |
| US-132 | Mark closed: past-client stage, home-anniversary date, sold listing, review request | 131 |
| US-133 | Reminder engine on the existing hourly job: dates, due tasks, a morning digest in the agent's timezone; Coming up block | 128 (dates); digest ships alone |
| US-134 | Touch cadence per stage, overdue list, "how did you hear about me", referred-by | 128, 129 |
| US-135 | `sendClientEmail` in the agent's name with Reply-To, postal footer, consent, `/unsubscribe`, suppressions, Resend webhook | 128 |
| US-136 | Workflow runtime: trigger dispatch, durable step queue on the hourly job, real `send_email`, four seeded sequences, plan limit | 128, 135 |
| US-137 | `open_houses` events from a listing; public badge and Event JSON-LD; flyer and yard sign with QR | — |
| US-138 | Kiosk sign-in page with offline queue; guest list; instant thank-you; follow-up sequence; report | 128, 135, 137 |
| US-139 | Buyer criteria on the deal; "N buyers match this listing"; send to matching buyers | 131, 135 |
| US-140 | `appointments` with .ics and Google Calendar link, client confirmation, agent reminder; honest calendar page | 128, 135 |
| US-141 | `/:username/listing/:id` page; per-listing views; visitor history on the lead; monthly-payment line | — |
| US-142 | Publish toggle and preview; logo upload; all service areas; remove-branding; template stats removed | — |
| US-143 | Pricing matrix, feature pages, Landing and FEATURES_README reconciled to what ships | after the batch |

Refined: US-124 (dead-code sweep) now lists what the new stories claim so the
sweep does not delete it; US-126 (SEO suite decision) absorbs the two
free-tool email drips whose emails 2–7 have never sent; US-127 shares its QR
component with US-137 and adds "import your past clients" to the checklist.

## Suggested batches

**Batch A — the person and the reminder (US-128, 129, 130, 133).** Import a
past-client list on Monday, get the first birthday email on Tuesday. This is
the smallest slice that delivers the thing the user named.

**Batch B — prospects (US-131, 132, 134, 135).** Pipelines, closing, cadence,
and email in the agent's name so every later touch is compliant.

**Batch C — open house and sequences (US-136, 137, 138, 139, 140).** The
sign-in kiosk needs the event, the sender identity and the queue; build them
in that order and the follow-up sequence is the demo.

**Batch D — the showcase (US-141, 142, 143).** The listing page, the controls
an agent expects from a website, and copy that matches the product.

## Load-bearing constraints found on the way

- There is one clock: the hourly GitHub Actions cron into
  `scheduled-maintenance` (US-103). Every story that schedules anything adds a
  task to that job; none adds pg_cron or a second cron.
- The PII key lives in edge functions only (US-066), so hashing for dedupe and
  every contact write goes through a function, never a direct PostgREST insert.
- `subscription_plans` is the enforced plan matrix; `pricing-plans.ts` is
  display copy. New limits (open houses, active workflows) are seeded there
  and enforced by `enforce_plan_limit`.
- The hourly clock is too slow for an open-house thank-you; that email is
  sent synchronously by `submit-lead`.
