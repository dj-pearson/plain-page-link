import * as React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Home, DollarSign } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';
import { generateEnhancedOrganizationSchema } from '@/lib/seo';
import { getBaseUrl, getCanonicalUrl } from '@/config/seo.config';
import { PRICING_PLANS } from '@/config/pricing-plans';
import {
  COMPETITORS,
  COMPETITORS_VERIFIED_LABEL,
  COMPETITOR_CELLS_NOTE,
  competitorCell,
} from '@/config/competitors';
import { FaqSection, faqPageSchema, type FaqEntry } from '@/components/seo/FaqSection';

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What's the difference between AgentBio and Linktree for real estate agents?",
    answer:
      'AgentBio includes property listing galleries with photos and pricing, real estate-specific lead capture forms, calendar booking for showings, testimonials display, and the Equal Housing logo with your license number and the MLS number on each listing. Linktree is a general-purpose link page for anyone with an audience; it is not built around listings or real estate enquiries, so compare its features on linktr.ee against what you need.',
  },
  {
    question: 'Is AgentBio better than Linktree for realtors?',
    answer:
      'For an agent collecting leads from a bio link, usually yes. AgentBio is purpose-built for agents, with property galleries, buyer and seller lead forms and showing booking. Linktree is built to be general, and it is very good at that: if you only need somewhere to point your followers, it may be all you need.',
  },
];

export default function VsLinktree() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      // BreadcrumbList was absent here while /features/*, /for/* and the
      // tools all had one (US-157).
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: getBaseUrl() },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AgentBio vs Linktree',
            item: `${getBaseUrl()}/vs/linktree`,
          },
        ],
      },
      // Enhanced Organization schema with social signals
      generateEnhancedOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': getCanonicalUrl('/vs/linktree'),
        url: getCanonicalUrl('/vs/linktree'),
        name: 'AgentBio vs Linktree for Real Estate Agents: Which is Better?',
        description:
          'Compare AgentBio and Linktree for real estate agents. AgentBio is built around property listings, buyer and seller lead capture and showing booking; Linktree is a general-purpose link page.',
      },
      faqPageSchema(FAQ_ENTRIES),
    ],
  };

  return (
    <>
      <SEOHead
        title="AgentBio vs Linktree for Real Estate Agents: Which is Better?"
        description="Compare AgentBio and Linktree for real estate agents. AgentBio is built around property listings, buyer and seller lead capture and showing booking; Linktree is a general-purpose link page."
        keywords={[
          'AgentBio vs Linktree',
          'Linktree for real estate agents',
          'best Linktree alternative realtors',
          'real estate link in bio tool',
          'Linktree vs real estate bio page',
        ]}
        canonicalUrl={getCanonicalUrl('/vs/linktree')}
        schema={schema}
      />
      <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
        <PublicHeader />

        {/* Direct Answer Section */}
        <section className="py-8 bg-background/95 border-b border-glass-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-base md:text-lg glass-body leading-relaxed">
                <strong>AgentBio is better than Linktree for real estate agents</strong> because it
                includes property listing galleries with photos and pricing, real estate-specific
                lead capture forms, calendar booking for showing appointments, testimonials display,
                and the Equal Housing logo with your license number, all built around how agents get
                enquiries. Linktree is built for general link organization, and AgentBio is
                purpose-built for converting Instagram followers into qualified buyer and seller
                leads.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="AgentBio vs Linktree for Real Estate Agents"
          subtitle="What each tool is built for, and what an agent's page needs"
          description="Linktree is built to be general. AgentBio is built for real estate. Here is what each one is for, and which features an agent's page uses."
          primaryCta={{
            text: 'Try AgentBio Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'View Pricing',
            href: '/pricing',
          }}
          badge={{
            icon: <Home className="h-4 w-4" aria-hidden="true" />,
            text: 'Purpose-Built for Real Estate',
          }}
          showStats={false}
        />

        {/* Feature Comparison Table */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">
                  Feature Comparison: AgentBio vs Linktree for Realtors
                </span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                Side-by-side comparison of features that matter to real estate professionals
              </p>
              <p className="mt-4 text-sm text-muted-foreground max-w-3xl mx-auto">
                Linktree&rsquo;s tiers checked against{' '}
                <a
                  href={COMPETITORS.linktree.homepage}
                  className="underline underline-offset-2"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  linktr.ee
                </a>{' '}
                on {COMPETITORS_VERIFIED_LABEL}. We do not quote their prices: they are shown in
                local currency and vary by region, so check theirs against ours rather than taking a
                number from us. {COMPETITOR_CELLS_NOTE}
              </p>
            </header>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse bg-glass-background backdrop-blur-md rounded-xl overflow-hidden">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="text-left p-6 glass-body font-light text-lg">Feature</th>
                    <th className="text-center p-6 glass-body font-light text-lg">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[#0f766e]">AgentBio</span>
                        <span className="text-sm text-muted-foreground">Real Estate Platform</span>
                      </div>
                    </th>
                    <th className="text-center p-6 glass-body font-light text-lg">
                      <div className="flex flex-col items-center gap-2">
                        <span>Linktree</span>
                        <span className="text-sm text-muted-foreground">
                          General-purpose link page
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: 'Property Listing Galleries',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'listingGalleries'),
                      description:
                        'Display properties with photos, pricing, beds/baths, MLS numbers',
                    },
                    {
                      feature: 'Lead Capture Forms',
                      agentbio: 'Buyer, Seller, Home Valuation',
                      linktree: competitorCell('linktree', 'realEstateLeadForms'),
                      description: 'Specialized forms to qualify leads by type',
                    },
                    {
                      feature: 'Calendar Booking',
                      agentbio: 'Calendly on your page',
                      linktree: competitorCell('linktree', 'calendarBooking'),
                      description:
                        'Your Calendly booking page opens from your profile for showings',
                    },
                    {
                      feature: 'Testimonials Display',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'testimonials'),
                      description: 'Showcase client reviews and success stories',
                    },
                    {
                      feature: 'Sold Properties Showcase',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'soldShowcase'),
                      description: 'Display past sales as social proof',
                    },
                    {
                      feature: 'Real Estate Analytics',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'realEstateAnalytics'),
                      description: 'Track which listings get most views and generate leads',
                    },
                    {
                      feature: 'Lead Scoring',
                      agentbio: 'Hot/Warm/Cold',
                      linktree: competitorCell('linktree', 'leadScoring'),
                      description: 'Prioritize leads based on engagement',
                    },
                    {
                      feature: 'Listing Disclosures',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'listingDisclosures'),
                      description: 'Equal Housing logo, license number, MLS # on each listing',
                    },
                    {
                      feature: 'Virtual Tour Integration',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'virtualTours'),
                      description: 'Embed Matterport and 3D tours',
                    },
                    {
                      feature: 'Mobile Optimization',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'mobileOptimization'),
                      description: 'Optimized for property browsing on mobile',
                    },
                    {
                      feature: 'QR Code Generation',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'qrCodes'),
                      description: 'Create QR codes for yard signs and marketing',
                    },
                    {
                      feature: 'Custom Branding',
                      agentbio: true,
                      linktree: competitorCell('linktree', 'customBranding'),
                      description: 'Match your brokerage or personal brand',
                    },
                    {
                      // Was "$39" against "$24 (Pro)". Neither survived a check:
                      // $39 is not one of our plans (they are 0, 29 and 49 in
                      // pricing-plans.ts), and Linktree publishes no single USD
                      // figure — its pricing is shown in local currency and
                      // varies by region. Compare the tiers, link to their page,
                      // and let the reader check (US-156).
                      feature: 'Plans',
                      agentbio: PRICING_PLANS.filter((p) => p.price_monthly > 0)
                        .slice(0, 2)
                        .map((p) => `${p.name} $${p.price_monthly}`)
                        .join(', '),
                      linktree: COMPETITORS.linktree.tiers.join(', '),
                      description: 'Their prices vary by region; check linktr.ee for yours',
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-glass-border/50 hover:bg-glass-background/50 transition-colors"
                    >
                      <td className="p-6">
                        <div>
                          <p className="glass-body font-light text-foreground">{row.feature}</p>
                          <p className="text-sm text-muted-foreground mt-1">{row.description}</p>
                        </div>
                      </td>
                      <td className="text-center p-6">
                        {typeof row.agentbio === 'boolean' ? (
                          row.agentbio ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="h-6 w-6 text-green-700" />
                              <span className="text-sm glass-body text-green-700">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <X className="h-6 w-6 text-red-700" />
                              <span className="text-sm glass-body text-red-700">No</span>
                            </div>
                          )
                        ) : (
                          <span className="glass-body font-light text-[#0f766e]">
                            {row.agentbio}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-6">
                        {typeof row.linktree === 'boolean' ? (
                          row.linktree ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="h-6 w-6 text-green-700" />
                              <span className="text-sm glass-body text-green-700">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <X className="h-6 w-6 text-red-700" />
                              <span className="text-sm glass-body text-red-700">No</span>
                            </div>
                          )
                        ) : (
                          <span className="glass-body text-muted-foreground">{row.linktree}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Was "Why Real Estate Agents Switch from Linktree": nothing records
            anyone switching (US-519). */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">
                  What AgentBio Adds Over Linktree for Real Estate
                </span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              {/* These three cards said what Linktree "can't" do and that its forms
                  "don't" qualify leads. Nothing recorded checking that (US-648,
                  following US-507), so they now say what AgentBio does. */}
              <ReasonCard
                icon={<Home />}
                title="Listings on Your Page"
                description="Each property shows its photos, price, beds and baths, status and MLS number on your AgentBio page, so a follower can look at the home before they enquire."
              />

              <ReasonCard
                icon={<Home />}
                title="Buyer and Seller Lead Forms"
                description="Separate buyer and seller forms ask timeline, price range and pre-approval, and every enquiry lands in your AgentBio lead inbox."
              />

              <ReasonCard
                icon={<Home />}
                title="Real Estate Details Built In"
                description="Equal Housing and license disclosures, a sold properties showcase, testimonials and a virtual tour link on each listing are part of the page, not something you assemble from links."
              />

              <ReasonCard
                icon={<DollarSign />}
                title="Price, honestly"
                description="Linktree has a free tier that covers a lot of people, and for them it is the right call. What you are paying us for is the property gallery, the lead forms and the booking — the things you would otherwise pay a web developer to build. If you are not capturing leads from Instagram, do not pay us for the ability to."
              />
            </div>
          </div>
        </section>

        {/*
          A testimonials section stood here with two quotes attributed to
          "Sarah M., Luxury Agent, Austin TX" and "Mike R., Team Leader, Miami
          FL", one of them claiming a jump from 1-2 leads a month to 8-10
          qualified inquiries.

          They were hardcoded JSX, not rows from the `testimonials` table that
          the rest of the product reads through useTestimonials — so there is no
          record of who said them, whether they said them, or whether they
          consented to being quoted. An endorsement that cannot be traced to a
          real customer is not a testimonial, and an unverifiable performance
          claim next to a named person is the kind of thing the FTC's
          endorsement guides exist for (US-156).

          Removed rather than rewritten. If these are real agents who agreed to
          be quoted, put them in the testimonials table with their consent
          recorded and render them from there like every other testimonial on
          the site.
        */}

        {/* Was "When Linktree Makes Sense (and When It Doesn't)", with a
            "Linktree Fails If You..." column. The left column now reads
            COMPETITORS.linktree.betterWhen, written to be fair to them, and the
            right column says when AgentBio fits rather than when they fail
            (US-648). */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">When to Choose Linktree, and When AgentBio</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                {COMPETITORS.linktree.builtFor}
              </p>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <h3 className="text-xl font-light text-foreground mb-4">
                    Choose Linktree if&hellip;
                  </h3>
                  <ul className="space-y-3">
                    {COMPETITORS.linktree.betterWhen.map((reason) => (
                      <li key={reason} className="glass-body">
                        &bull; {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <h3 className="text-xl font-light text-foreground mb-4">
                    Choose AgentBio if&hellip;
                  </h3>
                  <ul className="space-y-3">
                    <li className="glass-body">
                      &bull; Your bio link is where buyers and sellers first contact you
                    </li>
                    <li className="glass-body">
                      &bull; You want your listings on the page, not behind links
                    </li>
                    <li className="glass-body">
                      &bull; You want buyer and seller enquiries kept apart in one lead inbox
                    </li>
                    <li className="glass-body">
                      &bull; You want followers to book showings from your page
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Migrate */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">How to Migrate from Linktree to AgentBio</span>
              </h2>
            </header>

            <div className="max-w-3xl mx-auto space-y-6">
              <MigrationStep
                number={1}
                title="Sign up for AgentBio"
                description="Create your free account and choose your username"
              />
              <MigrationStep
                number={2}
                title="Add your profile info"
                description="Upload photo, bio and contact details"
              />
              <MigrationStep
                number={3}
                title="Add your best listings"
                description="Upload property photos and details"
              />
              <MigrationStep
                number={4}
                title="Set up lead forms"
                description="Turn on the buyer and seller inquiry forms"
              />
              <MigrationStep
                number={5}
                title="Update your Instagram bio"
                description="Replace Linktree link with your new AgentBio link"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">Ready to Try AgentBio?</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Put your listings, lead forms and booking behind your bio link
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Try AgentBio Free</span>
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

function ReasonCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#0f766e]">
          {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' })}
        </div>
        <div>
          <h3 className="text-xl font-light text-foreground mb-2">{title}</h3>
          <p className="glass-body leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function MigrationStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white font-light">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-light text-foreground mb-1">{title}</h3>
        <p className="text-sm glass-body text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
