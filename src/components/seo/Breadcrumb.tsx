import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { generateBreadcrumbSchema, BreadcrumbItem } from '@/lib/seo';
import { getCanonicalUrl } from '@/config/seo.config';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  /**
   * Emit the BreadcrumbList JSON-LD. Set false on a page whose own schema
   * @graph already declares one — every /for/{city} page shipped two
   * BreadcrumbList blocks, one from its graph and one from here, and two
   * declarations of the same type on a page is two answers to one question.
   */
  emitSchema?: boolean;
}

/**
 * Breadcrumb Component - SEO-optimized breadcrumb navigation
 *
 * Features:
 * - Visual breadcrumb navigation for better UX
 * - BreadcrumbList structured data for Google rich snippets
 * - Helps search engines understand site hierarchy
 * - Mobile responsive design
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { name: "Home", url: "/" },
 *     { name: "Features", url: "/features" },
 *     { name: "Lead Capture", url: "/features/lead-capture" }
 *   ]}
 * />
 */
/**
 * A caller may pass "/tools" or a full URL; schema.org wants the full URL.
 *
 * getCanonicalUrl() is built on getSafeOrigin(), the same helper the canonical
 * tags use, so a breadcrumb and a canonical can no longer disagree about what
 * the site is called. A relative `item` is not a lenient absolute one —
 * Google rejects it — and every /features/* page shipped two of them.
 */
const absolute = (url: string): string => (/^https?:\/\//i.test(url) ? url : getCanonicalUrl(url));

export const Breadcrumb = ({
  items,
  className = '',
  showHome = true,
  emitSchema = true,
}: BreadcrumbProps) => {
  // Home is prepended before the schema is generated, not after (US-168). The
  // schema used to be built from `items` while the visible trail was built from
  // `breadcrumbItems`, so on every page that relied on showHome the structured
  // data was missing the first rung that readers could see.
  const breadcrumbItems: BreadcrumbItem[] = (
    showHome && items[0]?.name !== 'Home' ? [{ name: 'Home', url: '/' }, ...items] : items
  ).map((item) => ({ ...item, url: absolute(item.url) }));

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      {/* Structured Data for SEO */}
      {emitSchema && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        </Helmet>
      )}

      {/* Visual Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
        <ol
          className="flex items-center space-x-2"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isHome = item.name === 'Home';

            return (
              <li
                key={item.url}
                className="flex items-center space-x-2"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {/* Breadcrumb Link */}
                {isLast ? (
                  <span
                    className="text-gray-600 dark:text-gray-400 font-medium"
                    itemProp="name"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={isHome ? '/' : item.url}
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    itemProp="item"
                  >
                    {isHome && <Home className="w-4 h-4" />}
                    <span itemProp="name">{item.name}</span>
                  </Link>
                )}

                {/* Hidden metadata for structured data */}
                <meta itemProp="position" content={String(index + 1)} />

                {/* Separator */}
                {!isLast && <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
