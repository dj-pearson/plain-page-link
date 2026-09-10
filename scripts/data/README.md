# scripts/data

## articles.fixture.json

Three articles that do not exist, loaded **only** by a verification build — one
with `PRERENDER_ALLOW_NO_ARTICLES=1`, which is CI's build and bundle-size jobs.
A deploy must never set that flag, and `loadArticles()` does not know this file
exists, so no real build can reach it.

### Why it exists

CI ran `npm run verify:seo` with `PRERENDER_ALLOW_NO_ARTICLES=1`, which omitted
the blog entirely. So every check the build has — page identity, reachability,
structured-data URLs, internal links, FAQ visibility — ran against the marketing
pages and never saw `/blog`, `/blog/category/{slug}` or `/blog/{slug}`.

That is where several of the defects actually were:

- US-184's six broken category links were on `/blog`.
- US-180's fabricated `Person` author was on every article.
- Eight of US-185's 25 missing FAQ answers were on the two category pages.

None of those could have been caught by CI, because CI did not build the pages
they were on (US-186). Replacing "omit the blog" with "render three fixtures"
costs one prerendered page each and puts the blog inside every guard.

### What each one covers

| Fixture | Covers |
| --- | --- |
| `fixture-choosing-a-listing-photo` | A `featured_image_url` on a host this repo does not control — the branch where og:image dimensions must NOT be asserted (US-174) |
| `fixture-what-a-market-report-is-for` | No featured image, so the default social image is used and its dimensions ARE asserted; also a second registry category |
| `fixture-an-unlisted-category` | A category absent from `src/config/blog-categories.ts` — the shape that failed the whole build before US-166, and that must now warn and carry on |

### Rules

- Every title begins with `Fixture:` and every body opens by saying the article
  does not exist. If one ever reached production it should be obvious in the
  first line rather than plausible.
- The image host is under `.invalid`, a reserved TLD that can never resolve.
- Do not add a fixture to make a check pass. Add one to make a branch run.

## articles.snapshot.json

Not committed, deliberately — see US-169. It is the offline fallback for a
*real* build and has to be generated from the live database with
`npm run articles:snapshot`. A hand-written one would ship invented articles the
first time the database was unreachable, which is the opposite of what it is
for. The fixture above is not a substitute: no build that intends to deploy can
load it.
