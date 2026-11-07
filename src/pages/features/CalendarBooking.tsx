import * as React from 'react';
import { getCanonicalUrl } from '@/config/seo.config';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Check, Phone } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSectionLazy } from '@/components/hero';

export default function CalendarBooking() {
  // What ships (US-332, slice 3 of US-143): the agent pastes a Calendly link
  // into their profile; each listing on the public page then offers
  // "Schedule a Showing", which opens that Calendly inside the page
  // (CalendlyModal), and a confirmed booking is recorded as a lead through
  // submit-lead. Open houses get "Add to calendar" (an .ics file and a Google
  // Calendar link, openHouseCalendar.ts). There is no Google Calendar
  // integration, no availability engine of our own, no approval step and no
  // SMS provider, so this page claims none of them. src/features-claims.test.ts
  // holds the old phrases out.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Showing Booking with Calendly for Real Estate Agents - AgentBio',
    description:
      'Add your Calendly link and every listing on your AgentBio page gets a Schedule a Showing button. Buyers book inside your page, and each booking lands in your leads.',
  };

  return (
    <>
      <SEOHead
        title="Showing Booking for Real Estate Agents | Calendly on Every Listing"
        description="Add your Calendly link and every listing on your AgentBio page gets a Schedule a Showing button. Buyers book inside your page, and each booking lands in your leads."
        keywords={[
          'real estate calendar booking',
          'showing appointment scheduling',
          'Calendly for realtors',
          'schedule a showing button',
          'real estate appointment booking',
        ]}
        canonicalUrl={getCanonicalUrl('/features/calendar-booking')}
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
                  AgentBio puts your Calendly booking page behind a Schedule a Showing button on
                  every listing.
                </strong>{' '}
                A buyer gives their name and email, picks a time from your Calendly without leaving
                your page, and the confirmed booking is saved to your AgentBio leads with the
                listing address attached. Your availability, buffers and reminders stay exactly as
                you set them in Calendly.
              </p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <HeroSectionLazy
          title="Showing Booking with Calendly"
          subtitle="Stop Playing Phone Tag: Let Buyers Book the Showing Themselves"
          description="Paste your Calendly link once. Every listing on your page offers a showing time, and every booking becomes a lead you can follow up."
          primaryCta={{
            text: 'Add Your Calendly Free',
            href: '/auth/register',
          }}
          secondaryCta={{
            text: 'See How It Works',
            href: '#how-it-works',
          }}
          badge={{
            icon: <Calendar className="h-4 w-4" aria-hidden="true" />,
            text: 'Works with Calendly',
          }}
          showStats={false}
        />

        {/* The Problem with Phone Tag */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">The Phone Tag Problem</span>
              </h2>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                  <h3 className="text-xl font-light text-red-700 mb-4">Without a booking button</h3>
                  <ol className="space-y-3 text-sm glass-body list-decimal pl-5">
                    <li>Buyer sees a listing and calls or texts to ask for a time</li>
                    <li>You're at another showing and miss the call</li>
                    <li>You call back later and they don't answer</li>
                    <li>A string of texts trying to find a time that works</li>
                    <li>By the time you connect, they may have moved on</li>
                  </ol>
                </div>

                <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/20">
                  <h3 className="text-xl font-light text-green-700 mb-4">
                    With your Calendly on AgentBio
                  </h3>
                  <ol className="space-y-3 text-sm glass-body list-decimal pl-5">
                    <li>Buyer opens a listing and taps "Schedule a Showing"</li>
                    <li>They enter their name and email</li>
                    <li>Your Calendly opens inside the page with those details filled in</li>
                    <li>They pick one of the times you've made available</li>
                    <li>The booking is saved to your leads with the listing address</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-background" id="how-it-works">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">How Showing Booking Works</span>
              </h2>
            </header>

            <div className="max-w-3xl mx-auto space-y-6">
              <StepCard
                number={1}
                title="Paste Your Calendly Link"
                description="Add your Calendly scheduling link in your AgentBio profile settings. There is nothing else to connect."
              />

              <StepCard
                number={2}
                title="Listings Offer a Showing Time"
                description="Each listing on your public page shows a 'Schedule a Showing' button. Without a Calendly link it reads 'Request a Showing' and opens a showing request form instead."
              />

              <StepCard
                number={3}
                title="Buyer Books Inside Your Page"
                description="The buyer gives their name and email, then picks a time in your Calendly, embedded in your page, with those details already filled in."
              />

              <StepCard
                number={4}
                title="The Booking Becomes a Lead"
                description="When Calendly confirms the booking, AgentBio records it as a lead with the listing address, so it sits in your lead list and counts in your analytics. Calendly sends its own confirmation and adds the event to whichever calendar you connected to Calendly."
              />
            </div>
          </div>
        </section>

        {/* What carries over */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Your Calendly Rules Still Apply</span>
              </h2>
              <p className="text-xl glass-body max-w-3xl mx-auto">
                AgentBio shows your Calendly as it is. Anything you have set there carries over.
              </p>
            </header>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Clock />,
                  title: 'Availability and Buffers',
                  description:
                    'The hours you offer, the gaps between appointments and how much notice you need are all set in Calendly, and buyers only see the times it allows.',
                },
                {
                  icon: <Phone />,
                  title: 'Contact Details Up Front',
                  description:
                    'AgentBio asks for a name and email before the calendar opens, so a buyer who books is a lead you can reach.',
                },
                {
                  icon: <MapPin />,
                  title: 'Tied to the Listing',
                  description:
                    'A booking made from a listing carries that listing with it, so you know which property the showing is for.',
                },
                {
                  icon: <Check />,
                  title: 'Counted in Your Analytics',
                  description:
                    'Completed bookings count as conversions in your AgentBio analytics, alongside form submissions.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-[#80d0c7]/10 text-[#0f766e]">
                      {React.cloneElement(feature.icon as React.ReactElement, {
                        className: 'h-5 w-5',
                        'aria-hidden': true,
                      })}
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm glass-body text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open houses */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Open Houses Go on Their Calendar Too</span>
              </h2>
            </header>

            <div className="max-w-3xl mx-auto p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
              <p className="glass-body leading-relaxed">
                Open houses you schedule in AgentBio appear on your public page with an "Add to
                calendar" option: an .ics file for Apple Calendar, Outlook and most phones, or a
                Google Calendar link. Visitors keep the date, time and address without writing them
                down.
              </p>
            </div>
          </div>
        </section>

        {/* An entire "What Agents Say About Automated Booking" section stood here:
            two testimonials attributed to "Jessica T., Luxury Agent, Scottsdale AZ"
            and "Marcus L., Team Leader, Denver CO", quoting "2-3 hours per week
            playing phone tag" and "2-3 appointments already scheduled".

            Neither agent exists. US-159 swept the site for exactly this and
            missed it, because its guard matched an em-dash attribution
            ("— Jessica T.") and this markup puts the name in its own <p> with no
            dash. The rule now matches the shape rather than the punctuation
            (US-173).

            Nothing replaces it. There is a testimonials feature that reads real
            rows from the `testimonials` table; a marketing page inventing its own
            is the thing that feature exists to make unnecessary. */}

        {/* CTA */}
        <section className="py-20 bg-background/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              <span className="glass-heading">Stop Playing Phone Tag: Start Booking Showings</span>
            </h2>
            <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
              Let buyers book a showing from the listing they are looking at
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="glass-accent">Add Your Calendly Free</span>
            </Link>
            <p className="text-sm text-muted-foreground font-light mt-4">
              No credit card required • Works with your existing Calendly account
            </p>
          </div>
        </section>

        <PublicFooter />
      </main>
    </>
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
