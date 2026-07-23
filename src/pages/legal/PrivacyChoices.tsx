import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SEOHead } from '@/components/SEOHead';
import { SkipNavContent } from '@/components/ui/skip-nav';
import { Button } from '@/components/ui/button';
import { openCookiePreferences } from '@/lib/cookie-consent';
import { Link } from 'react-router-dom';

/**
 * "Your Privacy Choices" / "Do Not Sell or Share My Personal Information".
 *
 * CCPA/CPRA (and several US state privacy laws) require a clearly labeled,
 * standalone way for consumers to exercise opt-out and other choices. This
 * page gathers those controls in one place and links to the mechanisms that
 * actually enforce them (cookie consent, Global Privacy Control, and the
 * GDPR data-rights tools in account settings).
 */
export default function PrivacyChoices() {
  const lastUpdated = 'July 23, 2026';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://agentbio.net/privacy-choices#webpage',
    url: 'https://agentbio.net/privacy-choices',
    name: 'Your Privacy Choices - AgentBio',
    description:
      'Exercise your privacy choices at AgentBio: opt out of the sale or sharing of personal information, manage cookie consent, and access your data rights.',
    isPartOf: { '@id': 'https://agentbio.net/#website' },
    datePublished: '2026-07-23',
    dateModified: lastUpdated,
    inLanguage: 'en-US',
  };

  return (
    <>
      <SEOHead
        title="Your Privacy Choices - AgentBio"
        description="Opt out of the sale or sharing of your personal information, manage cookie consent, and exercise your data rights under CCPA/CPRA and GDPR."
        keywords={[
          'do not sell my personal information',
          'do not sell or share',
          'your privacy choices',
          'CCPA opt-out',
          'CPRA',
          'privacy rights',
        ]}
        canonicalUrl="https://agentbio.net/privacy-choices"
        schema={schema}
      />
      <PublicHeader />
      <SkipNavContent>
        <main id="main-content" className="min-h-screen bg-background py-12 px-4" tabIndex={-1}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Your Privacy Choices</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground mb-6">Last updated: {lastUpdated}</p>

              <section aria-labelledby="intro-heading">
                <h2 id="intro-heading" className="text-2xl font-semibold mb-4">
                  Exercise your choices
                </h2>
                <p className="mb-4">
                  AgentBio serves real estate professionals in the United States. Depending on where
                  you live, US privacy laws — such as the California Consumer Privacy Act
                  (CCPA/CPRA) and comparable laws in states like Virginia, Colorado, Connecticut,
                  and Texas — give you rights over your personal information. This page brings those
                  controls together in one place. For full details, see our{' '}
                  <Link to="/privacy" className="text-blue-600 underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <section aria-labelledby="sell-heading">
                <h2 id="sell-heading" className="text-2xl font-semibold mb-4">
                  Do Not Sell or Share My Personal Information
                </h2>
                <p className="mb-4">
                  <strong>
                    AgentBio does not sell your personal information, and does not share it for
                    cross-context behavioral advertising.
                  </strong>{' '}
                  Because we do not sell or share personal information as those terms are defined
                  under CCPA/CPRA, there is no sale for you to opt out of. If this ever changes, we
                  will update this page and provide an opt-out before doing so.
                </p>
                <p className="mb-4">
                  We honor the{' '}
                  <a
                    href="https://globalprivacycontrol.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Global Privacy Control (GPC)
                  </a>{' '}
                  signal. If your browser or extension sends a GPC signal, we treat it as a valid
                  request to opt out of any sale or sharing of personal information.
                </p>
              </section>

              <section aria-labelledby="cookies-heading">
                <h2 id="cookies-heading" className="text-2xl font-semibold mb-4">
                  Manage cookies &amp; tracking
                </h2>
                <p className="mb-4">
                  Analytics and preference cookies load only with your consent, and you can change
                  or withdraw that consent at any time. Withdrawing analytics consent stops Google
                  Analytics from loading.
                </p>
                <Button type="button" onClick={openCookiePreferences}>
                  Manage cookie preferences
                </Button>
                <p className="mt-4">
                  See our{' '}
                  <Link to="/cookies" className="text-blue-600 underline">
                    Cookie Policy
                  </Link>{' '}
                  for the full list of cookies we use.
                </p>
              </section>

              <section aria-labelledby="rights-heading">
                <h2 id="rights-heading" className="text-2xl font-semibold mb-4">
                  Access, export &amp; delete your data
                </h2>
                <p className="mb-4">
                  If you have an AgentBio account, you can exercise your rights to access,
                  portability, and erasure directly from your account:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Right to know / download my data</strong> — export a copy of the
                    personal information we hold about you from{' '}
                    <Link to="/dashboard/settings" className="text-blue-600 underline">
                      Settings → Privacy &amp; Data
                    </Link>
                    .
                  </li>
                  <li>
                    <strong>Right to delete my account</strong> — request deletion of your account
                    and associated data from{' '}
                    <Link to="/dashboard/settings" className="text-blue-600 underline">
                      Settings → Privacy &amp; Data
                    </Link>
                    .
                  </li>
                  <li>
                    <strong>Right to correct</strong> — update your profile information at any time,
                    or contact us for help with corrections.
                  </li>
                </ul>
              </section>

              <section aria-labelledby="submit-heading">
                <h2 id="submit-heading" className="text-2xl font-semibold mb-4">
                  Submit a request another way
                </h2>
                <p className="mb-4">
                  You do not need an account to exercise your privacy rights. To submit a request —
                  including on behalf of someone else as an authorized agent — email{' '}
                  <a href="mailto:privacy@agentbio.net" className="text-blue-600 underline">
                    privacy@agentbio.net
                  </a>
                  . We will verify your identity before acting on your request and will respond
                  within the timeframe required by applicable law. We will not discriminate against
                  you for exercising any of these rights.
                </p>
              </section>
            </div>
          </div>
        </main>
      </SkipNavContent>
      <PublicFooter />
    </>
  );
}
