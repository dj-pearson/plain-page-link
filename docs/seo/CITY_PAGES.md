# City pages: when one is allowed into the index

US-153. Governs the 26 `/for/{city}-real-estate-agents` pages generated from
`LOCATIONS` in `src/data/locations.ts`.

## The state of them

All 26 come from one 715-line template. What differs between any two of them:

- the city name and state abbreviation
- `medianPrice`, `agentCount`, `population`, `avgDaysOnMarket` — four numbers
- `marketDescription` — one sentence
- `neighborhoods` — a list

The title and description are string substitution on the city name alone:

```
AgentBio for {city} Real Estate Agents | Instagram Bio & Lead Generation
Join {city}, {stateAbbr} real estate agents using AgentBio to convert Instagram
followers into leads. Property listings, lead capture forms, and calendar
booking built for {city} agents.
```

Swap "Miami" for "Austin" and you have the other page.

## Why they are noindexed

Not because the template is bad. Because of when they became visible.

Across the 16 months to 2026-09-08 these pages took **zero** impressions — not
few, zero — despite being in the sitemap the whole time. They were never really
in the index, because nothing prerendered and a crawler got an empty shell. That
made them harmless.

US-147 changed that. Twenty-six near-identical pages entering the index at once,
on a domain averaging position 18-20 for everything it has, is the doorway-page
pattern: a set of pages that exist to catch a query permutation rather than to
say something. The risk is not that they fail to rank. It is that a site-wide
quality assessment notices them and the pages that *do* matter — `/pricing`,
`/vs/linktree`, the blog — pay for it.

So they ship `noindex, follow`. They still render, and they are still crawlable,
which is what lets Google read the directive at all. `follow` is deliberate:
they link to real pages and there is no reason to strand those.

## What earns `indexable: true`

Set the flag on a location in `src/data/locations.ts` when its page carries
something a reader could not get from any other city's page. All four:

1. **Local and verifiable.** A named fact about that market, from a source you
   could cite if asked — the county's recorded median, a specific MLS rule, a
   disclosure that applies in that state and not the next one. Not a number
   typed into the data file because the shape of the object wanted one.
2. **Not template-substituted.** If the sentence still reads correctly after
   replacing the city name with a different city, it is not local content. This
   is the test that catches most of it.
3. **A title and description written for that city.** Not the generated pair
   above. Two indexed pages sharing a description fails `npm run verify:seo`
   anyway, so this one is enforced rather than trusted.
4. **A reason for the page to exist.** Something an agent in that city would
   send to another agent in that city. If nobody would, the page is for a
   crawler, and that is the thing being avoided.

If you cannot meet all four, leave the flag off. A noindexed page costs nothing.

## What happens when you flip it

Nothing else to change. `locationRoutes()` in `src/config/prerender-routes.ts`
reads the flag: the page gets `index, follow` in its HTML and appears in
`sitemap.xml` on the next build. `npm run verify:seo` then holds it to the same
rules as every other indexable page, including the requirement that its title
and description are shared with no other page on the site.

## Currently indexable

**None.** Zero of the 26 are switched on.

US-153 permitted turning on up to two as worked examples, but only if they were
given substantive unique content in the same change. Writing that content means
producing verifiable claims about the Miami or Austin housing market, and
inventing plausible-looking market data is precisely what rule 1 above exists to
stop — a fabricated median price does more damage than a noindexed page. Turning
one on is a content task for somebody with a source, not a code task.

The mechanism is built and tested; the first real city page is the next step,
and it needs a person who knows that market.
