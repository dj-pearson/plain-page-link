import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs with structured data for SEO.
 * Automatically includes Home as the first item.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { name: "Blog", href: "/blog" },
 *     { name: "Article Title", href: "/blog/article-slug" }
 *   ]}
 * />
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [
    { name: "Home", href: "/" },
    ...items
  ];

  // Generate BreadcrumbList structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": allItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${window.location.origin}${item.href}`
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm ${className}`}
      >
        <ol className="flex items-center space-x-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const isFirst = index === 0;

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight
                    className="h-4 w-4 mx-2 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span
                    className="text-foreground font-medium"
                    aria-current="page"
                  >
                    {isFirst && (
                      <Home className="inline h-4 w-4 mr-1" aria-hidden="true" />
                    )}
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isFirst && (
                      <Home className="inline h-4 w-4 mr-1" aria-hidden="true" />
                    )}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Helper function to generate breadcrumbs from URL path
 *
 * @param pathname - Current URL pathname
 * @param nameOverrides - Optional mapping of paths to custom names
 * @returns Array of breadcrumb items
 *
 * @example
 * const breadcrumbs = generateBreadcrumbsFromPath(
 *   "/blog/category/article-title",
 *   { "blog": "Blog", "category": "Market Insights" }
 * );
 */
export function generateBreadcrumbsFromPath(
  pathname: string,
  nameOverrides: Record<string, string> = {}
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const name = nameOverrides[segment] || formatSegmentName(segment);

    return { name, href };
  });
}

/**
 * Format URL segment into readable name
 * Converts "some-article-title" to "Some Article Title"
 */
function formatSegmentName(segment: string): string {
  return segment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
