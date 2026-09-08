/**
 * Press and product facts, at a stable URL (US-158).
 *
 * The site averages position 18-20 for everything it ranks for, which is the
 * signature of a domain with almost no inbound links. The pages that own the
 * money queries are roundups, and a roundup author who cannot find your logo,
 * your pricing and a one-paragraph description in thirty seconds writes about
 * somebody else.
 *
 * EVERY CLAIM HERE MUST BE CHECKABLE AGAINST THE PRODUCT. No customer counts,
 * no funding, no awards, no press mentions, no ratings, no testimonials.
 * US-156 found five fabricated testimonials live on the comparison pages and
 * US-157 found an invented 4.8-from-523-reviews rating on 31 pages; a press
 * page is exactly where that sort of thing gets copied into somebody else's
 * article and becomes very hard to retract. Prices come from PRICING_PLANS
 * rather than being typed in, for the same reason.
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { FaqSection, faqPageSchema, type FaqEntry } from '@/components/seo/FaqSection';
import { getCanonicalUrl, getOgImageUrl } from '@/config/seo.config';
import { PRICING_PLANS } from '@/config/pricing-plans';

const PATH = '/press';
const CANONICAL = getCanonicalUrl(PATH);

/** What the product does, in the words a journalist would use. */
const CAPABILITIES: { name: string; what: string; page: string }[] = [
  {
    name: 'Property listings',
    what: 'A gallery of active and sold properties with photos, price, beds, baths and square footage, shown on the agent’s public page.',
    page: '/features/property-listings',
  },
  {
    name: 'Lead capture',
    what: 'Buyer, seller and home-valuation forms that record where an enquiry came from, rather than a single generic contact box.',
    page: '/features/lead-capture',
  },
  {
    name: 'Calendar booking',
    what: 'Showing and consultation appointments booked from the page itself.',
    page: '/features/calendar-booking',
  },
  {
    name: 'Testimonials',
    what: 'Client reviews collected and displayed on the agent’s page, with the agent controlling what appears.',
    page: '/features/testimonials',
  },
  {
    name: 'Analytics',
    what: 'Which listings and links visitors actually opened, and where the traffic came from.',
    page: '/features/analytics',
  },
];

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: 'What is AgentBio in one sentence?',
    answer:
      'A link-in-bio page built for real estate agents, so the single link in an Instagram profile can show property listings, capture a buyer or seller enquiry and book a showing, instead of only listing other links.',
  },
  {
    question: 'How is it different from a general link-in-bio tool?',
    answer:
      'General tools organise links. AgentBio holds the listings themselves, with photos and prices, and the forms and booking that turn an enquiry into an appointment. For anything other than real estate, a general tool is usually the better choice — the comparison pages say so explicitly.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. The free plan covers a published page with a limited number of listings and links. Paid plans add unlimited listings, lead capture and booking. Current prices are on the pricing page.',
  },
  {
    question: 'Who is it for?',
    answer:
      'Individual agents, small teams and leasing or property-management agents in the United States who get enquiries through Instagram or other social profiles.',
  },
];

export default function Press() {
  const paid = PRICING_PLANS.filter((plan) => plan.price_monthly > 0);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': CANONICAL,
        url: CANONICAL,
        name: 'Press and product facts | AgentBio',
        description:
          'Product facts, logos and positioning for anyone writing about AgentBio: what it does, who it is for, and what it costs.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Press', item: CANONICAL },
        ],
      },
      faqPageSchema(FAQ_ENTRIES),
    ],
  };

  return (
    <>
      <Helmet>
        <title>Press and Product Facts | AgentBio</title>
        <meta
          name="description"
          content="Everything needed to write about AgentBio accurately: what the product does, who it is for, current pricing, and logo files to download."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:title" content="Press and Product Facts | AgentBio" />
        <meta
          property="og:description"
          content="Product facts, logos and positioning for anyone writing about AgentBio."
        />
        <meta property="og:image" content={getOgImageUrl()} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
        <PublicHeader />

        <div className="border-b border-border bg-card py-3">
          <div className="container mx-auto px-4">
            <Breadcrumb
              items={[
                { name: 'Home', url: getCanonicalUrl('/') },
                { name: 'Press', url: CANONICAL },
              ]}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <header className="max-w-[68ch]">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Press and product facts
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              For anyone writing about AgentBio, comparing it to something else, or listing it in a
              directory. Everything on this page is checkable against the product. If something here
              is out of date, tell us at{' '}
              <a href="mailto:support@agentbio.net" className="underline underline-offset-2">
                support@agentbio.net
              </a>{' '}
              and we will correct it.
            </p>
          </header>

          <section className="mt-14 max-w-[68ch]" aria-labelledby="what">
            <h2 id="what" className="text-2xl font-bold text-foreground">
              What it is
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              AgentBio is a link-in-bio page built for real estate agents. The one link an agent can
              put in an Instagram profile leads to their listings with photos and prices, forms that
              capture a buyer or seller enquiry, and a way to book a showing — rather than to a list
              of other links.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              For anything that is not real estate, a general link-in-bio tool is usually the better
              choice, and{' '}
              <Link to="/vs/linktree" className="underline underline-offset-2">
                our comparison pages say where
              </Link>
              .
            </p>
          </section>

          <section className="mt-14" aria-labelledby="does">
            <h2 id="does" className="text-2xl font-bold text-foreground">
              What it does
            </h2>
            <dl className="mt-5 max-w-[68ch] space-y-5">
              {CAPABILITIES.map((capability) => (
                <div key={capability.name}>
                  <dt className="font-semibold text-foreground">
                    <Link to={capability.page} className="underline underline-offset-2">
                      {capability.name}
                    </Link>
                  </dt>
                  <dd className="mt-1 text-muted-foreground leading-relaxed">{capability.what}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-14" aria-labelledby="pricing">
            <h2 id="pricing" className="text-2xl font-bold text-foreground">
              What it costs
            </h2>
            <p className="mt-3 max-w-[68ch] text-muted-foreground leading-relaxed">
              Monthly, in US dollars. Annual billing is discounted. These figures are read from the
              same configuration the checkout uses, so this page cannot drift from the real prices.
            </p>
            <div className="mt-5 max-w-[42rem] overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pr-6 font-semibold text-foreground">Plan</th>
                    <th className="py-3 font-semibold text-foreground">Per month</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60">
                    <td className="py-3 pr-6 text-muted-foreground">Free</td>
                    <td className="py-3 text-muted-foreground">$0</td>
                  </tr>
                  {paid.map((plan) => (
                    <tr key={plan.name} className="border-b border-border/60">
                      <td className="py-3 pr-6 text-muted-foreground">{plan.name}</td>
                      <td className="py-3 text-muted-foreground">${plan.price_monthly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground">
              <Link to="/pricing" className="underline underline-offset-2">
                Full plan comparison
              </Link>
            </p>
          </section>

          <section className="mt-14" aria-labelledby="logos">
            <h2 id="logos" className="text-2xl font-bold text-foreground">
              Logos
            </h2>
            <p className="mt-3 max-w-[68ch] text-muted-foreground leading-relaxed">
              Use these as they are. Please do not recolour them, add effects, or use the name in a
              typeface of your own.
            </p>
            <ul className="mt-5 space-y-2 text-muted-foreground">
              <li>
                <a href="/logo.png" className="underline underline-offset-2">
                  Wordmark, PNG
                </a>{' '}
                ·{' '}
                <a href="/logo.webp" className="underline underline-offset-2">
                  WebP
                </a>
              </li>
              <li>
                <a href="/Icon.png" className="underline underline-offset-2">
                  Icon, PNG
                </a>{' '}
                ·{' '}
                <a href="/Icon.webp" className="underline underline-offset-2">
                  WebP
                </a>
              </li>
              <li>
                <a href="/Cover.png" className="underline underline-offset-2">
                  Social card image, PNG
                </a>{' '}
                ·{' '}
                <a href="/Cover.webp" className="underline underline-offset-2">
                  WebP
                </a>
              </li>
            </ul>
            <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground">
              Product screenshots are not published here yet. Ask at support@agentbio.net and we
              will send current ones rather than leave stale images on a page.
            </p>
          </section>

          <section className="mt-14 max-w-[68ch]" aria-labelledby="who">
            <h2 id="who" className="text-2xl font-bold text-foreground">
              Who it is for
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Individual agents, small teams, and leasing or property-management agents in the
              United States who take enquiries through Instagram or another social profile. It is
              not a CRM, not an MLS, and not a website builder.
            </p>
          </section>

          <FaqSection
            entries={FAQ_ENTRIES}
            heading="Questions we get asked"
            headingId="press-faq"
          />
        </div>

        <PublicFooter />
      </main>
    </>
  );
}
