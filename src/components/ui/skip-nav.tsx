import { cn } from "@/lib/utils";

interface SkipNavLinkProps {
    /**
     * The ID of the main content area to skip to
     * @default "main-content"
     */
    contentId?: string;
    /**
     * Custom class name
     */
    className?: string;
}

/**
 * Skip navigation link for keyboard accessibility
 * This component is visually hidden until focused, allowing keyboard users
 * to skip past navigation directly to main content.
 *
 * WCAG 2.1 AA Requirement: 2.4.1 Bypass Blocks
 *
 * @example
 * // In your layout/App component:
 * <SkipNavLink />
 * <Header />
 * <main id="main-content">...</main>
 */
export function SkipNavLink({ contentId = "main-content", className }: SkipNavLinkProps) {
    return (
        <a
            href={`#${contentId}`}
            className={cn(
                // Visually hidden by default
                "sr-only",
                // Show when focused
                "focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
                "focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "font-medium text-sm",
                className
            )}
        >
            Skip to main content
        </a>
    );
}

interface SkipNavContentProps {
    /**
     * The ID for the main content area
     * @default "main-content"
     */
    id?: string;
    /**
     * Child content
     */
    children: React.ReactNode;
    /**
     * Additional class name
     */
    className?: string;
    /**
     * HTML tag to use for the content container
     * @default "main"
     */
    as?: "main" | "div" | "section";
}

/**
 * Content wrapper that provides the skip navigation target
 *
 * @example
 * <SkipNavContent>
 *   <h1>Page Title</h1>
 *   ...
 * </SkipNavContent>
 */
export function SkipNavContent({
    id = "main-content",
    children,
    className,
    as: Component = "main"
}: SkipNavContentProps) {
    return (
        <Component
            id={id}
            className={className}
            // Allows the element to receive focus when navigated to
            tabIndex={-1}
            // Remove focus outline as it's navigated to, not interacted with
            style={{ outline: "none" }}
        >
            {children}
        </Component>
    );
}
