import * as React from 'react';
import { getCanonicalUrl } from '@/config/seo.config';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, MousePointer, TrendingUp, Share2, Check } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';
import { generateFAQSchema, generateCombinedSchema, FEATURE_FAQS } from '@/lib/faq-schema';

export default function Analytics() {
  // What ships (US-332, slice 3 of US-143), and where:
  //   profile views, unique visitors, conversion rate, views over 7/30/90 days,
  //   leads by type, leads by channel, views -> form opens -> leads per
  //   utm_source, Call/Email/Text taps and per-link clicks
  //     -> src/pages/dashboard/Analytics.tsx (useAnalytics)
  //   views and distinct visitors per listing -> listing_view_stats() on the
  //     Listings page
  //   CSV export and PDF report -> Analytics.tsx, ReportBuilder.tsx
  //   morning email (new leads, tasks, key dates) -> scheduled-maintenance/digests.ts
  // Not tracked, so not claimed: Story vs Post vs Reel, time on page, photo or
  // virtual-tour engagement, visitor location, a live activity feed, emailed
  // metric summaries. src/features-claims.test.ts holds the old phrases out.
  // Generate FAQ schema for AI search optimization
  const faqSchema = generateFAQSchema(FEATURE_FAQS.analytics);

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Real Estate Analytics & Insights - AgentBio',
    description:
      'Track which listings get the most views, where leads come from, and which properties generate inquiries. Data-driven insights for real estate agents.',
  };

  // Combine page schema with FAQ schema
  const schema = generateCombinedSchema([pageSchema, faqSchema]);

  return (
    <>
      <SEOHead
        title="Real Estate Analytics & Insights | Track Performance & Lead Sources"
        description="Track which listings get the most views, where leads come from, and which properties generate inquiries. Data-driven insights for real estate agents."
        keywords={[
          'real estate analytics',
          'agent bio analytics',
          'listing performance tracking',
          'lead source tracking',
          'Instagram traffic analytics',
        ]}
        canonicalUrl={getCanonicalUrl('/features/analytics')}
        schema={schema}
        aiSearchOptimized={true}
        speakableSelectors={['h1', 'h2', '.glass-body']}
        citationTitle="Real Estate Analytics & Insights"
        citationAuthor="AgentBio"
      />
      <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
        <PublicHeader />

        {/* Direct Answer */}
        <section className="py-8 bg-background/95 border-b border-glass-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-base md:text-lg glass-body leading-relaxed">
                <strong>AgentBio's real estate analytics give agents data-driven insights</strong>{' '}
                into how many people visit their bio page, which listings get viewed, which links
                and contact buttons get tapped, and where leads come from. Tag the link in your
                Instagram bio, a QR code or an ad with a campaign source and AgentBio shows views,
                form opens and leads for each one, so agents can see which channel actually produces
                enquiries.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="Real Estate Analytics & Insights"
          subtitle="Know What's Working—Double Down on What Converts"
          description="Stop guessing. Track exactly which listings generate interest, where your best leads come from, and what content drives conversions."
          primaryCta={{
            text: 'Start Tracking Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'See What You Can Track',
            href: '#metrics',
          }}
          badge={{
            icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
            text: 'Views, Taps & Lead Sources',
          }}
          showStats={false}
        />

        {/* Why Analytics Matter */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Why Real Estate Agents Need Analytics</span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <h3 className="text-xl font-light text-foreground mb-3">
                    Know Your Hot Listings
                  </h3>
                  <p className="glass-body mb-4">
                    See how many views and distinct visitors each listing had in the last 30 days.
                    Promote the ones people are looking at.
                  </p>
                  <p className="text-sm text-[#0f766e]">
                    → Optimize your Instagram content strategy
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <h3 className="text-xl font-light text-foreground mb-3">Track Lead Sources</h3>
                  <p className="glass-body mb-4">
                    Know whether a lead came from a tagged campaign, another website or a direct
                    visit. Spend more time on channels that actually convert.
                  </p>
                  <p className="text-sm text-[#0f766e]">→ Focus your marketing where it works</p>
                </div>

                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <h3 className="text-xl font-light text-foreground mb-3">
                    See Which Sources Convert
                  </h3>
                  <p className="glass-body mb-4">
                    For each campaign source, compare page views, lead form opens and leads. Find
                    the channel that sends visitors who get in touch.
                  </p>
                  <p className="text-sm text-[#0f766e]">→ Optimize your bio page layout</p>
                </div>

                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                  <h3 className="text-xl font-light text-foreground mb-3">Measure ROI</h3>
                  <p className="glass-body mb-4">
                    Track the share of visitors who become leads over 7, 30 or 90 days, and export
                    the numbers to show what your marketing is producing.
                  </p>
                  <p className="text-sm text-[#0f766e]">→ Justify your marketing spend</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics You Can Track */}
        <section className="py-20 bg-background" id="metrics">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Real Estate Metrics That Matter</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                Track the data that actually drives your business forward
              </p>
            </header>

            <div className="max-w-5xl mx-auto space-y-8">
              <MetricCard
                icon={<Eye />}
                title="Listing View Analytics"
                description="See which properties people open on your page"
                metrics={[
                  'Views per listing over the last 30 days',
                  'Distinct visitors per listing',
                  'Shown beside each listing in your dashboard',
                ]}
                insight="Use case: one listing is drawing most of the views on your page. Feature it in your next post, or ask why the others are not getting opened."
              />

              <MetricCard
                icon={<Share2 />}
                title="Traffic Source Breakdown"
                description="Know which channels send visitors who get in touch"
                metrics={[
                  'Campaign source from a tagged link (?utm_source=instagram, a QR code, an ad)',
                  'Referral visits from other websites, and direct visits',
                  'Page views, lead form opens and leads for each source',
                ]}
                insight="Use case: tag the link in your Instagram bio and the one on your yard-sign QR code with different sources, then compare how many leads each produces."
              />

              <MetricCard
                icon={<MousePointer />}
                title="Link Click Tracking"
                description="See which CTAs and links get the most engagement"
                metrics={[
                  'Clicks on each link on your page',
                  'Call, Email and Text button taps',
                  'Lead form opens and submissions',
                  'Showings booked through your Calendly',
                ]}
                insight="Use case: plenty of visitors tap Call but few send the form. Make sure your phone is answered, or move the form higher on your page."
              />

              <MetricCard
                icon={<TrendingUp />}
                title="Lead Conversion Metrics"
                description="Understand your conversion funnel"
                metrics={[
                  'Visitor to lead conversion rate',
                  'Leads by type (buyer, seller, valuation, contact)',
                  'Leads over the last 7, 30 or 90 days',
                  'Where each lead came from',
                ]}
                insight="Use case: your conversion rate drops after you change your page. Compare the period before and after, and undo what hurt it."
              />
            </div>
          </div>
        </section>

        {/* A "Real-Time Analytics Dashboard" section stood here with a "Live
            Activity Feed" of invented events, and a "How Agents Use Analytics"
            section quoting "Maria Lopez, Luxury Agent, Miami FL" and "David Kim,
            Team Leader, Los Angeles CA". There is no live feed, and neither
            agent exists. Removed in US-332. */}

        {/* Export & Reporting */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Export & Reporting</span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'CSV Export',
                    description:
                      'Download all your analytics data to Excel or Google Sheets for custom analysis',
                  },
                  {
                    title: 'PDF Reports',
                    description:
                      'Generate a report for the last 7, 30 or 90 days, or a calendar month, to share with your team or broker',
                  },
                  {
                    title: 'Morning Email',
                    description:
                      "A daily or weekly email with your new leads, tasks that are due and clients' key dates",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border text-center"
                  >
                    <h3 className="text-lg font-light text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm glass-body text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section - Optimized for AI Search */}
        <section className="py-20 bg-background" id="faq">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Frequently Asked Questions</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                Common questions about AgentBio's analytics features
              </p>
            </header>

            <div className="max-w-3xl mx-auto space-y-4">
              {FEATURE_FAQS.analytics.map((faq, index) => (
                <FAQCard key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">Start Making Data-Driven Decisions</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Track what matters, optimize what works, and grow your real estate business with
              confidence
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Start Tracking Free</span>
            </Link>
            <p className="text-sm text-muted-foreground font-light mt-4">
              No credit card required • CSV and PDF export
            </p>
          </div>
        </section>

        <PublicFooter />
      </main>
    </>
  );
}

function MetricCard({
  icon,
  title,
  description,
  metrics,
  insight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  metrics: string[];
  insight: string;
}) {
  return (
    <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
      <div className="flex items-start gap-6 mb-6">
        <div className="flex-shrink-0 p-4 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#0f766e]">
          {React.cloneElement(icon as React.ReactElement, { className: 'h-8 w-8' })}
        </div>
        <div>
          <h3 className="text-2xl font-light tracking-tight text-foreground mb-2">{title}</h3>
          <p className="glass-body text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-light text-foreground mb-3 uppercase tracking-wide">
          Metrics Tracked:
        </h4>
        <ul className="space-y-2">
          {metrics.map((metric, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[#0f766e] flex-shrink-0 mt-0.5" />
              <span className="text-sm glass-body">{metric}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-gradient-to-br from-[#80d0c7]/5 to-[#a1c4fd]/5 rounded-lg border border-[#80d0c7]/20">
        <p className="text-sm font-light text-foreground mb-1">💡 Insight:</p>
        <p className="text-sm glass-body text-muted-foreground">{insight}</p>
      </div>
    </div>
  );
}

function FAQCard({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border cursor-pointer transition-all hover:border-[#80d0c7]/50"
      onClick={() => setIsOpen(!isOpen)}
      itemScope
      itemType="https://schema.org/Question"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-light tracking-tight text-foreground pr-4" itemProp="name">
          {question}
        </h3>
        <span className={`text-[#0f766e] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
      {/* `hidden` rather than {isOpen && …}: the answer stays in the HTML and
          the browser does not paint it. Conditional mounting meant a closed
          accordion had no answer text in the document, so the FAQPage JSON-LD
          asserted answers that were on no page — and the itemProp="text"
          microdata below described an element that did not exist (US-185). */}
      <div
        className="mt-4 pt-4 border-t border-glass-border/50"
        hidden={!isOpen}
        itemScope
        itemType="https://schema.org/Answer"
        itemProp="acceptedAnswer"
      >
        <p className="glass-body leading-relaxed" itemProp="text">
          {answer}
        </p>
      </div>
    </div>
  );
}
