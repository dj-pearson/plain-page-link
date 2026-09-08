# Blog consolidation plan

US-154. **Not yet executed** — see "Why this is not done" at the bottom. This is
the map, written before anything is touched, as the story requires.

## The state of it

27 blog posts took impressions in the 16 months to 2026-09-08. Between them:
**8 clicks and 605 impressions**. Six of those clicks belong to a single post.
The other 26 earned **two clicks in sixteen months**.

They are one topic written 27 times — permutations of *agent* + *link* +
*hub / page / ideas / setup / layout*. Read the slugs in the table below in one
go and the pattern is unmistakable; Google's helpful-content signals are built
to notice exactly this, and it plausibly suppresses `/pricing` and `/vs/*` too.

The exception is instructive rather than lucky:
`how-real-estate-agents-use-link-in-bio-to-generate-more-leads-in-2024` took 162
impressions and 6 clicks at position 11.1 — **18% of the entire site's clicks
from one post**. It has a real question behind it. It is kept.

## The target: one pillar plus four guides

| # | Surviving URL | Covers |
|---|---|---|
| P | `/blog/how-real-estate-agents-use-link-in-bio-to-generate-more-leads-in-2024` **(kept, expanded)** | What a link in bio is for and how agents actually get leads from one |
| 1 | `/blog/what-to-put-on-your-real-estate-link-in-bio` *(proposed)* | What goes on the page: links, buttons, calls, QR codes |
| 2 | `/blog/linking-listings-tours-and-open-houses` *(proposed)* | Listings, showings, tours, and selling-side pages |
| 3 | `/blog/link-in-bio-for-rental-and-leasing-agents` *(proposed)* | Rentals, leasing, property management — a genuinely different audience |
| 4 | `/blog/your-real-estate-agent-profile-page` *(proposed)* | Portfolio, credentials, the online-resume angle |

The pillar keeps its slug. Its "2024" framing is refreshed in the copy; **the
slug does not change** — it is the one URL on this site with earned position,
and renaming it throws that away for tidiness.

The four proposed slugs are proposals. Whoever writes the guides may pick
better ones; the redirect map is generated from whatever they choose.

## The map

Every retired slug 301s **directly** to its survivor. No chains.

### → P (pillar, kept)

```
how-agents-get-leads-from-social-bio-links-the-complete-guide-to-converting-followers-into-clients
how-agents-send-links-online-the-complete-guide-to-converting-social-media-traffic-into-real-estate-leads
the-complete-agent-link-hub-guide-turn-social-followers-into-qualified-real-estate-leads
agent-core-link-setup-the-essential-guide-for-modern-real-estate-agents
link-hub-for-top-agents-the-secret-weapon-high-performing-realtors-use-to-convert-social-media-traffic
agent-click-page-tips-converting-social-followers-into-real-estate-leads-in-2024
link-in-bio-tool-for-real-estate-agents-turn-social-followers-into-real-clients
link-in-bio-tool-for-realtors-turn-social-media-followers-into-qualified-leads
```

### → Guide 1 (what to put on the page)

```
the-ultimate-guide-to-link-ideas-for-real-estate-pages-that-actually-convert-leads
agent-page-link-ideas-50-ways-to-convert-social-followers-into-real-estate-leads
instagram-link-ideas-for-realtors-turn-your-bio-link-into-a-lead-generation-machine
home-sales-link-ideas-smart-strategies-to-convert-social-followers-into-qualified-leads
best-contact-link-buttons-for-real-estate-agents-convert-more-social-followers-into-qualified-leads
agent-call-link-layout-how-top-real-estate-agents-convert-social-traffic-into-qualified-leads
agent-qr-code-setup-ideas-turn-print-materials-into-lead-generation-machines
```

### → Guide 2 (listings, tours, selling)

```
the-smart-agent-s-guide-to-creating-a-link-for-home-tours-that-actually-converts
how-to-link-your-active-listings-the-mobile-first-strategy-every-agent-needs
link-hub-for-listings-the-missing-piece-in-your-real-estate-marketing-strategy
home-ads-link-hub-the-mobile-command-center-every-real-estate-agent-needs-in-2024
home-selling-link-hub-the-secret-weapon-top-agents-use-to-convert-social-followers-into-qualified-seller-leads
```

### → Guide 3 (rentals and leasing)

```
the-essential-link-for-rental-agents-converting-social-followers-into-qualified-tenants
link-hub-for-leasing-agents-your-24-7-digital-business-card-that-actually-converts
the-landlord-agent-link-page-your-secret-weapon-for-property-management-lead-generation
```

### → Guide 4 (agent profile)

```
how-to-create-a-professional-real-estate-agent-portfolio-link-that-wins-clients
professional-real-estate-agent-portfolio-link-your-gateway-to-finding-the-perfect-property-professional
why-every-real-estate-agent-needs-an-online-resume-page-and-how-to-build-one-that-actually-converts
```

26 retired, 1 kept, 27 accounted for.

**This list is derived from Search Console, which only reports pages that took
at least one impression.** Any published post that took none in 16 months is not
here. Reconcile against `select slug from articles where status = 'published'`
before executing, and place the remainder.

## How to execute it, in order

The order matters. Getting it wrong turns 26 working URLs into 404s.

1. **Write the four guides** from the bodies of the posts they absorb. Publish
   them. They must exist and return 200 first.
2. **Add the redirects** to `public/_redirects`, above the SPA fallback:
   `/blog/<old-slug>  /blog/<survivor-slug>  301`. The build refuses a redirect
   whose target is not a real page, and refuses a chain (US-154 check in
   `scripts/prerender.mts`), so a mistake here fails the build rather than
   reaching Google.
3. **Unpublish** the retired rows — `update articles set status = 'draft'`.
   Do **not** delete them: the content is the only copy, and the guides are
   built from it.
4. **Rebuild.** The retired slugs leave `sitemap.xml` automatically because it
   is generated from what rendered (US-149); the guides appear with their real
   `lastmod`.
5. **Check internal links.** At the time of writing, nothing in `src/` links to
   any of the 26 — verified by grep — so there is nothing to update unless the
   guides add cross-links. Two unrelated dead internal links do exist in
   `src/lib/geo.ts`: `/blog/instagram-marketing-for-real-estate` (no such post
   in the Search Console data) and `/compare` (no such route — the comparison
   pages are at `/vs/*`). Neither is part of this consolidation; flagged for
   US-124.

## Why this is not done

Executing steps 1 and 3 requires the article bodies and write access to the
`articles` table. Both live in production; this machine has neither. Nothing in
the repository contains the content — no seed migration, no fixture, no copy.

Writing four "consolidated" guides without reading the 27 posts they replace
would mean inventing 27 posts' worth of content and calling it a merge. That is
the failure this plan exists to avoid, not a shortcut through it.

Shipping step 2 early would be worse than doing nothing: 26 URLs that currently
return 200 would 301 to guides that do not exist. **Do not add the redirects
until the guides are published.**

What is built and proven: the redirect validation in step 2, which is what makes
executing the rest safe. See `progress.txt` for US-154.
