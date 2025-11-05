/**
 * SkipLink Component
 * Allows keyboard users to skip navigation and jump to main content
 * Improves accessibility for screen reader and keyboard-only users
 */

interface SkipLinkProps {
    href?: string;
    children?: string;
}

export function SkipLink({ href = "#main-content", children = "Skip to main content" }: SkipLinkProps) {
    return (
        <a
            href={href}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {children}
        </a>
    );
}
