import { Check, X, ArrowRight, Star, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { generateEnhancedOrganizationSchema } from '@/lib/seo';
import { getBaseUrl, getCanonicalUrl } from '@/config/seo.config';
import { PRICING_PLANS, linkAllowanceSummary } from '@/config/pricing-plans';
import { publisherOrganization } from '@/config/site-entities';
import {
  COMPETITORS,
  COMPETITORS_VERIFIED_LABEL,
  COMPETITOR_CELLS_NOTE,
  competitorCell,
} from '@/config/competitors';
import { FaqSection, faqPageSchema, type FaqEntry } from '@/components/seo/FaqSection';

/**
 * One array for the visible FAQ and its FAQPage schema, as on /vs/linktree and
 * /vs/beacons (US-157). The two copies this page kept had already drifted: the
 * visible answer to the second question mentioned a lead inbox the schema did
 * not (US-519).
 */
const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What's the main difference between AgentBio and Later?",
    answer:
      'AgentBio is built specifically for real estate agents with features like property listings, buyer and seller lead capture forms, and open house sign-in. Later is primarily a social media scheduling tool with a link in bio feature as a secondary offering. AgentBio focuses on lead generation, while Later focuses on content scheduling.',
  },
  {
    question: 'Can I use Later for real estate link in bio?',
    answer:
      "Yes, but Later's link in bio has no real estate features such as property listing cards, buyer and seller forms or a lead inbox, so an agent who wants those needs a second tool.",
  },
  {
    question: 'Does AgentBio include social media scheduling like Later?',
    answer:
      'No. AgentBio is the page your bio link opens: listings, lead forms, reviews and booking. If you schedule posts, keep a tool such as Buffer, Hootsuite or Later for that and point its link at AgentBio.',
  },
  {
    question: 'Which is better for real estate agents: AgentBio or Later?',
    // Was "with 3-5x higher conversion rates" — a measurement of a product
    // nobody has measured, and in a FAQPage answer, which Google renders as a
    // rich result (US-173).
    answer:
      'They do different jobs. Later schedules and plans social content; AgentBio is a link-in-bio built around lead capture, property listings and booking. Many agents use both: Later for scheduling, AgentBio for what happens after somebody taps the link.',
  },
  {
    question: 'Can I migrate from Later to AgentBio?',
    // Was "migration takes 10-15 minutes": nothing timed it (US-519).
    answer:
      'Yes. There is no automatic import, so recreate your links in AgentBio, add your listings, then change the URL in your Instagram bio. You can keep Later for scheduling while you do.',
  },
];

export default function VsLater() {
  const canonicalUrl = getCanonicalUrl('/vs/later');
  const toolUrl = canonicalUrl;

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
            name: 'AgentBio vs Later',
            item: `${getBaseUrl()}/vs/later`,
          },
        ],
      },
      // Enhanced Organization schema with social signals
      generateEnhancedOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': toolUrl,
        url: toolUrl,
        name: 'AgentBio vs Later: Real Estate Link in Bio Comparison',
        description:
          "Compare AgentBio and Later for real estate agents. See why real estate professionals choose AgentBio's specialized features over Later's social media scheduling tools.",
        // The site Organization by @id, not an anonymous one (US-491).
        publisher: publisherOrganization(getBaseUrl()),
      },
      faqPageSchema(FAQ_ENTRIES),
    ],
  };

  return (
    <>
      {/* A hand-built <Helmet> stood here, the last comparison page without
          SEOHead, so it lacked og:site_name, og:locale and twitter:site
          (US-519). */}
      <SEOHead
        title="AgentBio vs Later: Real Estate Link in Bio Comparison"
        description="Compare AgentBio and Later for real estate agents. Later schedules social content; AgentBio captures leads from the link in your bio. What each one is for, and where they overlap."
        keywords={[
          'AgentBio vs Later',
          'Later link in bio for real estate',
          'Later alternative for realtors',
          'real estate link in bio tool',
        ]}
        canonicalUrl={canonicalUrl}
        schema={schema}
      />

      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5"
        tabIndex={-1}
      >
        <PublicHeader />

        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              {/* Was "Trusted by 3,000+ Real Estate Agents", a count nothing
                  measured (US-501). */}
              <Home className="h-4 w-4" aria-hidden="true" />
              Built for real estate agents
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              AgentBio vs Later
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Later is great for scheduling Instagram posts. AgentBio is built to convert those
              posts into real estate leads.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/auth/register">
                  Start Free with AgentBio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/for-real-estate-agents">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Direct Answer Section - GEO Optimization */}
        <section className="bg-white border-y border-gray-200 py-12">
          <div className="container max-w-4xl mx-auto px-4">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <strong>
                AgentBio is a link in bio platform built specifically for real estate agents, while
                Later is primarily a social media scheduling tool with a basic link in bio feature.
              </strong>{' '}
              The key difference: AgentBio includes property listing showcases, built-in lead
              capture forms, open house sign-in and Calendly booking, laid out to turn Instagram
              followers into enquiries. Later's link in bio is a secondary feature focused on
              driving traffic to scheduled posts rather than capturing leads. AgentBio's lead
              capture is built around what a real estate enquiry needs: buyer and seller
              qualification questions, and each new lead can be passed on to your CRM through a
              Zapier webhook. If your priority is scheduling Instagram content, Later excels. If
              your priority is converting followers into qualified real estate leads, AgentBio is
              purpose-built for that goal.
            </p>
          </div>
        </section>

        {/* Quick Comparison Overview */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">At a Glance</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* AgentBio Card */}
              <div className="glass-panel p-8 border-2 border-primary">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                    A
                  </div>
                  <h3 className="text-2xl font-bold">AgentBio</h3>
                </div>

                <p className="text-lg font-semibold text-primary mb-4">
                  Real Estate Lead Generation Platform
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Property listing showcase with photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Built-in lead capture forms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>New leads passed to your CRM via a Zapier webhook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Page themes with your headshot and brokerage details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Calendly booking on your page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-700 mt-0.5 flex-shrink-0" />
                    <span>No social media scheduling</span>
                  </li>
                </ul>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium">Best For:</p>
                  <p className="text-sm text-muted-foreground">
                    Agents prioritizing lead capture and conversion from Instagram
                  </p>
                </div>
              </div>

              {/* Later Card */}
              <div className="glass-panel p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    L
                  </div>
                  <h3 className="text-2xl font-bold">Later</h3>
                </div>

                <p className="text-lg font-semibold text-purple-600 mb-4">
                  Social Media Scheduling Tool + Link in Bio
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instagram post scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Visual content calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Basic link in bio page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Analytics for posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-700 mt-0.5 flex-shrink-0" />
                    <span>No property listing features</span>
                  </li>
                </ul>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Best For:</p>
                  <p className="text-sm text-muted-foreground">
                    Agents who want content scheduling with basic link functionality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Feature Comparison */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-center text-muted-foreground mb-4 text-lg">
              See exactly what you get with each platform
            </p>
            <p className="text-center text-sm text-muted-foreground mb-12 max-w-3xl mx-auto">
              Later&rsquo;s plans checked against{' '}
              <a
                href={COMPETITORS.later.homepage}
                className="underline underline-offset-2"
                rel="nofollow noopener"
                target="_blank"
              >
                later.com
              </a>{' '}
              on {COMPETITORS_VERIFIED_LABEL}. We do not quote their prices, which change and vary
              by region. {COMPETITOR_CELLS_NOTE}
            </p>

            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b-2 border-glass-border">
                    <tr>
                      <th className="py-4 px-4 text-left font-semibold">Feature</th>
                      <th className="py-4 px-4 text-center font-semibold">AgentBio</th>
                      <th className="py-4 px-4 text-center font-semibold">Later</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      feature="Link in Bio Page"
                      agentbio={true}
                      later={competitorCell('later', 'linkInBioPage')}
                    />
                    <ComparisonRow
                      feature="Link Buttons"
                      agentbio={linkAllowanceSummary()}
                      later={competitorCell('later', 'linkButtons')}
                    />
                    <ComparisonRow
                      feature="Custom Branding"
                      agentbio={true}
                      later={competitorCell('later', 'customBranding')}
                    />
                    <ComparisonRow
                      feature="Property Listing Cards"
                      agentbio={true}
                      later={competitorCell('later', 'listingGalleries')}
                      description="Showcase listings with photos, prices, and details"
                    />
                    <ComparisonRow
                      feature="Lead Capture Forms"
                      agentbio={true}
                      later={competitorCell('later', 'realEstateLeadForms')}
                      description="Built-in buyer/seller qualification forms"
                    />
                    <ComparisonRow
                      feature="Leads Sent to Your CRM"
                      agentbio="Via Zapier"
                      later={competitorCell('later', 'leadsToCrm')}
                      description="Each new lead is posted to your Zapier webhook; CSV export on paid plans"
                    />
                    <ComparisonRow
                      feature="Calendar Booking"
                      agentbio={true}
                      later={competitorCell('later', 'calendarBooking')}
                      description="Your Calendly booking page, opened from your profile"
                    />
                    {/* A "Real Estate Templates: Pre-designed pages for agents" row
                        stood here. AgentBio has general visual themes (themes.ts),
                        not real estate templates, and whether Later has themes was
                        never checked (US-519). */}
                    {/* Was "Video Testimonials": testimonials have no video column. */}
                    <ComparisonRow
                      feature="Client Reviews"
                      agentbio={true}
                      later={competitorCell('later', 'testimonials')}
                      description="Star-rated reviews clients submit from your review page"
                    />
                    {/* A "Lead Magnets/Downloads" row stood here; AgentBio has no
                        downloadable-guide feature (US-501). */}
                    {/* Was agentbio="Advanced" later="Basic": a ranking nobody
                        measured. Say what AgentBio's Analytics page shows instead
                        (US-519). */}
                    <ComparisonRow
                      feature="Analytics"
                      agentbio={true}
                      later={competitorCell('later', 'analyticsDashboard')}
                      description="AgentBio: page views, link clicks, most-viewed listings and lead sources"
                    />
                    <ComparisonRow
                      feature="Mobile Optimization"
                      agentbio={true}
                      later={competitorCell('later', 'mobileOptimization')}
                    />
                    <ComparisonRow
                      feature="Social Media Scheduling"
                      agentbio={false}
                      later={competitorCell('later', 'socialScheduling')}
                      description="Plan and auto-post Instagram content"
                    />
                    <ComparisonRow
                      feature="Visual Content Calendar"
                      agentbio={false}
                      later={competitorCell('later', 'contentCalendar')}
                    />
                    <ComparisonRow
                      feature="Post Scheduling (Instagram)"
                      agentbio={false}
                      later={competitorCell('later', 'instagramScheduling')}
                    />
                    <ComparisonRow
                      feature="Media Library"
                      agentbio={false}
                      later={competitorCell('later', 'mediaLibrary')}
                      description="Store and organize content for scheduling"
                    />
                    <ComparisonRow
                      feature="Hashtag Suggestions"
                      agentbio={false}
                      later={competitorCell('later', 'hashtagSuggestions')}
                    />
                    <ComparisonRow
                      feature="Best Time to Post"
                      agentbio={false}
                      later={competitorCell('later', 'bestTimeToPost')}
                    />
                    {/* Was agentbio="$19" later="$25-$80". $19 is not one of our
                        plans (0, 29, 49, 99, 299 in pricing-plans.ts) and the same
                        page said $29 lower down; Later's figure was unsourced and
                        varies by plan and region. Compare the tiers instead (US-156). */}
                    <ComparisonRow
                      feature="Plans"
                      agentbio={PRICING_PLANS.filter((p) => p.price_monthly > 0)
                        .slice(0, 2)
                        .map((p) => `${p.name} $${p.price_monthly}`)
                        .join(', ')}
                      later={COMPETITORS.later.tiers.join(', ')}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Use Case Scenarios */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Which Platform is Right for You?
            </h2>

            <div className="space-y-8">
              {/* Scenario 1 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  You Need: Lead Generation from Instagram
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your primary goal is converting Instagram followers into qualified buyer and
                  seller leads who book consultations and close deals.
                </p>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="font-semibold text-primary">✓ Choose AgentBio</p>
                  <p className="text-sm mt-1">
                    Purpose-built for lead capture with forms, property showcases, open house
                    sign-in, and calendar booking.
                  </p>
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  You Need: Content Planning & Scheduling
                </h3>
                <p className="text-muted-foreground mb-4">
                  You want to batch-create Instagram content, schedule posts weeks in advance, and
                  maintain a consistent posting calendar.
                </p>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <p className="font-semibold text-purple-600">✓ Choose Later</p>
                  <p className="text-sm mt-1">
                    Industry-leading scheduling tools, visual calendar, media library, and analytics
                    for content performance. Perfect for content planning workflow.
                  </p>
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-500" />
                  You Need: Both Scheduling AND Lead Generation
                </h3>
                <p className="text-muted-foreground mb-4">
                  You want to plan content in advance AND maximize lead conversion from your
                  Instagram bio link.
                </p>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="font-semibold text-green-700">✓ Use Both Platforms</p>
                  <p className="text-sm mt-1">
                    Later schedules the posts; AgentBio is what the link in them points at. They
                    solve different halves of the same problem, and plenty of agents pay for both.
                  </p>
                </div>
              </div>

              {/* Scenario 4 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  You Need: Showcase Active Listings
                </h3>
                <p className="text-muted-foreground mb-4">
                  You want Instagram followers to browse your current listings with photos, prices,
                  and easy inquiry options.
                </p>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="font-semibold text-primary">✓ Choose AgentBio</p>
                  <p className="text-sm mt-1">
                    Property listing cards display photos, addresses, prices, and link to full
                    details. Update instantly when properties sell. Later has no listing showcase
                    features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
          An "Agent Success Stories" section stood here with four invented
          testimonials, each carrying manufactured outcome metrics — "8
          leads/month", "2 closings", "12 leads/month", "15 leads/month" and
          similar — attributed to agents with no record anywhere of who they are
          or whether they consented.

          Removed (US-159), for the same reason as the five taken off
          /vs/linktree and /vs/beacons in US-156. If these are real agents, put
          them in the `testimonials` table with consent recorded.
        */}

        {/* Migration Guide */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Switch from Later to AgentBio
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Keep Later for scheduling, add AgentBio for lead generation
            </p>

            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Sign Up for AgentBio',
                  description:
                    'Create your free account at agentbio.net. Choose a username (agentbio.net/yourname).',
                },
                {
                  step: '2',
                  title: 'Set Up Your Profile',
                  description:
                    'Add your headshot, bio, and brand colors. Use the same branding as your Instagram for consistency.',
                },
                {
                  step: '3',
                  title: 'Add Your Property Listings',
                  description:
                    'Upload active listings with photos, prices, and details. Link to full listing pages on your website.',
                },
                {
                  step: '4',
                  title: 'Create Lead Capture Forms',
                  description:
                    'Turn on the buyer inquiry, seller and home valuation request forms. Add a Zapier webhook if you want each new lead sent on to your CRM.',
                },
                {
                  step: '5',
                  title: 'Add Your Essential Links',
                  description:
                    'Calendar booking, testimonials, about page, contact info. Copy any relevant links from your Later page.',
                },
                {
                  step: '6',
                  title: 'Update Instagram Bio',
                  description:
                    'Replace your Later link in bio URL with your new AgentBio link. Keep using Later for post scheduling!',
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 glass-panel p-6 bg-primary/5 border border-primary/20">
              <p className="font-semibold mb-2">💡 Pro Tip: Use Both Platforms</p>
              <p className="text-sm text-muted-foreground">
                Plenty of agents use Later for scheduling Instagram content and AgentBio for the
                link in their bio. They are not really competitors: one plans what you post, the
                other decides what happens when somebody taps through. Check both vendors' current
                pricing for your region before budgeting for either.
              </p>
            </div>
          </div>
        </section>

        <FaqSection entries={FAQ_ENTRIES} heading="Frequently Asked Questions" />

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center glass-panel p-12 bg-gradient-to-br from-primary/10 to-accent/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Convert More Instagram Followers into Real Estate Leads?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Capture leads, showcase listings and book appointments from the link in your Instagram
              bio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/auth/register">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/for-real-estate-agents">Learn More</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Cancel anytime
            </p>
          </div>
        </section>

        {/* Internal Links */}
        <section className="container mx-auto px-4 py-8 border-t border-glass-border/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Explore more comparisons and features:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/vs/linktree" className="text-primary underline hover:no-underline">
                AgentBio vs Linktree
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/vs/beacons" className="text-primary underline hover:no-underline">
                AgentBio vs Beacons
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                to="/features/property-listings"
                className="text-primary underline hover:no-underline"
              >
                Property Listing Features
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                to="/features/lead-capture"
                className="text-primary underline hover:no-underline"
              >
                Lead Capture Forms
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                to="/for-real-estate-agents"
                className="text-primary underline hover:no-underline"
              >
                For Real Estate Agents
              </Link>
            </div>
          </div>
        </section>
        <PublicFooter />
      </main>
    </>
  );
}

function ComparisonRow({
  feature,
  agentbio,
  later,
  description,
}: {
  feature: string;
  agentbio: boolean | string;
  later: boolean | string;
  description?: string;
}) {
  return (
    <tr className="border-b border-glass-border/30">
      <td className="py-4 px-4">
        <div className="font-normal">{feature}</div>
        {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
      </td>
      <td className="py-4 px-4 text-center">
        {typeof agentbio === 'boolean' ? (
          agentbio ? (
            <Check className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <X className="h-5 w-5 text-red-700 mx-auto" />
          )
        ) : (
          <span className="text-sm">{agentbio}</span>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        {typeof later === 'boolean' ? (
          later ? (
            <Check className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <X className="h-5 w-5 text-red-700 mx-auto" />
          )
        ) : (
          <span className="text-sm">{later}</span>
        )}
      </td>
    </tr>
  );
}
