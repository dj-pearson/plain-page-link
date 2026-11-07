/**
 * What a visitor sees at /:username when there is no published page there.
 *
 * US-265: an agent can now take their page down (Settings, Publish). A
 * visitor holding an old link must not see any of that agent's data, and must
 * not be able to tell "unpublished" from "no such username" — otherwise the
 * page becomes a way to enumerate accounts. So both get one neutral message,
 * noindexed, with somewhere to go next. The crawler Pages Function already
 * answers both with a 404 status (US-176), which drops the page from search.
 */
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export function ProfileUnavailable() {
  return (
    <>
      <Helmet>
        <title>Page not available | AgentBio</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground">This page isn’t available</h1>
          <p className="mt-3 text-base text-muted-foreground">
            It may not be live yet, or the address may be mistyped. If an agent gave you this link,
            check it with them, or try again later.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to AgentBio
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
