import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SEOHead } from '@/components/SEOHead';
import { SkipNavContent } from '@/components/ui/skip-nav';

export default function CookiePolicy() {
  const lastUpdated = 'May 17, 2026';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://agentbio.net/cookies#webpage',
    url: 'https://agentbio.net/cookies',
    name: 'Cookie Policy - AgentBio',
    description:
      'How AgentBio uses cookies: strictly necessary, analytics, and preference cookies, and how to manage your consent.',
    isPartOf: { '@id': 'https://agentbio.net/#website' },
    datePublished: '2026-05-17',
    dateModified: lastUpdated,
    inLanguage: 'en-US',
  };

  return (
    <>
      <SEOHead
        title="Cookie Policy - AgentBio"
        description="Learn which cookies AgentBio uses (strictly necessary, analytics, preferences) and how to manage or withdraw your consent at any time."
        keywords={['cookie policy', 'cookies', 'GDPR cookies', 'ePrivacy', 'cookie consent']}
        canonicalUrl="https://agentbio.net/cookies"
        schema={schema}
      />
      <PublicHeader />
      <SkipNavContent>
        <main id="main-content" className="min-h-screen bg-background py-12 px-4" tabIndex={-1}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground mb-6">Last updated: {lastUpdated}</p>

              <section aria-labelledby="what-heading">
                <h2 id="what-heading" className="text-2xl font-semibold mb-4">
                  What are cookies?
                </h2>
                <p className="mb-4">
                  Cookies are small text files stored on your device when you visit a website. We
                  also use comparable technologies such as
                  <code> localStorage</code> to remember your choices and keep you signed in. This
                  policy explains which cookies AgentBio uses and how you can control them.
                </p>
              </section>

              <section aria-labelledby="necessary-heading">
                <h2 id="necessary-heading" className="text-2xl font-semibold mb-4">
                  1. Strictly necessary (always on)
                </h2>
                <p className="mb-4">
                  Required for the site to function. These cannot be switched off.
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Authentication / session</strong> — keeps you securely signed in
                    (Supabase auth tokens).
                  </li>
                  <li>
                    <strong>Security</strong> — CSRF/abuse protection and rate limiting.
                  </li>
                  <li>
                    <strong>cookie_consent_v1</strong> — remembers the choice you make in the
                    consent banner.
                  </li>
                </ul>
              </section>

              <section aria-labelledby="analytics-heading">
                <h2 id="analytics-heading" className="text-2xl font-semibold mb-4">
                  2. Analytics (consent required)
                </h2>
                <p className="mb-4">
                  Loaded <em>only</em> if you accept analytics cookies. Helps us understand
                  aggregate, anonymized usage so we can improve the product.
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Google Analytics (_ga, _gid)</strong> — anonymized IP, first-party
                    cookies only. Not loaded until consent is granted.
                  </li>
                </ul>
              </section>

              <section aria-labelledby="preferences-heading">
                <h2 id="preferences-heading" className="text-2xl font-semibold mb-4">
                  3. Preferences (consent required)
                </h2>
                <p className="mb-4">
                  Remember non-essential choices such as UI settings to personalize your experience.
                </p>
              </section>

              <section aria-labelledby="manage-heading">
                <h2 id="manage-heading" className="text-2xl font-semibold mb-4">
                  Managing your consent
                </h2>
                <p className="mb-4">
                  When you first visit AgentBio you are shown a consent banner with three choices:{' '}
                  <strong>Accept all</strong>, <strong>Reject non-essential</strong>, or{' '}
                  <strong>Manage preferences</strong>. Your choice is stored locally with a
                  timestamp. You can change it at any time by clearing site data in your browser,
                  which will re-display the banner on your next visit. Withdrawing analytics consent
                  stops Google Analytics from loading.
                </p>
              </section>

              <section aria-labelledby="contact-heading">
                <h2 id="contact-heading" className="text-2xl font-semibold mb-4">
                  Contact
                </h2>
                <p className="mb-4">
                  Questions about this policy? Email{' '}
                  <a href="mailto:privacy@agentbio.net" className="text-blue-600 underline">
                    privacy@agentbio.net
                  </a>
                  .
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
