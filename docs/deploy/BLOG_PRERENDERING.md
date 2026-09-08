# Blog prerendering and the deploy hook

US-148. Read `docs/deploy/edge-functions.md` for how functions are deployed;
this covers only what the blog needs.

## What changed

`src/pages/BlogArticle.tsx` queries the `articles` table in the browser. Before
US-147/148 that meant a blog URL returned an empty shell, and the article text
only existed after the bundle executed *and* a Supabase round-trip resolved.
Google's first pass saw nothing. Over the 16 months to 2026-09-08 the 25 posts
other than the single 2024 one earned two clicks between them.

The build now reads the rows itself and writes `dist/blog/<slug>/index.html`
with the article already in the HTML. The React app is unchanged — the prerender
answers the app's own PostgREST query with build-time data, so the page runs
exactly the code it runs in production.

## Where the build gets articles

`scripts/lib/articles.mts`, in this order:

1. **The database**, when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are
   set to something real. Anon key only — the same RLS that governs a visitor
   governs the build, so a row the build cannot see is a row the site cannot
   show either.
2. **`scripts/data/articles.snapshot.json`**, committed, when the database is
   unreachable or the variables are absent.
3. **Nothing** — the build fails. A blog that quietly ships zero posts is how
   `public/sitemap.xml` came to contain no articles at all; it does not get to
   happen twice silently.

### Generating the snapshot

Run this anywhere that can reach the database, then commit the result:

```bash
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run articles:snapshot
```

It writes `scripts/data/articles.snapshot.json` and refuses to overwrite the
file from itself if it could not reach the database.

### PRERENDER_ALLOW_NO_ARTICLES

CI's `build` and `bundle-size` jobs set `PRERENDER_ALLOW_NO_ARTICLES=1`. They
verify that the bundle compiles and prerenders; they do not deploy, and they
have no database credentials. The flag omits the blog routes entirely rather
than emitting empty ones.

**The Cloudflare Pages deploy must never set it.** With it set and no articles,
a deploy would drop every post from the site without failing.

## The deploy hook

Because the blog is baked in at build time, an article published between deploys
exists only in the database. `supabase/functions/trigger-rebuild` asks Cloudflare
Pages for a new build; `src/hooks/useArticles.ts` calls it after a successful
publish.

The call is deliberately not awaited and its failure is not shown to the author:
the article *is* published, and an unset or briefly unreachable hook must not
look like a failed publish. It logs a warning instead.

### Configuring it

1. In the Cloudflare dashboard: **Workers & Pages → the project → Settings →
   Builds & deployments → Deploy hooks**. Create one, name it something like
   `article-published`, and point it at the production branch.
2. Copy the URL. It is a bearer secret in URL form — anyone holding it can spend
   the account's build minutes, so treat it as a credential: do not put it in
   the repository, in a commit message, or in a support ticket.
3. Set it as `CLOUDFLARE_DEPLOY_HOOK_URL` in the Supabase project's edge
   function secrets.
4. Deploy the function.

With the variable unset the function returns `{ triggered: false }` and logs
that it is not configured. Nothing breaks; the blog simply waits for the next
deploy, which is the behaviour that existed before this was written.

The function requires an authenticated caller. An open endpoint that starts a
paid build on request is a denial-of-wallet primitive.
