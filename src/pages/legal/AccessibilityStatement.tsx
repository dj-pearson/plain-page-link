import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SEOHead } from '@/components/SEOHead';
import { SkipNavContent } from '@/components/ui/skip-nav';
import { AccessibilityFeedbackForm } from '@/components/legal/AccessibilityFeedbackForm';

/**
 * US-239: this page used to say "substantially conformant with WCAG 2.1 AA",
 * cite a "comprehensive accessibility audit", and list features the product did
 * not have — keyboard shortcuts, alt text on all meaningful images, compliant
 * contrast, pausable animation. An accessibility statement that overclaims is
 * not a shield; it is a second, deceptive-claims exposure (the FTC's 2025 order
 * against accessiBe was over exactly this kind of claim).
 *
 * Every claim below is one the code supports, scoped to where it is true, with
 * the gaps listed as known limitations with target dates. When a limitation is
 * fixed, move it; when something regresses, add it. Wording to be reviewed by
 * counsel — this is not legal advice.
 */

// Update both when the content changes. ISO date for schema.org.
const DATE_MODIFIED = '2026-10-01';
const DATE_LABEL = 'October 1, 2026';

interface Limitation {
  area: string;
  detail: string;
  workaround?: string;
  target: string;
}

const LIMITATIONS: Limitation[] = [
  {
    area: 'Dashboard actions that need a mouse',
    detail:
      'Some dashboard actions are reached through hover-only menus or custom controls a keyboard cannot operate.',
    workaround: 'Email accessibility@agentbio.net and we will make the change for you.',
    target: 'December 2026',
  },
  {
    area: 'Reordering by drag',
    detail: 'Listings and page-builder blocks can only be reordered by dragging.',
    workaround: 'Ask us and we will reorder them for you.',
    target: 'December 2026',
  },
  {
    area: 'Dashboard labels and touch targets',
    detail:
      'Some dashboard and sign-in screens have buttons without names, fields without labels, and controls smaller than 24 × 24 pixels.',
    target: 'December 2026',
  },
  {
    area: 'Installed app (PWA)',
    detail:
      'The installed app is locked to portrait orientation, and fixed bars can cover the focused element on small screens.',
    target: 'December 2026',
  },
  {
    area: 'Page titles and focus on navigation',
    detail:
      'Dashboard and sign-in pages share one page title, and focus is not moved when you navigate between them.',
    target: 'December 2026',
  },
  {
    area: 'Charts and exports',
    detail: 'Analytics charts have no table alternative, and exported PDFs are not tagged.',
    workaround: 'We can send the underlying numbers as a spreadsheet on request.',
    target: 'March 2027',
  },
  {
    area: 'Content in other languages',
    detail:
      "Text an agent writes in a language other than English is not marked as such, so screen readers may read it with English pronunciation.",
    target: 'March 2027',
  },
  {
    area: 'Scheduling and payments (third parties)',
    detail:
      'Appointment booking is provided by Calendly and payments by Stripe. Their accessibility is theirs; we link to their statements and do not control their pages.',
    workaround:
      'You can always contact an agent by phone, email or the contact form on their page instead of booking online, and billing can be handled by email.',
    target: 'Ongoing — we choose accessible providers and report problems to them',
  },
];

export default function AccessibilityStatement() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://agentbio.net/accessibility#webpage',
    url: 'https://agentbio.net/accessibility',
    name: 'Accessibility Statement - AgentBio',
    description:
      "AgentBio's accessibility statement: partial conformance with WCAG 2.2 Level AA, how it was assessed, known limitations, and how to report a barrier.",
    isPartOf: { '@id': 'https://agentbio.net/#website' },
    about: { '@type': 'Thing', name: 'Accessibility Statement' },
    datePublished: '2026-01-12',
    dateModified: DATE_MODIFIED,
    inLanguage: 'en-US',
  };

  const linkClass = 'text-primary underline hover:no-underline';

  return (
    <>
      <SEOHead
        title="Accessibility Statement - AgentBio"
        description="AgentBio's accessibility statement: partial conformance with WCAG 2.2 Level AA, how we assessed it, known limitations with target dates, and how to report a barrier."
        keywords={['accessibility statement', 'WCAG 2.2', 'digital accessibility', 'accessible real estate website']}
        canonicalUrl="https://agentbio.net/accessibility"
        schema={schema}
      />
      <PublicHeader />
      <SkipNavContent>
        <main id="main-content" className="min-h-screen bg-background py-12 px-4" tabIndex={-1}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Accessibility Statement</h1>
            <p className="text-muted-foreground mb-10">
              Last updated: <time dateTime={DATE_MODIFIED}>{DATE_LABEL}</time>
            </p>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
              <section aria-labelledby="commitment-heading">
                <h2 id="commitment-heading" className="text-2xl font-semibold mb-4">
                  Our commitment
                </h2>
                <p>
                  AgentBio wants everyone to be able to use the pages agents build with us — home buyers and
                  sellers who use a screen reader, a keyboard, voice control, magnification or captions, and
                  agents who do. This statement says where we are, honestly, including what does not work yet.
                </p>
              </section>

              <section aria-labelledby="conformance-heading">
                <h2 id="conformance-heading" className="text-2xl font-semibold mb-4">
                  Conformance status
                </h2>
                <p>
                  We measure against the{' '}
                  <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Web Content Accessibility Guidelines (WCAG) 2.2
                  </a>{' '}
                  at Level AA.
                </p>
                <p className="font-semibold">AgentBio is partially conformant with WCAG 2.2 Level AA.</p>
                <p>
                  <em>Partially conformant</em> means that some parts of the content do not fully conform to the
                  accessibility standard. The parts that do not are listed under{' '}
                  <a href="#limitations-heading" className={linkClass}>
                    Known limitations
                  </a>
                  .
                </p>
              </section>

              <section aria-labelledby="assessment-heading">
                <h2 id="assessment-heading" className="text-2xl font-semibold mb-4">
                  How we assessed it
                </h2>
                <p>
                  This is a self-assessment by the AgentBio team, not a third-party audit. In October 2026 we:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    ran automated checks (axe-core, WCAG 2.0, 2.1 and 2.2 A and AA rules) on 61 pages, each at
                    desktop width and at iPhone and Android phone widths;
                  </li>
                  <li>
                    reviewed the code of agents’ public pages, the lead forms, sign-in and the dashboard by hand for
                    keyboard access, screen-reader names and announcements, form errors, motion, and phone layout;
                  </li>
                  <li>fixed what we found on agents’ public pages first, since that is where visitors arrive.</li>
                </ul>
                <p>
                  Automated accessibility checks run on every code change. Automated tools find only part of what
                  matters, which is why the manual review — and your reports — count.
                </p>
              </section>

              <section aria-labelledby="scope-heading">
                <h2 id="scope-heading" className="text-2xl font-semibold mb-4">
                  What this covers, and who is responsible for what
                </h2>
                <p>
                  This statement covers agentbio.net: the marketing site, the agent dashboard, agents’ public pages,
                  the installable app (PWA), the emails we send, and the files you can export.
                </p>
                <p>An agent’s page is built by two parties, so responsibility is shared:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>AgentBio is responsible for</strong> the templates, themes and components every page is
                    built from, and for giving agents the tools to make their own content accessible.
                  </li>
                  <li>
                    <strong>Agents are responsible for</strong> the content they add: describing their photos,
                    captioning or transcribing their videos, the colours they choose, and the text they write.
                  </li>
                </ul>
                <p>
                  Agents: our guide{' '}
                  <Link to="/accessibility/agents" className={linkClass}>
                    Making your page accessible
                  </Link>{' '}
                  explains each of these in a few minutes.
                </p>
              </section>

              <section aria-labelledby="features-heading">
                <h2 id="features-heading" className="text-2xl font-semibold mb-4">
                  What is in place
                </h2>
                <h3 className="text-xl font-semibold mt-6 mb-3">On agents’ public pages</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Every link, button, photo gallery and form can be reached and used with a keyboard.</li>
                  <li>Icon-only buttons have names a screen reader announces.</li>
                  <li>
                    Agents can write a description (alt text) for every listing photo; a photo without one is read
                    as its address and position, e.g. “12 Oak Lane — photo 3 of 12”.
                  </li>
                  <li>
                    Button text is chosen automatically to stay readable on the agent’s brand colour, built-in
                    themes meet WCAG contrast, and the theme editor will not save colours that fall below it.
                  </li>
                  <li>
                    Animated theme backgrounds and the featured-listing slideshow stop when your device asks for
                    reduced motion, and have a visible pause button otherwise.
                  </li>
                  <li>
                    Videos can carry captions and a transcript, and a video that starts on its own starts muted.
                  </li>
                  <li>
                    Lead forms move focus to what happens next, focus the first field that needs attention, and
                    announce the result.
                  </li>
                </ul>
                <h3 className="text-xl font-semibold mt-6 mb-3">Across the site</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A skip link at the top of each page goes straight to the main content.</li>
                  <li>Sign-in and password forms link each error to its field and move focus to it.</li>
                  <li>Error messages stay on screen until you dismiss them.</li>
                  <li>Pages reflow to a phone’s width, and you can zoom.</li>
                  <li>Emails declare their language so screen readers pronounce them correctly.</li>
                </ul>
                <h3 className="text-xl font-semibold mt-6 mb-3">The accessibility preferences button</h3>
                <p>
                  The floating accessibility button lets you enlarge text, raise contrast, underline links,
                  strengthen focus outlines and reduce motion on this site. It is a convenience for your
                  preferences. It does not make the site conform, and it is not a substitute for the work described
                  here — your own browser and assistive technology settings always come first.
                </p>
              </section>

              <section aria-labelledby="limitations-heading">
                <h2 id="limitations-heading" className="text-2xl font-semibold mb-4">
                  Known limitations
                </h2>
                <p>These are the problems we know about, and when we expect to have fixed them.</p>
                <ul className="list-none pl-0 space-y-5">
                  {LIMITATIONS.map((l) => (
                    <li key={l.area}>
                      <h3 className="text-lg font-semibold">{l.area}</h3>
                      <p className="mt-1">{l.detail}</p>
                      {l.workaround && <p className="mt-1">Until then: {l.workaround}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">Target: {l.target}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="alternative-heading">
                <h2 id="alternative-heading" className="text-2xl font-semibold mb-4">
                  Listing information in another format
                </h2>
                <p>
                  If any part of a listing or an agent’s page is not accessible to you, tell us and we will get you
                  the information another way — read to you by phone, as plain text by email, or in large print —
                  usually within 5 business days, and sooner when a showing or deadline depends on it.
                </p>
              </section>

              <section aria-labelledby="feedback-heading">
                <h2 id="feedback-heading" className="text-2xl font-semibold mb-4">
                  Report a barrier
                </h2>
                <p>
                  We aim to reply within 5 business days. Use whichever way suits you:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    The form below, which works with a keyboard and screen reader and needs no account.
                  </li>
                  <li>
                    Email:{' '}
                    <a href="mailto:accessibility@agentbio.net" className={linkClass}>
                      accessibility@agentbio.net
                    </a>
                  </li>
                  <li>
                    Post: AgentBio Accessibility, Des Moines, IA, United States
                  </li>
                </ul>
                <p>It helps to know the page, what happened, and the device or assistive technology you use — but
                  send what you have; none of it is required except a description.</p>
                <AccessibilityFeedbackForm />
              </section>

              <section aria-labelledby="escalation-heading">
                <h2 id="escalation-heading" className="text-2xl font-semibold mb-4">
                  If you are not satisfied
                </h2>
                <p>
                  Write to{' '}
                  <a href="mailto:legal@agentbio.net" className={linkClass}>
                    legal@agentbio.net
                  </a>{' '}
                  and a member of management will review the response. You may also contact the{' '}
                  <a href="https://www.ada.gov/file-a-complaint/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                    U.S. Department of Justice
                  </a>{' '}
                  or your state attorney general.
                </p>
              </section>

              <section aria-labelledby="technical-heading">
                <h2 id="technical-heading" className="text-2xl font-semibold mb-4">
                  Technologies relied upon
                </h2>
                <p>HTML, WAI-ARIA, CSS and JavaScript. We test in current versions of Chrome, Safari, Firefox and Edge.</p>
              </section>
            </div>
          </div>
        </main>
      </SkipNavContent>
      <PublicFooter />
    </>
  );
}
