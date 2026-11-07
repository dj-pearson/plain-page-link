import * as React from 'react';
import { getCanonicalUrl } from '@/config/seo.config';
import { Link } from 'react-router-dom';
import { Home, Image, DollarSign, MapPin, Check } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';
import {
  PRICING_PLANS,
  firstUnlimitedListingsPlan,
  listingAllowanceSummary,
} from '@/config/pricing-plans';

/*
 * Every claim here must be something the public page shows (US-355, the last
 * /features slice of US-295). The page used to promise "unlimited" listings
 * (Professional allows 25; the allowance now comes from PRICING_PLANS),
 * "MLS compliance built-in" with "MLS attribution" and a Fair Housing
 * disclaimer on every page, "GDPR standards met", an estimated monthly
 * payment, price-reduction and "Just Listed" badges, year built and HOA fees,
 * neighbourhood information, close dates and before/after photos. What the
 * public page shows: photos, price, price per square foot, beds, baths,
 * square feet, lot size, property type, days on market, the agent's
 * highlights, a virtual tour link, the MLS number, the status badge, upcoming
 * open houses, and the Equal Housing Opportunity logo and statement with the
 * agent's license number and state (FullProfilePage, ListingDetailModal,
 * ProfileHeader, UpcomingOpenHouses).
 */
const ALLOWANCE = listingAllowanceSummary();
const UNLIMITED_PLAN = firstUnlimitedListingsPlan();
const FREE_LISTINGS = PRICING_PLANS.find((plan) => plan.price_monthly === 0)?.limits.listings;
const DESCRIPTION =
  'Show active and sold listings on your bio page with photo galleries, price, beds/baths, square footage and the MLS number on each one.';

export default function PropertyListings() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Property Listing Galleries - AgentBio Feature',
    description: DESCRIPTION,
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'AgentBio Property Listings',
      applicationCategory: 'BusinessApplication',
      featureList: [
        `Property listings with photo galleries (${ALLOWANCE})`,
        'Property details: price, beds/baths, square footage, MLS#',
        'Status badges: Active, Pending, Sold',
        'Virtual tour links',
        'Equal Housing Opportunity logo and statement, license number and MLS number shown',
        'Mobile-optimized property browsing',
      ],
    },
  };

  return (
    <>
      <SEOHead
        title="Property Listing Galleries | Showcase Real Estate on Your Bio Page"
        description={DESCRIPTION}
        keywords={[
          'property listing gallery',
          'showcase real estate listings',
          'link in bio with property listings',
          'real estate portfolio page',
          'real estate listings on instagram bio',
        ]}
        canonicalUrl={getCanonicalUrl('/features/property-listings')}
        schema={schema}
      />
      <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
        <PublicHeader />

        {/* Direct Answer */}
        <section className="py-8 bg-background/95 border-b border-glass-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-base md:text-lg glass-body leading-relaxed">
                <strong>
                  AgentBio's property listing galleries let real estate agents show their active and
                  sold properties
                </strong>{' '}
                with full photo galleries, pricing, beds/baths, square footage, MLS numbers, and
                property descriptions directly on their bio page. Unlike generic link-in-bio tools,
                each listing carries a status badge (active, pending, sold) and an optional virtual
                tour link, and your page shows the Equal Housing Opportunity logo and your license
                number, all laid out for phones arriving from Instagram. Plans allow {ALLOWANCE}.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="Property Listing Galleries"
          subtitle="Showcase Your Real Estate Portfolio Like Never Before"
          description="Display your properties with full photo galleries, pricing, and details. Turn your Instagram bio into a mobile-optimized real estate showroom."
          primaryCta={{
            text: 'Start Showcasing Properties Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'See Example Portfolios',
            href: '/#demo-profiles',
          }}
          badge={{
            icon: <Home className="h-4 w-4" aria-hidden="true" />,
            text: UNLIMITED_PLAN
              ? `Unlimited listings on ${UNLIMITED_PLAN.name}`
              : 'Active and sold listings',
          }}
          showStats={false}
        />

        {/* What You Can Display */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Everything Buyers Want to See</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                Display all the property information buyers need to make a decision
              </p>
            </header>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
              <FeatureCard
                icon={<Image />}
                title="Full Photo Galleries"
                description="Upload as many photos as each listing needs and put them in order. Buyers swipe through every image without leaving your bio page."
              />

              <FeatureCard
                icon={<DollarSign />}
                title="Pricing Information"
                description="Asking price on every card, and price per square foot worked out for you in the listing detail."
              />

              <FeatureCard
                icon={<Home />}
                title="Property Details"
                description="Beds, baths, square footage, lot size, property type and days on market. Add your own highlights, such as a pool, a new roof or the school district."
              />

              <FeatureCard
                icon={<MapPin />}
                title="Location & MLS Info"
                description="Street address and city on each listing, with the MLS number shown in the listing detail."
              />
            </div>
          </div>
        </section>

        {/* Active vs Sold Properties */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">
                  Active Listings + Sold Properties = Complete Portfolio
                </span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-light mb-4">
                    <span className="text-green-700">Active Listings</span>
                  </div>
                </div>
                <h3 className="text-2xl font-light text-foreground mb-4">
                  Showcase What's Available
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Highlight your best listings first</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Feature a listing so it leads your page</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Add virtual tour links</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Include open house dates</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm font-light mb-4">
                    <span className="text-blue-700">Sold Properties</span>
                  </div>
                </div>
                <h3 className="text-2xl font-light text-foreground mb-4">
                  Prove Your Track Record
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Keep the sold price on each sold listing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Keep the full photo gallery after the sale</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Pair them with reviews from your clients</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <span className="glass-body">Build credibility with volume</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What the public page shows for compliance */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">The Disclosures Your Page Shows</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                The basics most MLS and state advertising rules ask for. Your broker and MLS have
                the final word on what else your advertising needs.
              </p>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Equal Housing Opportunity',
                    description: 'The logo and statement appear at the foot of your public page',
                  },
                  {
                    title: 'License Number',
                    description: 'Your license number and state appear on your profile',
                  },
                  {
                    title: 'MLS Number',
                    description: 'Shown on each listing that has one',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border"
                  >
                    <h3 className="text-lg font-light text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm glass-body text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Add Listings in 3 Easy Steps</span>
              </h2>
            </header>

            <div className="max-w-3xl mx-auto space-y-6">
              <StepCard
                number={1}
                title="Upload Property Photos"
                description="Drag and drop photos or upload from your device, as many as the listing needs."
              />

              <StepCard
                number={2}
                title="Fill in Property Details"
                description="Add price, beds/baths, square footage, address, MLS number, and description. Takes 2 minutes per listing."
              />

              <StepCard
                number={3}
                title="Publish & Share"
                description="Your listing appears instantly on your bio page. Share the link in Instagram Stories, posts, and DMs."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">Ready to Showcase Your Listings?</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Create your professional real estate portfolio: {ALLOWANCE}
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Start Free</span>
            </Link>
            <p className="text-sm text-muted-foreground font-light mt-4">
              No credit card required • {FREE_LISTINGS} free listings • Upgrade anytime
            </p>
          </div>
        </section>

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

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0f766e] flex items-center justify-center text-white text-xl font-light">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
        <p className="glass-body leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
