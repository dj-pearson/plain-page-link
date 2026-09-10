import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { getCanonicalUrl } from '@/config/seo.config';

/**
 * The one breadcrumb on the site, visible and structured, from one source
 * (US-165).
 *
 * There were three components and eleven places building a BreadcrumbList, and
 * every page that showed a trail shipped two or three of them. /press had
 * three: one in its JSON-LD @graph, and the old seo/Breadcrumb emitted both a
 * JSON-LD block and a microdata copy of the same list. Blog articles had two,
 * from ArticleSEO and from blog/Breadcrumbs. Google does not merge competing
 * BreadcrumbLists — it picks one, and which one is not worth finding out.
 *
 * The rule this component enforces by construction: a page that renders a
 * visible trail emits exactly one BreadcrumbList, and that list is generated
 * from the same array the nav renders, so the markup cannot drift from what a
 * visitor sees. Pages with no visible trail (the Vs/* comparisons, Landing)
 * keep theirs in their own @graph; nothing here competes with those.
 *
 * Callers pass the crumbs BELOW home, as site-relative paths:
 *
 *   <Breadcrumb trail={[{ name: 'Blog', path: '/blog' }, { name: title, path: `/blog/${slug}` }]} />
 *
 * Two things the old call sites got wrong, which the shape now prevents:
 *
 *   - Home was prepended by the caller, sometimes as `window.location.origin`
 *     and sometimes as a path, so the JSON-LD mixed absolute and relative
 *     `item` values. Home is prepended here, once, and every `item` is made
 *     absolute through getCanonicalUrl.
 *   - Crumbs pointed at pages that do not exist. /features and /tools have no
 *     route in App.tsx, so "Features" pointed at /features/property-listings
 *     and "Free Tools" at /tools/instagram-bio-analyzer — on the Instagram Bio
 *     Analyzer page itself, giving a trail whose parent was the page. `path` is
 *     required precisely so that a crumb has to name a real destination; a
 *     level with no page is not a crumb.
 */
export interface BreadcrumbCrumb {
  /** Shown to the visitor and used as the ListItem name. */
  name: string;
  /** Site-relative path of a real route, e.g. '/blog'. */
  path: string;
}

interface BreadcrumbProps {
  /** The crumbs below Home, in order. The last one is the current page. */
  trail: BreadcrumbCrumb[];
  className?: string;
}

export const Breadcrumb = ({ trail, className = '' }: BreadcrumbProps) => {
  const crumbs: BreadcrumbCrumb[] = [{ name: 'Home', path: '/' }, ...trail];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: getCanonicalUrl(crumb.path),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            const isHome = index === 0;

            return (
              <li key={crumb.path} className="flex items-center gap-x-2">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {isHome && <Home className="h-4 w-4" aria-hidden="true" />}
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
