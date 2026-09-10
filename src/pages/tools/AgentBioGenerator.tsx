/**
 * Free Real Estate Agent Bio Generator (US-155).
 *
 * The homepage used to chase "real estate agent bio" and could not serve it —
 * 82 impressions at position 88.6 for the head term alone, roughly 180 across
 * the cluster, one click in sixteen months. US-152 stopped the homepage
 * competing for it. This is the page that actually answers it.
 *
 * Generation is deterministic and local (src/lib/agent-bio-generator). No
 * account, no API key, no network call. The worked examples are produced by the
 * same generator at module load, so what a crawler indexes is exactly what a
 * visitor gets — and they are the part of this page that can rank, because
 * "professional real estate agent bio examples" is a query and a form field is
 * not an answer to it.
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCanonicalUrl, getOgImageUrl } from '@/config/seo.config';
import { BIO_EXAMPLES, generateAgentBio } from '@/lib/agent-bio-generator/generator';
import type { AgentBioInput, BioNiche, BioTone, GeneratedBio } from '@/lib/agent-bio-generator/types';

const PATH = '/tools/real-estate-agent-bio-generator';
const CANONICAL = getCanonicalUrl(PATH);

const NICHES: { value: BioNiche; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'new-agent', label: 'New agent' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'rental-leasing', label: 'Rentals & leasing' },
  { value: 'team', label: 'Team' },
];

const TONES: { value: BioTone; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'direct', label: 'Direct' },
  { value: 'polished', label: 'Polished' },
];

/** Same access pattern as src/lib/web-vitals.ts; no-op when GA is not loaded. */
function track(event: string, params: Record<string, unknown>): void {
  const gtag = (window as unknown as Record<string, unknown>).gtag as
    | ((...args: unknown[]) => void)
    | undefined;
  if (typeof gtag === 'function') gtag('event', event, params);
}

const EMPTY: AgentBioInput = {
  fullName: '',
  city: '',
  state: '',
  niche: 'general',
  tone: 'warm',
  yearsExperience: 3,
  brokerage: '',
  specialties: '',
  credential: '',
  personalNote: '',
};

function CopyableBio({ label, hint, text }: { label: string; hint: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track('bio_copied', { format: label });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be denied; the text is selectable either way.
      setCopied(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h3 className="text-base font-semibold text-slate-900">{label}</h3>
        <span className="text-sm text-slate-500">{hint}</span>
      </div>
      <p className="text-slate-700 leading-relaxed max-w-[70ch]">{text}</p>
      <Button type="button" variant="outline" className="mt-4" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </section>
  );
}

export default function AgentBioGenerator() {
  const [input, setInput] = useState<AgentBioInput>(EMPTY);
  const [result, setResult] = useState<GeneratedBio | null>(null);

  const set = <K extends keyof AgentBioInput>(key: K, value: AgentBioInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(generateAgentBio(input));
    track('bio_generated', { niche: input.niche, tone: input.tone });
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Real Estate Agent Bio Generator',
    url: CANONICAL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    description:
      'Write a professional real estate agent bio in a few seconds. Five versions for new agents, luxury, rentals and teams, plus a 150-character Instagram bio.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <>
      <Helmet>
        <title>Real Estate Agent Bio Generator (Free) + 5 Examples | AgentBio</title>
        <meta
          name="description"
          content="Write your real estate agent bio in a few seconds. Free generator plus five real examples for new agents, luxury, rentals, teams, and a 150-character Instagram bio."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta
          property="og:title"
          content="Real Estate Agent Bio Generator (Free) + 5 Examples"
        />
        <meta
          property="og:description"
          content="Write your real estate agent bio in a few seconds. Free, no account, five worked examples."
        />
        <meta property="og:image" content={getOgImageUrl()} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <PublicHeader />

      <main id="main-content" className="min-h-screen bg-slate-50" tabIndex={-1}>
        <div className="border-b border-slate-200 bg-white py-3">
          <div className="container mx-auto px-4">
            <Breadcrumb
              items={[
                { name: 'Home', url: getCanonicalUrl('/') },
                { name: 'Free Tools', url: getCanonicalUrl('/tools') },
                { name: 'Agent Bio Generator', url: CANONICAL },
              ]}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <header className="max-w-[68ch]">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Real estate agent bio generator
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Answer six questions and get three versions of your bio: a professional paragraph for
              your brokerage page or MLS profile, a short first-person version, and one that fits
              Instagram&rsquo;s 150 characters. Nothing is sent anywhere and you do not need an
              account.
            </p>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
            >
              <div>
                <Label htmlFor="fullName">Your name</Label>
                <Input
                  id="fullName"
                  required
                  value={input.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="Dana Okafor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={input.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Columbus"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={input.state}
                    onChange={(e) => set('state', e.target.value)}
                    placeholder="OH"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-slate-900 mb-2">Who you work with</legend>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((n) => (
                    <button
                      key={n.value}
                      type="button"
                      aria-pressed={input.niche === n.value}
                      onClick={() => set('niche', n.value)}
                      className={
                        'rounded-xl px-3 py-2 text-sm transition-colors min-h-[44px] ' +
                        (input.niche === n.value
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                      }
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-slate-900 mb-2">Tone</legend>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={input.tone === t.value}
                      onClick={() => set('tone', t.value)}
                      className={
                        'rounded-xl px-3 py-2 text-sm transition-colors min-h-[44px] ' +
                        (input.tone === t.value
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <Label htmlFor="years">Years licensed</Label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={60}
                  value={input.yearsExperience}
                  onChange={(e) => set('yearsExperience', Number(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="brokerage">Brokerage (optional)</Label>
                <Input
                  id="brokerage"
                  value={input.brokerage}
                  onChange={(e) => set('brokerage', e.target.value)}
                  placeholder="Cascade & Co."
                />
              </div>

              <div>
                <Label htmlFor="specialties">What you focus on (optional)</Label>
                <Input
                  id="specialties"
                  value={input.specialties}
                  onChange={(e) => set('specialties', e.target.value)}
                  placeholder="first-time buyers, condos"
                />
                <p className="mt-1 text-sm text-slate-500">Separate with commas.</p>
              </div>

              <div>
                <Label htmlFor="personalNote">One human detail (optional)</Label>
                <Input
                  id="personalNote"
                  value={input.personalNote}
                  onChange={(e) => set('personalNote', e.target.value)}
                  placeholder="Spent six years in mortgage lending before getting licensed"
                />
                <p className="mt-1 text-sm text-slate-500">
                  The field people skip, and the one that makes a bio sound like a person.
                </p>
              </div>

              <Button type="submit" className="w-full min-h-[44px]">
                Write my bio
              </Button>
            </form>

            <div className="space-y-6">
              {result ? (
                <>
                  <CopyableBio
                    label="Professional"
                    hint="Brokerage page, MLS profile"
                    text={result.professional}
                  />
                  <CopyableBio
                    label="Short"
                    hint="About box, listing presentation"
                    text={result.short}
                  />
                  <CopyableBio
                    label="Instagram"
                    hint={`${result.instagram.length}/150 characters`}
                    text={result.instagram}
                  />

                  <section className="rounded-2xl bg-slate-900 p-6 text-white">
                    <h2 className="text-xl font-semibold">Now the link underneath it</h2>
                    <p className="mt-2 text-slate-300 leading-relaxed max-w-[60ch]">
                      A bio tells someone who you are. The link below it decides whether they can
                      see your listings, ask a question, or book a viewing. AgentBio gives you one
                      page that does all three.
                    </p>
                    <Button
                      asChild
                      variant="secondary"
                      className="mt-5 min-h-[44px]"
                      onClick={() => track('bio_cta_clicked', { from: 'results' })}
                    >
                      <Link to="/auth/register">Create your page free</Link>
                    </Button>
                  </section>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8">
                  <p className="text-slate-600 max-w-[60ch] leading-relaxed">
                    Your three bios will appear here. If you would rather start from something
                    finished, the examples below are real output from this generator — copy one and
                    change the details.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/*
            Rendered always, not behind interaction: "professional real estate
            agent bio examples" is a query, and a form is not an answer to it.
            These come from the generator itself, so they cannot drift from it.
          */}
          <section className="mt-20" aria-labelledby="examples-heading">
            <h2 id="examples-heading" className="text-3xl font-bold text-slate-900">
              Five real estate agent bio examples
            </h2>
            <p className="mt-3 text-slate-600 max-w-[68ch] leading-relaxed">
              Each one is this generator&rsquo;s actual output for a different kind of agent. The
              names and details are illustrative — no awards, rankings or sales figures, because
              those are the parts people copy without checking.
            </p>

            <div className="mt-8 space-y-8">
              {BIO_EXAMPLES.map((example) => (
                <article
                  key={example.niche}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <h3 className="text-xl font-semibold text-slate-900">{example.label}</h3>
                  <p className="mt-1 text-slate-500 max-w-[68ch]">{example.forWhom}</p>

                  <dl className="mt-5 space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-slate-900">Professional</dt>
                      <dd className="mt-1 text-slate-700 leading-relaxed max-w-[70ch]">
                        {example.bio.professional}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-900">Short</dt>
                      <dd className="mt-1 text-slate-700 leading-relaxed max-w-[70ch]">
                        {example.bio.short}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-900">
                        Instagram ({example.bio.instagram.length}/150)
                      </dt>
                      <dd className="mt-1 text-slate-700 leading-relaxed max-w-[70ch]">
                        {example.bio.instagram}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-20 max-w-[68ch]">
            <h2 className="text-3xl font-bold text-slate-900">
              What makes a real estate bio work
            </h2>
            <div className="mt-5 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Say who you help before you say how long you have been doing it. Someone reading
                your bio is deciding whether you handle their situation, not grading your career.
              </p>
              <p>
                If you are new, say so. A bio that gestures vaguely at &ldquo;years of
                experience&rdquo; reads worse than one that says you were licensed this year and
                answers the phone. Nobody was ever talked out of hiring an agent by honesty about
                their start date.
              </p>
              <p>
                Keep one human detail. What you did before real estate, where you grew up, the
                thing you know about a neighbourhood that a search result does not. It is the only
                sentence that could not have been written about somebody else.
              </p>
              <p>
                Then give them somewhere to go. A bio that ends without a way to see your listings
                or reach you has done half a job.
              </p>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
