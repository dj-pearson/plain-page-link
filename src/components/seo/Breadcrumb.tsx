import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { generateBreadcrumbSchema, BreadcrumbItem } from "@/lib/seo";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
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
export const Breadcrumb = ({
  items,
  className = "",
  showHome = true
}: BreadcrumbProps) => {
  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema(items);

  // Ensure home is included if showHome is true
  const breadcrumbItems = showHome && items[0]?.name !== "Home"
    ? [{ name: "Home", url: window.location.origin }, ...items]
    : items;

  return (
    <>
      {/* Structured Data for SEO */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Visual Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm ${className}`}
      >
        <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isHome = item.name === "Home";

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
                    to={isHome ? "/" : item.url}
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
                {!isLast && (
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
