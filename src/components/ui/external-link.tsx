import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The URL to link to */
  href: string;
  /** Link text content */
  children: React.ReactNode;
  /** Whether to show the external link icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ExternalLink Component
 *
 * An accessible external link that:
 * - Opens in a new tab with proper security attributes
 * - Indicates to screen readers that the link opens externally (WCAG 2.4.4)
 * - Optionally shows a visual external link icon
 *
 * @example
 * <ExternalLink href="https://example.com">Visit Example</ExternalLink>
 */
export function ExternalLink({
  href,
  children,
  showIcon = true,
  className,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {children}
      {showIcon && (
        <ExternalLinkIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      )}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
