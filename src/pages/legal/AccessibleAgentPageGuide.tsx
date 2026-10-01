import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SEOHead } from '@/components/SEOHead';
import { SkipNavContent } from '@/components/ui/skip-nav';

/**
 * "Making your page accessible" — the agent's half of the shared
 * responsibility the accessibility statement and Terms describe (US-239).
 * Linked from the statement, the Terms, and the Theme and Listings editors.
 */
export default function AccessibleAgentPageGuide() {
  const linkClass = 'text-primary underline hover:no-underline';
  return (
    <>
      <SEOHead
        title="Making your page accessible - AgentBio"
        description="Five things an agent can do in a few minutes to make their AgentBio page work for buyers and sellers who use screen readers, captions, keyboards or magnification."
        canonicalUrl="https://agentbio.net/accessibility/agents"
      />
      <PublicHeader />
      <SkipNavContent>
        <main id="main-content" className="min-h-screen bg-background py-12 px-4" tabIndex={-1}>
          <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
            <h1>Making your page accessible</h1>
            <p className="lead">
              About one in four U.S. adults has a disability. Most of what makes your page work for them is built
              in — the templates, keyboard access, readable button text. Five things are yours, because only you
              know your photos, videos and words.
            </p>

            <h2 id="photos">1. Describe your listing photos</h2>
            <p>
              In <strong>Listings → Edit → Photos</strong>, every photo has a description box. Say what the photo
              shows, as you would to a buyer on the phone: “Kitchen with white shaker cabinets, quartz island and
              three pendant lights.” Skip “image of” — screen readers already say it is an image. Without a
              description, a photo is read as its address and number, which is better than nothing but tells a
              blind buyer nothing about the home.
            </p>
            <p>
              On page-builder pages, an image needs a description before the page will publish, unless you mark it
              decorative (purely visual, like a background texture).
            </p>

            <h2 id="video">2. Caption your videos</h2>
            <p>
              For YouTube or Vimeo, turn on and check captions on that site — YouTube’s automatic captions are a
              start but get street names and prices wrong. For a video file, add a captions file (.vtt) in the
              video block settings. Either way, a short transcript in the block helps people who prefer reading.
            </p>

            <h2 id="colours">3. Pick readable colours</h2>
            <p>
              The theme editor shows how readable each colour pair is and will not save a theme that falls below
              the standard; use “Use nearest passing colour” to keep your brand close. Button text is chosen
              automatically to stay readable on your colour.
            </p>

            <h2 id="words">4. Write clearly</h2>
            <ul>
              <li>Make link text say where it goes — “See 12 Oak Lane”, not “click here”.</li>
              <li>Spell out abbreviations buyers may not know the first time (HOA, DOM).</li>
              <li>Don’t put important text inside images; it cannot be read aloud or enlarged.</li>
            </ul>

            <h2 id="requests">5. Answer requests for another format</h2>
            <p>
              If someone asks for listing details by phone, email or in large print, give them — promptly. Under
              fair-housing and disability law, offering information in a way someone can use is part of serving
              every client. We can help: write to{' '}
              <a href="mailto:accessibility@agentbio.net" className={linkClass}>
                accessibility@agentbio.net
              </a>
              .
            </p>

            <h2 id="more">Where this fits</h2>
            <p>
              Our <Link to="/accessibility" className={linkClass}>accessibility statement</Link> sets out what AgentBio
              is responsible for and what is still being fixed, and section 3 of the{' '}
              <Link to="/terms" className={linkClass}>Terms of Service</Link> asks you to use these tools for your
              content. This page is guidance, not legal advice.
            </p>
          </article>
        </main>
      </SkipNavContent>
      <PublicFooter />
    </>
  );
}
