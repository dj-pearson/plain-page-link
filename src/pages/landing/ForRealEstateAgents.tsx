import * as React from 'react';
import { getCanonicalUrl } from '@/config/seo.config';
import { Link } from 'react-router-dom';
import { Home, Users, Calendar, Star, TrendingUp, Check, X } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';
import { generateEnhancedOrganizationSchema } from '@/lib/seo';
import { FaqSection, faqPageSchema, type FaqEntry } from '@/components/seo/FaqSection';
import { PRICING_PLANS } from '@/config/pricing-plans';
import {
  CHECK_THEIR_SITE,
  COMPETITORS,
  COMPETITOR_CELLS_NOTE,
  COMPETITORS_VERIFIED_LABEL,
  competitorCell,
  type ComparisonFeature,
} from '@/config/competitors';

/**
 * The AgentBio cell of the comparison table, from the plans we actually sell.
 * It was a hard-coded 39 dollars, which is not the price of any plan (the same
 * figure US-157 removed from the homepage's JSON-LD).
 */
const AGENTBIO_PRICE_CELL = (() => {
  const paid = PRICING_PLANS.filter((p) => p.price_monthly > 0);
  const hasFree = PRICING_PLANS.some((p) => p.price_monthly === 0);
  const from = `from $${paid[0].price_monthly}`;
  return hasFree ? `Free, or ${from}` : from;
})();

/**
 * A table row whose competitor cells come from COMPETITORS (US-507). They were
 * literals here: Linktree and Beacons "Basic" lead forms, "Limited" calendar
 * booking and a cross for testimonials, none of it recorded as checked.
 */
interface TableRow {
  feature: string;
  agentbio: boolean | string;
  linktree: boolean | string;
  beacons: boolean | string;
}

const featureRow = (feature: string, key: ComparisonFeature): TableRow => ({
  feature,
  agentbio: true,
  linktree: competitorCell('linktree', key),
  beacons: competitorCell('beacons', key),
});

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: 'Why do real estate agents need a specialized link-in-bio tool?',
    answer:
      'General-purpose link-in-bio tools such as Linktree are built to hold links for anyone with an audience. AgentBio is built around how an agent gets enquiries: listing cards with photos and price, separate buyer and seller forms that ask timeline and pre-approval, and showing booking through your Calendly link. If you are not collecting leads from your bio link, a general tool may be all you need.',
  },
  {
    question: 'What features does AgentBio include for real estate agents?',
    answer:
      'AgentBio includes property listing galleries with photos and pricing, buyer and seller lead capture forms, Calendly booking for showing appointments, testimonial display, sold properties showcase, Equal Housing and license display, and real estate-specific analytics.',
  },
];

export default function ForRealEstateAgents() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      // Add Organization schema with social signals
      generateEnhancedOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': getCanonicalUrl('/for-real-estate-agents'),
        url: getCanonicalUrl('/for-real-estate-agents'),
        name: 'Link in Bio Built for Real Estate Agents | AgentBio',
        description:
          'AgentBio is a link-in-bio platform built for real estate agents: property listings, buyer and seller lead forms, and showing booking on one page your bio link opens.',
      },
      faqPageSchema(FAQ_ENTRIES),
    ],
  };

  return (
    <>
      <SEOHead
        title="Link in Bio Built for Real Estate Agents | AgentBio"
        description="AgentBio is a link-in-bio platform built for real estate agents: property listings, buyer and seller lead forms, and showing booking on one page your bio link opens."
        keywords={[
          'link in bio for real estate agents',
          'real estate link in bio tool',
          'agent bio page platform',
          'realtor link in bio',
          'real estate Instagram bio link',
        ]}
        canonicalUrl={getCanonicalUrl('/for-real-estate-agents')}
        schema={schema}
      />
      <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
        <PublicHeader />

        {/* Direct Answer Section */}
        <section className="py-8 bg-background/95 border-b border-glass-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-base md:text-lg glass-body leading-relaxed">
                <strong>
                  AgentBio is a specialized link-in-bio platform for real estate agents
                </strong>{' '}
                that includes property listing galleries, lead capture forms, calendar booking, and
                testimonials on one page. Real estate professionals use AgentBio to convert
                Instagram and social media followers into qualified buyer and seller leads through a
                mobile-optimized portfolio page.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="Link in Bio Built for Real Estate Agents"
          subtitle="A Bio Link That Turns Social Media Traffic Into Enquiries"
          description="AgentBio is a real estate portfolio behind your bio link: listings, lead forms, booking and reviews, designed for agents rather than for every kind of creator."
          primaryCta={{
            text: 'Create Your Agent Bio Page Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'See Pricing',
            href: '/pricing',
          }}
          badge={{
            icon: <Home className="h-4 w-4" aria-hidden="true" />,
            text: 'Built for Real Estate Professionals',
          }}
          showStats={false}
        />

        {/* Was "Why Generic Link-in-Bio Tools Fail for Realtors", four X-marked
            cards asserting what Linktree and Beacons cannot do. Nothing recorded
            checking those products (US-648, following US-507); the cards now say
            what an agent's page does, and the table below says how to read the
            competitor columns. */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">What a Realtor&rsquo;s Bio Link Should Do</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                {COMPETITORS.linktree.name} and {COMPETITORS.beacons.name} are general-purpose link
                pages, built for anyone with an audience. A page that wins listings and buyers has a
                narrower job:
              </p>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <div className="flex items-start gap-4 mb-4">
                    <Check
                      className="h-6 w-6 text-green-700 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-xl font-light text-foreground mb-2">
                        Your Listings, Not Just Links
                      </h3>
                      <p className="glass-body">
                        Each listing shows its photos, price, beds and baths, status and MLS number
                        on your page, so a follower sees the property before deciding to enquire.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <div className="flex items-start gap-4 mb-4">
                    <Check
                      className="h-6 w-6 text-green-700 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-xl font-light text-foreground mb-2">
                        Buyer and Seller Forms
                      </h3>
                      <p className="glass-body">
                        Separate buyer and seller forms ask the questions you would ask on the
                        phone: timeline, price range and pre-approval for buyers, the property and
                        reason for sellers.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <div className="flex items-start gap-4 mb-4">
                    <Check
                      className="h-6 w-6 text-green-700 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-xl font-light text-foreground mb-2">Showing Booking</h3>
                      <p className="glass-body">
                        Connect your Calendly link and buyers pick a showing time from your page
                        instead of trading messages with you.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <div className="flex items-start gap-4 mb-4">
                    <Check
                      className="h-6 w-6 text-green-700 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-xl font-light text-foreground mb-2">Social Proof</h3>
                      <p className="glass-body">
                        Client testimonials and your sold properties sit on the same page as your
                        active listings, where a follower deciding whether to call you can see them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AgentBio Features Real Estate Professionals Need */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">
                  AgentBio Features Real Estate Professionals Need
                </span>
              </h2>
            </header>

            <div className="max-w-5xl mx-auto space-y-8">
              <FeatureCard
                icon={<Home />}
                title="Property Listing Galleries"
                description="Display active and sold listings with full photo galleries, pricing, square footage, beds/baths, MLS numbers, and property descriptions. Add virtual tour links and mark properties as active, pending, or sold."
              />

              <FeatureCard
                icon={<Users />}
                title="Lead Capture & Qualification"
                description="Built-in forms for buyer inquiries, seller leads, and home valuation requests. Pre-qualification questions help you prioritize hot leads. Email notifications sent instantly when leads submit."
              />

              <FeatureCard
                icon={<Calendar />}
                title="Appointment Booking"
                description="Connect your Calendly link and buyers self-schedule showings from your page, without phone tag. Every booking is saved as a lead."
              />

              <FeatureCard
                icon={<Star />}
                title="Testimonial Showcase"
                description="Collect reviews through your own review link and approve each one before it shows. Star ratings appear with every review to build credibility with new visitors."
              />

              <FeatureCard
                icon={<TrendingUp />}
                title="Real Estate Analytics"
                description="Track which listings get the most views, where each lead came from (campaign, referring site, device), and which properties generate inquiries. Each lead is rated hot, warm or cold from its answers."
              />
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">AgentBio vs Generic Link Tools</span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="text-left p-4 glass-body font-light">Feature</th>
                    <th className="text-center p-4 glass-body font-light">AgentBio</th>
                    <th className="text-center p-4 glass-body font-light">Linktree</th>
                    <th className="text-center p-4 glass-body font-light">Beacons</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      featureRow('Property Listing Galleries', 'listingGalleries'),
                      featureRow('Lead Capture Forms', 'leadCaptureForms'),
                      featureRow('Calendar Booking', 'calendarBooking'),
                      featureRow('Testimonials Display', 'testimonials'),
                      featureRow('Real Estate Analytics', 'realEstateAnalytics'),
                      featureRow('Sold Properties Showcase', 'soldShowcase'),
                      featureRow('MLS # on each listing', 'mlsNumbers'),
                      {
                        // The competitor cells were "$24" and "$10", unsourced
                        // and undated (US-319). Their prices change and vary by
                        // region, so we name the tiers and send the reader to
                        // their sites, as /vs/linktree and /vs/beacons do.
                        feature: 'Price (monthly)',
                        agentbio: AGENTBIO_PRICE_CELL,
                        linktree: CHECK_THEIR_SITE,
                        beacons: CHECK_THEIR_SITE,
                      },
                    ] satisfies TableRow[]
                  ).map((row, i) => (
                    <tr key={i} className="border-b border-glass-border/50">
                      <td className="p-4 glass-body">{row.feature}</td>
                      <td className="text-center p-4">
                        {typeof row.agentbio === 'boolean' ? (
                          row.agentbio ? (
                            <Check className="h-5 w-5 text-green-700 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-700 mx-auto" />
                          )
                        ) : (
                          <span className="glass-body">{row.agentbio}</span>
                        )}
                      </td>
                      <td className="text-center p-4">
                        {typeof row.linktree === 'boolean' ? (
                          row.linktree ? (
                            <Check className="h-5 w-5 text-green-700 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-700 mx-auto" />
                          )
                        ) : (
                          <span className="glass-body text-muted-foreground">{row.linktree}</span>
                        )}
                      </td>
                      <td className="text-center p-4">
                        {typeof row.beacons === 'boolean' ? (
                          row.beacons ? (
                            <Check className="h-5 w-5 text-green-700 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-700 mx-auto" />
                          )
                        ) : (
                          <span className="glass-body text-muted-foreground">{row.beacons}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-sm text-muted-foreground">
                Linktree&rsquo;s and Beacons&rsquo; plans checked against{' '}
                <a
                  href={COMPETITORS.linktree.homepage}
                  className="underline underline-offset-2"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  linktr.ee
                </a>{' '}
                and{' '}
                <a
                  href={COMPETITORS.beacons.homepage}
                  className="underline underline-offset-2"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  beacons.ai
                </a>{' '}
                on {COMPETITORS_VERIFIED_LABEL}. We do not quote their prices, which change and vary
                by region. {COMPETITOR_CELLS_NOTE}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">Ready to Give Your Bio Link a Job?</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Turn social media traffic into qualified leads, with a page built for how agents
              actually get enquiries
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Create Your Agent Bio Page Free</span>
            </Link>
            <p className="text-sm text-muted-foreground font-light mt-4">
              No credit card required • Cancel anytime
            </p>
          </div>
        </section>

        <FaqSection entries={FAQ_ENTRIES} />
        <PublicFooter />
      </main>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border hover:border-[#80d0c7] transition-all">
      <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#0f766e]">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' })}
      </div>
      <div>
        <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
        <p className="glass-body leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
