# SEO recovery: what is done, and what is yours

The owner-facing summary of US-147 to US-158. One page, so nothing quietly
no-ops.

**Baseline, from the Search Console export of 2026-09-08 (16 months):**
33 clicks · 1,481 impressions · average position 18.4.
Compare against this, not against last week.

---

## Done, in the code

| | What changed | Where |
| --- | --- | --- |
| US-147 | Every public route prerenders to real HTML. All 44 URLs used to serve one shell with one shared title | `scripts/prerender.mts` |
| US-148 | Blog articles prerender with their body text | `docs/deploy/BLOG_PRERENDERING.md` |
| US-149 | `sitemap.xml` generated from pages that actually rendered; four dead generators deleted | `scripts/lib/sitemap.mts` |
| US-150 | CI fails if a page loses its own title, description or canonical | `npm run verify:seo` |
| US-151 | `/auth/` unblocked in robots.txt so Google can read the noindex it now serves | `public/robots.txt` |
| US-152 | Homepage retargeted from "real estate agent bio" to "link in bio for real estate agents" | `src/config/homepage-seo.ts` |
| US-153 | 26 templated city pages noindexed until one earns its place | `docs/seo/CITY_PAGES.md` |
| US-155 | Free bio generator, serving the query the homepage dropped | `/tools/real-estate-agent-bio-generator` |
| US-156 | Comparison pages made true: 5 fabricated testimonials and 3 wrong prices removed | `src/config/competitors.ts` |
| US-157 | Invented 4.8/523 star rating removed from 31 pages; 18 invisible FAQ questions made visible | `src/components/seo/FaqSection.tsx` |
| US-158 | `/press`, link target list, outreach templates | this directory |

---

## Yours. Nothing here can be done from the code.

Ordered by how much damage leaving it undone causes.

### 1. Remove the seven remaining fabricated testimonials — *do this first*

Five were removed from the comparison pages. Seven are still live, hardcoded,
none from the `testimonials` table:

- `src/pages/tools/ListingDescriptionGenerator.tsx` — "Sarah M., Beverly Hills",
  "Mike T., Austin", "Jennifer L., Denver"
- `src/components/tools/listing-description-generator/EmailCaptureModal.tsx` —
  "Sarah M., Top Producer in Austin, TX"
- `src/components/tools/instagram-bio-analyzer/EmailCaptureModal.tsx` —
  "Jennifer K., Miami Real Estate Agent"
- `/instagram-bio-for-realtors` — "Mike R."
- `/features/analytics` — "David K."

"Sarah M." is a Luxury Agent in Austin, a Top Producer in Austin, and from
Beverly Hills, depending on the page. **These were left alone because deleting
customer-facing marketing copy is your call, not an agent's.** If they are real
people who consented, move them into the `testimonials` table and render them
like every other testimonial. If they are not, delete them.

This is first on the list because everything else on it becomes riskier while
it is true.

### 2. Commit an articles snapshot and set the deploy hook — US-148

Without these, published posts never reach the index.

```bash
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run articles:snapshot
# commit scripts/data/articles.snapshot.json
```

Then create a Cloudflare Pages deploy hook and set `CLOUDFLARE_DEPLOY_HOOK_URL`
in the Supabase edge function secrets. Steps: `docs/deploy/BLOG_PRERENDERING.md`.

**Until the snapshot is committed**, CI's build jobs carry
`PRERENDER_ALLOW_NO_ARTICLES=1`. The Cloudflare deploy must never set it.

### 3. Execute the blog consolidation — US-154, blocked

27 posts, 8 clicks between them in 16 months, and 26 of them are permutations of
one topic. The full old-slug → new-slug map is written in
`docs/seo/BLOG_CONSOLIDATION.md`. It needs the article bodies, which only exist
in production.

**Order matters:** write and publish the four guides first, *then* add the 301s,
then unpublish the old rows. Reversing the first two steps turns 26 working URLs
into 404s. The build refuses a redirect into a missing page or into another
redirect, so a mistake fails the build rather than reaching Google.

### 4. Resubmit the sitemap and read the indexing report — one-off

Search Console → Sitemaps → resubmit `https://agentbio.net/sitemap.xml`.
Then Indexing → Pages, and check how many of the 31 previously-invisible pages
move out of "Crawled – currently not indexed".

That report is the fastest confirmation that US-147 worked.

### 5. Decide about the hero's gradient text — cosmetic

`npx impeccable detect` flags gradient text on the homepage H1, which the
CLAUDE.md craft floor refuses by name. It is pre-existing and restyling it
changes the hero on six pages, so it was flagged rather than changed.

### 6. Give one city page real content — US-153

Zero of 26 are indexable. The criteria for switching one on are in
`docs/seo/CITY_PAGES.md`. It needs somebody who knows that market; inventing a
median price is exactly what that document forbids.

### 7. The outreach — US-158

Targets in `docs/seo/LINK_ACQUISITION.md`, templates in
`docs/seo/OUTREACH_TEMPLATES.md`. **No one has been contacted, no account has
been created, no listing has been submitted, and no placement exists.**

Do item 1 before this one.

---

## What to expect, and when

**Impressions will fall before clicks rise.** US-152 deliberately gave up ~180
impressions from the "real estate agent bio" cluster that produced one click in
sixteen months, and US-153 pulled 26 city pages out of the index. Both are the
change working.

The prerendering is the part with real upside: 31 pages that took *zero*
impressions in 16 months can now be read at all. Give Google a few weeks to
recrawl before judging any of it.

And the thing no amount of code fixes: position 18-20 across every page
regardless of topic is a domain with almost no inbound links. Items 1 and 7 are
what change that.
