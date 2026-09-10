import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * The 404 page, which until US-176 was served with HTTP 200.
 *
 * `public/_redirects` ended in `/* /index.html 200`, so every URL that matched
 * nothing — a typo, a retired link, a path a crawler invented — was answered
 * with dist/index.html. Since US-147 that file is not an empty shell: it is the
 * fully prerendered homepage. So agentbio.net/anything-at-all returned 200 with
 * the homepage's title, description and body, and only turned into this page
 * after the bundle executed and React Router matched `*`.
 *
 * A status code is the one part of that a client-side router cannot fix, which
 * is why the fix is in _redirects and in the Cloudflare Pages Function rather
 * than here. What belongs here is the page having an identity of its own: a
 * title that is not the homepage's, and a noindex, so that on the one route
 * that legitimately serves this document with a 200 — /404 itself — nothing
 * asks to be indexed.
 */
export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page not found | AgentBio</title>
        <meta name="robots" content="noindex, follow" />
        <meta
          name="description"
          content="That page does not exist. Links to the rest of the site are below."
        />
      </Helmet>

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4"
      >
        <div className="text-center">
          <div className="mb-8">
            <Home className="h-20 w-20 text-blue-600 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
              Go Home
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Go Back
            </button>
          </div>

          {/* Somewhere to go. A dead end that only offers "go back" wastes the
              visit and gives a crawler nothing to follow (US-176). */}
          <nav className="mt-12 text-sm text-gray-600" aria-label="Elsewhere on the site">
            <p className="mb-3">Or try one of these:</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              <li>
                <Link to="/pricing" className="text-blue-600 hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-blue-600 hover:underline">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-blue-600 hover:underline">
                  Free tools
                </Link>
              </li>
              <li>
                <Link to="/for-real-estate-agents" className="text-blue-600 hover:underline">
                  For real estate agents
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </main>
    </>
  );
}
