/**
 * The /tools hub (US-167).
 *
 * Every tool page already rendered a breadcrumb whose middle rung was called
 * "Free Tools" and pointed at /tools/instagram-bio-analyzer — a sibling tool,
 * not a parent. There was no /tools route in App.tsx at all, so the
 * BreadcrumbList JSON-LD on three pages asserted a hierarchy the site did not
 * have, and the three tools had no shared parent to hold the topical
 * relationship between them.
 *
 * The copy here is deliberately specific about what each tool does and does not
 * do. A hub whose entries are interchangeable one-line blurbs is the thin page
 * US-153 noindexed 23 city pages over; the reason to write the differences down
 * is that they are the only thing that makes this page worth landing on.
 */
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { getCanonicalUrl, getOgImageUrl } from '@/config/seo.config';
import { TOOLS } from '@/config/tools';

const CANONICAL = getCanonicalUrl('/tools');

const TITLE = 'Free Tools for Real Estate Agents | AgentBio';
const DESCRIPTION =
  'Three free tools for real estate agents: write an agent bio, score your Instagram bio, and draft a listing description. No account, nothing stored.';

export default function ToolsIndex() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free tools for real estate agents',
    url: CANONICAL,
    description: DESCRIPTION,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: TOOLS.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebApplication',
          name: tool.name,
          url: getCanonicalUrl(tool.path),
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      })),
    },
  };

  return (
    <>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:title" content="Free Tools for Real Estate Agents" />
        <meta property="og:description" content={DESCRIPTION} />
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
                { name: 'Free Tools', url: CANONICAL },
              ]}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <header className="max-w-[68ch]">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Free tools for real estate agents
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Three things agents ask for often enough that it was worth building them: a bio, a
              second opinion on an Instagram profile, and a first draft of a listing description.
              None of them needs an account, and none of them keeps what you type.
            </p>
          </header>

          <ul className="mt-10 max-w-[72ch] divide-y divide-slate-200 border-y border-slate-200">
            {TOOLS.map((tool) => (
              <li key={tool.path} className="py-8">
                <h2 className="text-2xl font-semibold text-slate-900">
                  <Link to={tool.path} className="hover:text-slate-600 transition-colors">
                    {tool.name}
                  </Link>
                </h2>
                <p className="mt-3 text-slate-600 leading-relaxed max-w-[68ch]">{tool.summary}</p>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-[68ch]">
                  <span className="font-medium text-slate-600">Use it when:</span> {tool.useWhen}
                </p>
                <Link
                  to={tool.path}
                  className="mt-4 inline-flex items-center gap-1 text-slate-900 font-medium hover:gap-2 transition-all"
                >
                  {tool.cta}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>

          <section className="mt-12 max-w-[68ch]">
            <h2 className="text-2xl font-semibold text-slate-900">Why these are free</h2>
            <div className="mt-4 space-y-4 text-slate-600 leading-relaxed">
              <p>
                They are the parts of the job that are quick to do badly and slow to do well, and
                they are all things an agent needs before they need a link-in-bio page. Using them
                does not require an AgentBio account and does not create one.
              </p>
              <p>
                If you end up wanting somewhere to put the bio you just wrote, that is what{' '}
                <Link to="/" className="text-slate-900 underline underline-offset-4">
                  the rest of the product
                </Link>{' '}
                is for. If you do not, the output is yours either way.
              </p>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
