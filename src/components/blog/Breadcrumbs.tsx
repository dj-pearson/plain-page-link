import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      {/* Home */}
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        itemProp="itemListElement"
        itemScope
        itemType="https://schema.org/ListItem"
      >
        <Home className="h-4 w-4" />
        <span itemProp="name">Home</span>
        <meta itemProp="position" content="1" />
        <link itemProp="item" href={window.location.origin} />
      </Link>

      {items.map((item, index) => {
        const position = index + 2;
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <span itemProp="name">{item.label}</span>
                <meta itemProp="position" content={position.toString()} />
                <link itemProp="item" href={`${window.location.origin}${item.href}`} />
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-foreground" : ""}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <span itemProp="name">{item.label}</span>
                <meta itemProp="position" content={position.toString()} />
                {item.href && <link itemProp="item" href={`${window.location.origin}${item.href}`} />}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
