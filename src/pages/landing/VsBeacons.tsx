import * as React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Home } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';
import { generateEnhancedOrganizationSchema } from '@/lib/seo';
import { getBaseUrl, getCanonicalUrl } from '@/config/seo.config';
import { FaqSection, faqPageSchema, type FaqEntry } from '@/components/seo/FaqSection';
import { PRICING_PLANS, linkAllowanceSummary } from '@/config/pricing-plans';
import {
  COMPETITORS,
  COMPETITORS_VERIFIED_LABEL,
  COMPETITOR_CELLS_NOTE,
  competitorCell,
} from '@/config/competitors';

/*
 * Every AgentBio figure on this page comes from PRICING_PLANS, and nothing
 * here quotes a Beacons price (US-501, following US-156 on /vs/linktree and
 * /vs/later). The page used to compare our Professional price with a bare
 * Beacons figure, rate the ROI "High" against "Low" and say agents "report"
 * a number of qualified leads a month, with nothing behind any of them, and it
 * gave AgentBio unlimited links although Free and Starter are capped.
 */
const PAID_PLANS = PRICING_PLANS.filter((p) => p.price_monthly > 0).sort(
  (a, b) => a.price_monthly - b.price_monthly
);
const FREE_PLAN = PRICING_PLANS.find((p) => p.price_monthly === 0);

/** Every paid plan, e.g. "Starter $29, Professional $49, Team $99, Enterprise $299" */
const AGENTBIO_PLANS_CELL =
  PAID_PLANS.length > 0
    ? PAID_PLANS.map((p) => `${p.name} $${p.price_monthly}`).join(', ')
    : 'No paid plans';

/** e.g. "3 listings, 5 links" */
const AGENTBIO_FREE_CELL = FREE_PLAN
  ? `${FREE_PLAN.limits.listings} listings, ${FREE_PLAN.limits.links} links`
  : 'No free plan';

/** e.g. "5 on Free, 15 on Starter, unlimited from Professional" */
const AGENTBIO_LINKS_CELL = linkAllowanceSummary();

/*
 * Names every paid plan. A two-plan "from X to Y" range understated the top
 * of the range (Team and Enterprise cost more than Professional).
 * e.g. "paid plans at $29 (Starter), $49 (Professional), $99 (Team) and $299 (Enterprise) a month"
 */
const PAID_PLANS_PHRASE = ((): string => {
  const parts = PAID_PLANS.map((p) => `$${p.price_monthly} (${p.name})`);
  if (parts.length === 0) return '';
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `paid plan${parts.length === 1 ? '' : 's'} at ${list} a month`;
})();

const AGENTBIO_PLANS_SENTENCE = [
  FREE_PLAN ? `a free plan (${AGENTBIO_FREE_CELL})` : '',
  PAID_PLANS_PHRASE,
]
  .filter(Boolean)
  .join(' and ');

const PRICE_FAQ_ANSWER = `${
  AGENTBIO_PLANS_SENTENCE ? `AgentBio has ${AGENTBIO_PLANS_SENTENCE}. ` : ''
}We do not quote Beacons' prices, because they change and a copy on our site would soon be wrong; compare their plans on beacons.ai with ours. The more useful question is which features you will use: AgentBio's plans pay for listings, lead forms and showing booking, Beacons' for creator tools like a store and a media kit.`;

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What's the difference between AgentBio and Beacons for real estate agents?",
    answer:
      "AgentBio is built specifically for real estate agents with property listing galleries, real estate lead capture forms, calendar booking for showings, and the MLS number on each listing. Beacons is designed for content creators and influencers with email marketing and store features that aren't relevant for real estate workflows.",
  },
  {
    question: 'Is AgentBio better than Beacons for realtors?',
    answer:
      "Yes, for real estate professionals. While Beacons offers more features than basic link tools, it's designed for creators selling digital products and courses. AgentBio focuses exclusively on what real estate agents need: showcasing properties, capturing buyer/seller leads, and booking showing appointments.",
  },
  {
    question: 'Can Beacons show real estate listings?',
    answer:
      "No. Beacons doesn't have property listing gallery features. You can add basic links to listings, but without built-in photo galleries, pricing displays, bed/bath counts, or active/sold status that real estate agents need to properly showcase properties.",
  },
];

export default function VsBeacons() {
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
            name: 'AgentBio vs Beacons',
            item: `${getBaseUrl()}/vs/beacons`,
          },
        ],
      },
      // Enhanced Organization schema with social signals
      generateEnhancedOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': getCanonicalUrl('/vs/beacons'),
        url: getCanonicalUrl('/vs/beacons'),
        name: 'AgentBio vs Beacons for Real Estate Agents: Detailed Comparison',
        description:
          'Compare AgentBio and Beacons for real estate agents. While Beacons offers creator tools, AgentBio provides real estate-specific features like property listings, lead capture, and Equal Housing, license and MLS number disclosures.',
      },
      faqPageSchema(FAQ_ENTRIES),
    ],
  };

  return (
    <>
      <SEOHead
        title="AgentBio vs Beacons for Real Estate Agents: Which to Choose?"
        description="Compare AgentBio and Beacons for real estate agents. While Beacons offers creator tools, AgentBio provides real estate-specific features like property listings, lead capture, and Equal Housing, license and MLS number disclosures."
        keywords={[
          'AgentBio vs Beacons',
          'Beacons for real estate agents',
          'Beacons alternative for realtors',
          'real estate link in bio tool',
          'best link in bio for agents',
        ]}
        canonicalUrl={getCanonicalUrl('/vs/beacons')}
        schema={schema}
      />
      <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
        <PublicHeader />

        {/* Direct Answer Section */}
        <section className="py-8 bg-background/95 border-b border-glass-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-base md:text-lg glass-body leading-relaxed">
                <strong>AgentBio is better than Beacons for real estate agents</strong> because it's
                purpose-built for real estate workflows with property listing galleries, the MLS
                number on each listing, real estate-specific lead capture forms, and showing
                appointment booking. While Beacons offers advanced features like email marketing and
                online stores, these creator-focused tools aren't relevant for real estate agents
                who need to showcase properties and capture buyer/seller leads, not sell digital
                products or courses.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="AgentBio vs Beacons for Real Estate Agents"
          subtitle="Creator Tools vs Real Estate Tools: Why the Difference Matters"
          description="Beacons is built for content creators and influencers. AgentBio is built for real estate professionals. Discover why real estate-specific features convert more Instagram followers into qualified leads."
          primaryCta={{
            text: 'Try AgentBio Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'See Feature Comparison',
            href: '#comparison',
          }}
          badge={{
            icon: <Home className="h-4 w-4" aria-hidden="true" />,
            text: 'Built for Real Estate, Not Creators',
          }}
          showStats={false}
        />

        {/* Feature Comparison Table */}
        <section id="comparison" className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Feature Comparison: AgentBio vs Beacons</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                See why real estate agents need specialized tools, not general creator platforms
              </p>
              <p className="mt-4 text-sm text-muted-foreground max-w-3xl mx-auto">
                Beacons&rsquo; plans checked against{' '}
                <a
                  href={COMPETITORS.beacons.homepage}
                  className="underline underline-offset-2"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  beacons.ai
                </a>{' '}
                on {COMPETITORS_VERIFIED_LABEL}. We do not quote their prices, which change; check
                theirs against ours rather than taking a number from us. {COMPETITOR_CELLS_NOTE}
              </p>
            </header>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-glass-border">
                    <th className="text-left py-4 px-4 font-light text-lg">Feature</th>
                    <th className="text-center py-4 px-4 font-light text-lg">
                      <div className="flex flex-col items-center">
                        <span className="text-[#0f766e] dark:text-[#0f766e] font-semibold">
                          AgentBio
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">Real Estate</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-light text-lg">
                      <div className="flex flex-col items-center">
                        <span>Beacons</span>
                        <span className="text-sm text-muted-foreground mt-1">Creator Platform</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Real Estate Specific Features */}
                  <tr className="border-b border-glass-border/50">
                    <td
                      colSpan={3}
                      className="py-3 px-4 font-semibold text-foreground bg-glass-background/30"
                    >
                      Real Estate Specific Features
                    </td>
                  </tr>
                  <ComparisonRow
                    feature="Property Listing Galleries"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'listingGalleries')}
                    description="Showcase active & sold listings with photos, prices, beds/baths"
                  />
                  <ComparisonRow
                    feature="Listing Disclosures"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'listingDisclosures')}
                    description="Equal Housing logo, license number display, MLS number on each listing"
                  />
                  <ComparisonRow
                    feature="Real Estate Lead Forms"
                    agentbio="Buyer, Seller, Valuation"
                    beacons={competitorCell('beacons', 'realEstateLeadForms')}
                    description="Pre-qualification questions specific to real estate"
                  />
                  <ComparisonRow
                    feature="Showing Appointment Booking"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'calendarBooking')}
                    description="Your Calendly booking page, opened from your profile for showings"
                  />
                  <ComparisonRow
                    feature="Testimonials Display"
                    agentbio="Star ratings"
                    beacons={competitorCell('beacons', 'testimonials')}
                    description="Client reviews with star ratings, submitted from your own review page"
                  />
                  <ComparisonRow
                    feature="Property Analytics"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'realEstateAnalytics')}
                    description="Which listings visitors open most, with views and visitors for each"
                  />

                  {/* Core Link-in-Bio Features */}
                  <tr className="border-b border-glass-border/50">
                    <td
                      colSpan={3}
                      className="py-3 px-4 font-semibold text-foreground bg-glass-background/30"
                    >
                      Core Link Features
                    </td>
                  </tr>
                  <ComparisonRow
                    feature="Link Buttons"
                    agentbio={AGENTBIO_LINKS_CELL}
                    beacons={competitorCell('beacons', 'linkButtons')}
                    description="Links to your other pages and profiles"
                  />
                  <ComparisonRow
                    feature="Custom Branding"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'customBranding')}
                    description="Colors, fonts, logo customization"
                  />
                  <ComparisonRow
                    feature="Mobile Optimization"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'mobileOptimization')}
                    description="Responsive design for all devices"
                  />
                  <ComparisonRow
                    feature="Analytics Dashboard"
                    agentbio={true}
                    beacons={competitorCell('beacons', 'analyticsDashboard')}
                    description="Traffic, clicks, and engagement metrics"
                  />

                  {/* Creator-Specific Features */}
                  <tr className="border-b border-glass-border/50">
                    <td
                      colSpan={3}
                      className="py-3 px-4 font-semibold text-foreground bg-glass-background/30"
                    >
                      Creator/Influencer Features
                    </td>
                  </tr>
                  <ComparisonRow
                    feature="Email Marketing"
                    agentbio={false}
                    beacons={competitorCell('beacons', 'emailMarketing')}
                    description="Built-in email campaigns (not needed for agents with CRM)"
                  />
                  <ComparisonRow
                    feature="Online Store"
                    agentbio={false}
                    beacons={competitorCell('beacons', 'onlineStore')}
                    description="Sell digital products (not relevant for real estate)"
                  />
                  <ComparisonRow
                    feature="Media Kit Generator"
                    agentbio={false}
                    beacons={competitorCell('beacons', 'mediaKit')}
                    description="For influencer brand partnerships (not needed for agents)"
                  />
                  <ComparisonRow
                    feature="Tipping / Donations"
                    agentbio={false}
                    beacons={competitorCell('beacons', 'tipping')}
                    description="Accept fan donations (not applicable to real estate)"
                  />

                  {/* Pricing */}
                  <tr className="border-b border-glass-border/50">
                    <td
                      colSpan={3}
                      className="py-3 px-4 font-semibold text-foreground bg-glass-background/30"
                    >
                      Pricing
                    </td>
                  </tr>
                  <ComparisonRow
                    feature="Free Plan"
                    agentbio={AGENTBIO_FREE_CELL}
                    beacons={COMPETITORS.beacons.tiers.includes('Free')}
                    description="Get started without paying"
                  />
                  <ComparisonRow
                    feature="Paid Plans"
                    agentbio={AGENTBIO_PLANS_CELL}
                    beacons={COMPETITORS.beacons.tiers.filter((t) => t !== 'Free').join(', ')}
                    description="Monthly prices for AgentBio; check beacons.ai for theirs"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Was "Why Real Estate Agents Switch from Beacons": nothing records
            anyone switching (US-519). */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <header className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                  <span className="glass-heading">Where Beacons Falls Short for Real Estate</span>
                </h2>
              </header>

              <div className="space-y-12">
                <div className="space-y-4">
                  <h3 className="text-2xl font-light text-foreground flex items-center gap-3">
                    <X className="h-6 w-6 text-red-700" />
                    The Problem with Beacons for Real Estate
                  </h3>
                  <div className="pl-9 space-y-3">
                    <p className="glass-body leading-relaxed">
                      <strong>No way to showcase property listings:</strong> Beacons can't display
                      property galleries with photos, pricing, and details. You're limited to
                      generic links that send visitors to external sites.
                    </p>
                    <p className="glass-body leading-relaxed">
                      <strong>Creator-focused, not agent-focused:</strong> Features like "sell
                      courses," "fan donations," and "media kits" waste screen space on tools real
                      estate agents will never use.
                    </p>
                    <p className="glass-body leading-relaxed">
                      <strong>Generic lead capture:</strong> Basic contact forms don't pre-qualify
                      buyers or sellers. You get low-quality leads without budget, timeline, or
                      intent information.
                    </p>
                    <p className="glass-body leading-relaxed">
                      <strong>No listing disclosures:</strong> No Equal Housing logo, no license
                      number display and no place for an MLS number, which most advertising rules
                      expect you to show.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-light text-foreground flex items-center gap-3">
                    <Check className="h-6 w-6 text-green-700" />
                    The AgentBio Advantage for Real Estate
                  </h3>
                  <div className="pl-9 space-y-3">
                    <p className="glass-body leading-relaxed">
                      <strong>Purpose-built property galleries:</strong> Showcase your listings with
                      full photo galleries, prices, bed/bath counts, square footage, and Active,
                      Pending or Sold badges.
                    </p>
                    <p className="glass-body leading-relaxed">
                      <strong>Real estate-specific lead forms:</strong> Capture buyer budget,
                      pre-approval status, timeline, and property preferences. Get seller lead info
                      including the property, timeline and reason for selling.
                    </p>
                    <p className="glass-body leading-relaxed">
                      <strong>Showing appointment booking:</strong> Add your Calendly link and
                      buyers book showing times from your page, without the phone tag.
                    </p>
                    <p className="glass-body leading-relaxed">
                      <strong>Disclosures on your page:</strong> The Equal Housing Opportunity logo
                      and statement, your license number and state, and the MLS number on each
                      listing. Your broker and MLS have the final word on anything else.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
          Three testimonials stood here, attributed to "Marcus T., Luxury Agent,
          Miami", "Jessica R., First-Time Buyer Specialist, Denver" and "David
          K., Team Leader, Phoenix", carrying the metrics "18 leads/month from
          Instagram", "3x more bio link clicks" and "$2.4M closed from
          Instagram".

          Hardcoded JSX, not rows from the `testimonials` table the product
          reads through useTestimonials — so nothing records who said them or
          whether they consented. A named endorsement carrying a specific
          revenue figure, with no traceable source, is the clearest case of all
          (US-156). Removed for the same reason as the two on /vs/linktree.

          If these are real agents who agreed to be quoted, put them in the
          testimonials table with consent recorded and render them from there.
        */}

        {/* When Beacons Makes Sense */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <header className="mb-8">
                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                  <span className="glass-heading">
                    When Beacons Makes Sense (and When It Doesn't)
                  </span>
                </h2>
              </header>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl bg-green-50 border border-green-200">
                  <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Beacons is Good For:
                  </h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Content creators & influencers</li>
                    <li>• Selling digital products or courses</li>
                    <li>• Building email lists for newsletters</li>
                    <li>• Accepting donations or tips</li>
                    <li>• Media kit presentation</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-red-50 border border-red-200">
                  <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                    <X className="h-5 w-5" />
                    Beacons is NOT Good For:
                  </h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Real estate agents showcasing listings</li>
                    <li>• Capturing qualified buyer/seller leads</li>
                    <li>• Booking showing appointments</li>
                    <li>• Equal Housing, license and MLS number disclosures</li>
                    <li>• Real estate-specific analytics</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-xl bg-glass-background border border-glass-border">
                <p className="glass-body text-center">
                  <strong>Bottom Line:</strong> If you're a real estate agent, you need real estate
                  tools. Beacons' creator features are irrelevant to your business, while AgentBio's
                  real estate features directly convert followers into clients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Migration Guide */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <header className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                  <span className="glass-heading">How to Migrate from Beacons to AgentBio</span>
                </h2>
                <p className="text-xl glass-body">
                  There is no automatic import, but there is not much to move:
                </p>
              </header>

              <div className="space-y-6">
                <MigrationStep
                  number={1}
                  title="Create Your Free AgentBio Account"
                  description="Sign up at agentbio.net with your email. Choose your unique username (agentbio.net/yourname)."
                />
                <MigrationStep
                  number={2}
                  title="Add Your Profile Information"
                  description="Upload your photo, write your bio, add contact details, and customize your brand colors."
                />
                <MigrationStep
                  number={3}
                  title="Upload Your Property Listings"
                  description="Add active listings with photos, pricing, details. Mark sold properties for social proof."
                />
                <MigrationStep
                  number={4}
                  title="Set Up Lead Capture Forms"
                  description="Turn on the buyer inquiry, seller and home valuation request forms."
                />
                <MigrationStep
                  number={5}
                  title="Connect Your Calendar"
                  description="Paste your Calendly link so buyers can book showings from your page."
                />
                <MigrationStep
                  number={6}
                  title="Update Your Instagram Bio"
                  description="Replace your Beacons link with your new AgentBio link. Done!"
                />
              </div>

              <div className="mt-12 text-center">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                >
                  <span className="glass-accent">Start Your Free AgentBio Account →</span>
                </Link>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Frequently Asked Questions</span>
              </h2>
            </header>

            <div className="max-w-3xl mx-auto space-y-4">
              <FAQItem
                question="Can I use both Beacons and AgentBio?"
                answer="You could, but your Instagram bio holds one link, so followers only ever see one of them. If you sell courses or take tips through Beacons, keep it for that and link to it from your AgentBio page; otherwise one tool is simpler."
              />
              <FAQItem
                question="Is AgentBio more expensive than Beacons?"
                answer={PRICE_FAQ_ANSWER}
              />
              <FAQItem
                question="What happens to my Beacons analytics when I switch?"
                answer="Beacons analytics stay in your Beacons account. AgentBio starts counting from the day your page goes live: page views, link clicks, which listings visitors open most, and how many visits became leads."
              />
              <FAQItem
                question="Can I import my links from Beacons to AgentBio?"
                answer="There's no automatic import, so you recreate your links in AgentBio by hand. Many of them, such as links to listings or a contact page, are replaced by AgentBio's own listings, lead forms and booking."
              />
              <FAQItem
                question="Does AgentBio have email marketing like Beacons?"
                answer="AgentBio doesn't include email marketing because most agents already use a CRM or email platform (Mailchimp, ActiveCampaign, etc.). AgentBio focuses on what real estate agents need most: showcasing properties and capturing leads. You can integrate AgentBio with your existing email platform."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/20 via-[#a1c4fd]/20 to-[#c2e9fb]/20" />
          <div className="absolute inset-0 bg-glass-background backdrop-blur-sm" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">
                Ready to Switch to a Real Estate-Focused Platform?
              </span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Listings, lead forms and showing booking on the page your Instagram bio links to
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Create Your AgentBio Account Free</span>
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

function ComparisonRow({
  feature,
  agentbio,
  beacons,
  description,
}: {
  feature: string;
  agentbio: boolean | string;
  beacons: boolean | string;
  description?: string;
}) {
  return (
    <tr className="border-b border-glass-border/30 hover:bg-glass-background/20 transition-colors">
      <td className="py-4 px-4">
        <div>
          <div className="font-normal text-foreground">{feature}</div>
          {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
        </div>
      </td>
      <td className="py-4 px-4 text-center">
        {typeof agentbio === 'boolean' ? (
          agentbio ? (
            <Check className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <X className="h-5 w-5 text-red-700 mx-auto" />
          )
        ) : (
          <span className="text-foreground">{agentbio}</span>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        {typeof beacons === 'boolean' ? (
          beacons ? (
            <Check className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <X className="h-5 w-5 text-red-700 mx-auto" />
          )
        ) : (
          <span className="text-foreground">{beacons}</span>
        )}
      </td>
    </tr>
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
    <div className="flex gap-4 items-start p-6 rounded-xl bg-glass-background border border-glass-border">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white font-semibold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="glass-body">{description}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border border-glass-border rounded-xl bg-glass-background backdrop-blur-md overflow-hidden transition-all hover:border-[#80d0c7]/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between group"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-light tracking-tight text-foreground pr-4 group-hover:text-[#0f766e] transition-colors">
          {question}
        </h3>
        <svg
          className={`w-5 h-5 text-[#0f766e] transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="glass-body leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
