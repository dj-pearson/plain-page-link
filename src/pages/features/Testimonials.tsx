import * as React from 'react';
import { getCanonicalUrl } from '@/config/seo.config';
import { Link } from 'react-router-dom';
import { Star, Link2, MessageSquare, Check, ShieldCheck } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';

export default function Testimonials() {
  // Every capability below is something the testimonials feature does today
  // (US-332, slice 3 of US-143): star rating and average, name / photo / title,
  // review text, transaction and property type, date, featured-first ordering,
  // the /:username/review submission link (submit-review, unpublished until the
  // agent approves it) and Review markup on the public page. There is no video
  // column, no "success story" format, and the testimonial count is a plan
  // limit, so none of those is claimed. The four unsourced statistics and the
  // two named "Real Testimonial Examples" that stood on this page are gone.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Client Testimonials & Reviews Feature - AgentBio',
    description:
      'Show star-rated client reviews on your real estate bio page, and let clients submit them from your own review link.',
  };

  return (
    <>
      <SEOHead
        title="Client Testimonials & Reviews | Build Trust with Social Proof"
        description="Show star-rated client reviews on your real estate bio page, and let clients submit them from your own review link."
        keywords={[
          'real estate testimonials',
          'agent bio with testimonials',
          'client reviews display',
          'social proof for realtors',
          '5-star ratings real estate',
        ]}
        canonicalUrl={getCanonicalUrl('/features/testimonials')}
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
                  AgentBio's testimonial showcase feature lets real estate agents display client
                  reviews and star ratings
                </strong>{' '}
                on their bio page. Clients can submit a review from the agent's own review link; it
                stays hidden until the agent approves it. The page shows the average star rating and
                review count, client names, photos and transaction details, laid out for visitors
                arriving on a phone from Instagram and other social apps.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="Client Testimonials & Reviews"
          subtitle="Turn Social Proof into Your Most Powerful Sales Tool"
          description="Show star ratings and written reviews from past clients, collected from a link you send them and published only when you approve."
          primaryCta={{
            text: 'Start Showcasing Reviews Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'How to Collect Reviews',
            href: '#collect-reviews',
          }}
          badge={{
            icon: <Star className="h-4 w-4" aria-hidden="true" />,
            text: 'Client-Submitted Reviews',
          }}
          showStats={false}
        />

        {/* A "Why Testimonials Are Your Secret Weapon" section stood here: four
            statistics (88%, 92%, 72%, 63%) with no source, and "Agents with
            displayed testimonials convert Instagram followers into leads 3x
            more", which is a claim about AgentBio that no query produces.
            Removed in US-332; this file was exempt from marketing-claims.test.ts,
            which is how they survived. */}

        {/* Testimonial Display Options */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Multiple Ways to Showcase Social Proof</span>
              </h2>
            </header>

            <div className="max-w-5xl mx-auto space-y-8">
              <TestimonialType
                icon={<Star />}
                title="5-Star Rating Display"
                description="Show your overall rating at the top of your profile"
                features={[
                  'Average rating across your published testimonials',
                  'Shown to one decimal place beside a star',
                  'Total review count',
                  'Updates as you publish reviews',
                ]}
              />

              <TestimonialType
                icon={<MessageSquare />}
                title="Written Testimonials"
                description="Full client reviews with names and photos"
                features={[
                  'Client name, with an optional photo and title',
                  'Full testimonial text and star rating',
                  'Transaction type (bought, sold) and property type',
                  'Date, so visitors can see how recent it is',
                  'Mark a testimonial as featured to show it first',
                ]}
              />

              <TestimonialType
                icon={<Link2 />}
                title="Client-Submitted Reviews"
                description="Send clients your review link and let them write it themselves"
                features={[
                  'Your own review page at agentbio.net/yourname/review',
                  'Clients choose a star rating and write their review',
                  'You are notified when a new review arrives',
                  'Nothing appears on your page until you publish it',
                ]}
              />

              <TestimonialType
                icon={<ShieldCheck />}
                title="Search-Ready Markup"
                description="Reviews on your page are described to search engines"
                features={[
                  'Review and aggregate rating markup built from your published testimonials',
                  'Only real reviews count: the markup is computed, never typed in',
                ]}
              />
            </div>
          </div>
        </section>

        {/* What Makes Great Testimonials */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">What Makes a Great Real Estate Testimonial</span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Specific Results',
                    good: 'Sarah sold our home in 8 days for $15K over asking price',
                    bad: 'Sarah was great to work with',
                    why: 'Numbers and specifics build credibility',
                  },
                  {
                    title: 'Relatable Challenges',
                    good: 'We were first-time buyers overwhelmed by the process. Sarah walked us through every step.',
                    bad: 'Sarah helped us buy a house',
                    why: 'Helps prospects see themselves in the story',
                  },
                  {
                    title: 'Full Attribution',
                    good: 'John & Mary T., Austin TX (Closed March 2024)',
                    bad: 'Anonymous review',
                    why: 'Real names and locations = trust',
                  },
                  {
                    title: 'Emotional Connection',
                    good: "Sarah found us our dream home in a competitive market when we'd almost given up",
                    bad: 'Good service',
                    why: 'Emotion drives decisions',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border"
                  >
                    <h3 className="text-lg font-light text-foreground mb-4">{item.title}</h3>
                    <div className="space-y-3 mb-4">
                      <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-green-700 mb-1">✓ Good:</p>
                        <p className="text-sm glass-body">"{item.good}"</p>
                      </div>
                      <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-700 mb-1">✗ Bad:</p>
                        <p className="text-sm glass-body">"{item.bad}"</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{item.why}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How to Request Testimonials */}
        <section className="py-20 bg-background" id="collect-reviews">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">How to Get Great Testimonials from Clients</span>
              </h2>
            </header>

            <div className="max-w-3xl mx-auto space-y-6">
              <StepCard
                number={1}
                title="Ask at the Right Time"
                description="Request testimonials within 48 hours of closing while the positive experience is fresh. Emotional high = better reviews."
              />

              <StepCard
                number={2}
                title="Make It Easy with AgentBio"
                description="Send clients your personalized review link (agentbio.net/yourname/review). They fill out a simple form—takes 2 minutes."
              />

              <StepCard
                number={3}
                title="Provide Guiding Questions"
                description="'What was your biggest concern before working with me?' 'How did I help solve that?' Specific questions = specific testimonials."
              />

              <StepCard
                number={4}
                title="Approve and Publish"
                description="New reviews arrive hidden. Read each one in your dashboard, then publish it to your page when you're happy with it."
              />

              <StepCard
                number={5}
                title="Follow Up (Gently)"
                description="If they don't respond in a week, send one friendly reminder. Most clients want to help—they just forget."
              />
            </div>
          </div>
        </section>

        {/* A "Real Testimonial Examples" section stood here, quoting "John & Mary
            Thompson, Closed March 2024, Austin TX" and "Robert Chen, Closed
            January 2024, San Francisco CA". Neither review was real, and the
            heading said they were. Removed in US-332. */}

        {/* CTA */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">Start Showcasing Your 5-Star Reviews</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Turn client testimonials into your most powerful marketing tool
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Add Your Testimonials Free</span>
            </Link>
            <p className="text-sm text-muted-foreground font-light mt-4">
              No credit card required • Clients submit reviews from your link
            </p>
          </div>
        </section>

        <PublicFooter />
      </main>
    </>
  );
}

function TestimonialType({
  icon,
  title,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
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

      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-[#0f766e] flex-shrink-0 mt-0.5" />
            <span className="text-sm glass-body">{feature}</span>
          </li>
        ))}
      </ul>
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
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-xl font-light">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
        <p className="glass-body leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
