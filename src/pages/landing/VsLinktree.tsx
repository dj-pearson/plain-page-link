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
import { COMPETITORS, COMPETITORS_VERIFIED_LABEL } from '@/config/competitors';
import { FaqSection, faqPageSchema, type FaqEntry } from '@/components/seo/FaqSection';

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What's the difference between AgentBio and Linktree for real estate agents?",
    answer:
      'AgentBio includes property listing galleries with photos and pricing, real estate-specific lead capture forms, calendar booking for showings, testimonials display, and MLS compliance features. Linktree only offers basic link organization without these real estate features.',
  },
  {
    question: 'Is AgentBio better than Linktree for realtors?',
    answer:
      "Yes, for real estate professionals. AgentBio is purpose-built for agents with features like property galleries, buyer/seller lead forms, and showing appointment booking. Linktree is a generic link tool that wasn't designed for real estate workflows.",
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
          "Compare AgentBio and Linktree for real estate agents. AgentBio includes property listings, lead capture, and calendar booking—features Linktree doesn't offer.",
      },
      faqPageSchema(FAQ_ENTRIES),
    ],
  };

  return (
    <>
      <SEOHead
        title="AgentBio vs Linktree for Real Estate Agents: Which is Better?"
        description="Compare AgentBio and Linktree for real estate agents. AgentBio includes property listings, lead capture, and calendar booking—features Linktree doesn't offer."
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
                and MLS compliance features—capabilities that generic link-in-bio tools like
                Linktree simply don't offer. Linktree works for general link organization, but
                AgentBio is purpose-built for converting Instagram followers into qualified buyer
                and seller leads.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="AgentBio vs Linktree for Real Estate Agents"
          subtitle="What a real estate agent gets that a general link tool does not"
          description="Linktree wasn't designed for real estate. AgentBio was. Discover the features real estate professionals need that generic link tools can't provide."
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
                number from us.
              </p>
            </header>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse bg-glass-background backdrop-blur-md rounded-xl overflow-hidden">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="text-left p-6 glass-body font-light text-lg">Feature</th>
                    <th className="text-center p-6 glass-body font-light text-lg">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[#80d0c7]">AgentBio</span>
                        <span className="text-sm text-muted-foreground">Real Estate Platform</span>
                      </div>
                    </th>
                    <th className="text-center p-6 glass-body font-light text-lg">
                      <div className="flex flex-col items-center gap-2">
                        <span>Linktree</span>
                        <span className="text-sm text-muted-foreground">Generic Link Tool</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: 'Property Listing Galleries',
                      agentbio: true,
                      linktree: false,
                      description:
                        'Display properties with photos, pricing, beds/baths, MLS numbers',
                    },
                    {
                      feature: 'Lead Capture Forms',
                      agentbio: 'Buyer, Seller, Home Valuation',
                      linktree: 'Basic contact only',
                      description: 'Specialized forms to qualify leads by type',
                    },
                    {
                      feature: 'Calendar Booking',
                      agentbio: 'Full Integration',
                      linktree: 'External link only',
                      description: 'Integrated Calendly/Google Calendar for showing appointments',
                    },
                    {
                      feature: 'Testimonials Display',
                      agentbio: true,
                      linktree: false,
                      description: 'Showcase client reviews and success stories',
                    },
                    {
                      feature: 'Sold Properties Showcase',
                      agentbio: true,
                      linktree: false,
                      description: 'Display past sales as social proof',
                    },
                    {
                      feature: 'Real Estate Analytics',
                      agentbio: true,
                      linktree: false,
                      description: 'Track which listings get most views and generate leads',
                    },
                    {
                      feature: 'Lead Scoring',
                      agentbio: 'Hot/Warm/Cold',
                      linktree: false,
                      description: 'Prioritize leads based on engagement',
                    },
                    {
                      feature: 'MLS Compliance',
                      agentbio: true,
                      linktree: false,
                      description: 'Equal Housing logo, license number display',
                    },
                    {
                      feature: 'Virtual Tour Integration',
                      agentbio: true,
                      linktree: false,
                      description: 'Embed Matterport and 3D tours',
                    },
                    {
                      feature: 'Mobile Optimization',
                      agentbio: 'Real estate focused',
                      linktree: 'Generic',
                      description: 'Optimized for property browsing on mobile',
                    },
                    {
                      feature: 'QR Code Generation',
                      agentbio: true,
                      linktree: true,
                      description: 'Create QR codes for yard signs and marketing',
                    },
                    {
                      feature: 'Custom Branding',
                      agentbio: 'Full customization',
                      linktree: 'Limited',
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
                              <Check className="h-6 w-6 text-green-400" />
                              <span className="text-sm glass-body text-green-400">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <X className="h-6 w-6 text-red-400" />
                              <span className="text-sm glass-body text-red-400">No</span>
                            </div>
                          )
                        ) : (
                          <span className="glass-body font-light text-[#80d0c7]">
                            {row.agentbio}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-6">
                        {typeof row.linktree === 'boolean' ? (
                          row.linktree ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="h-6 w-6 text-green-400" />
                              <span className="text-sm glass-body text-green-400">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <X className="h-6 w-6 text-red-400" />
                              <span className="text-sm glass-body text-red-400">No</span>
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

        {/* Why Real Estate Agents Switch from Linktree to AgentBio */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">
                  Why Real Estate Agents Switch from Linktree to AgentBio
                </span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <ReasonCard
                icon={<Home />}
                title="Can't Showcase Property Listings"
                description="Linktree can't display property galleries with photos, pricing, and details. You're limited to external links that send visitors away from your profile, creating friction in the buying process."
              />

              <ReasonCard
                icon={<Home />}
                title="No Lead Capture Forms"
                description="Linktree's contact forms don't differentiate buyers from sellers or ask pre-qualification questions. AgentBio's forms are built specifically for real estate lead generation."
              />

              <ReasonCard
                icon={<Home />}
                title="No Real Estate-Specific Features"
                description="MLS compliance, sold properties showcase, testimonials, and virtual tour integration are all missing from generic link tools. AgentBio includes everything real estate agents need."
              />

              <ReasonCard
                icon={<DollarSign />}
                title="Price, honestly"
                description="Linktree is cheaper, and for a lot of people it is the right call. What you are paying us for is the property gallery, the lead forms and the booking — the things you would otherwise pay a web developer to build. If you are not capturing leads from Instagram, do not pay us for the ability to."
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

        {/* When Linktree Makes Sense (and When It Doesn't) */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">
                  When Linktree Makes Sense (and When It Doesn't)
                </span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-green-500/20">
                  <h3 className="text-xl font-light text-green-400 mb-4">
                    ✓ Linktree Works If You...
                  </h3>
                  <ul className="space-y-3">
                    <li className="glass-body">• Just need to organize social media links</li>
                    <li className="glass-body">• Don't sell products or services directly</li>
                    <li className="glass-body">• Are an influencer or content creator</li>
                    <li className="glass-body">• Don't need lead capture or scheduling</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-red-500/20">
                  <h3 className="text-xl font-light text-red-400 mb-4">
                    ✗ Linktree Fails If You...
                  </h3>
                  <ul className="space-y-3">
                    <li className="glass-body">• Sell real estate or services</li>
                    <li className="glass-body">• Need to showcase products/listings</li>
                    <li className="glass-body">• Want to capture qualified leads</li>
                    <li className="glass-body">• Need appointment booking integration</li>
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
                <span className="glass-heading">
                  How to Migrate from Linktree to AgentBio in 10 Minutes
                </span>
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
                description="Upload photo, bio, contact details (5 minutes)"
              />
              <MigrationStep
                number={3}
                title="Add your best listings"
                description="Upload property photos and details (5 minutes)"
              />
              <MigrationStep
                number={4}
                title="Set up lead forms"
                description="Configure buyer and seller inquiry forms (2 minutes)"
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
              <span className="glass-heading">Ready to Upgrade from Linktree?</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Switch from a generic link tool to AgentBio's real estate platform
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Try AgentBio Free</span>
            </Link>
            <p className="text-sm text-muted-foreground font-light mt-4">
              No credit card required • Migrate in 10 minutes • Cancel anytime
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
        <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]">
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
