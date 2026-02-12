import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Maps route paths to human-readable page titles for screen reader announcements.
 * Falls back to document.title if no match is found.
 */
const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/pricing": "Pricing",
  "/blog": "Blog",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/dmca": "DMCA Policy",
  "/acceptable-use": "Acceptable Use Policy",
  "/accessibility": "Accessibility Statement",
  "/auth/login": "Log In",
  "/auth/register": "Create Account",
  "/auth/forgot-password": "Forgot Password",
  "/auth/reset-password": "Reset Password",
  "/dashboard": "Dashboard",
  "/dashboard/listings": "Listings",
  "/dashboard/leads": "Leads",
  "/dashboard/testimonials": "Testimonials",
  "/dashboard/links": "Custom Links",
  "/dashboard/analytics": "Analytics",
  "/dashboard/profile": "Profile",
  "/dashboard/theme": "Theme",
  "/dashboard/settings": "Settings",
  "/dashboard/quick-actions": "Quick Actions",
  "/dashboard/page-builder": "Page Builder",
  "/dashboard/workflows": "Workflows",
  "/dashboard/lead-management": "Lead Management",
  "/dashboard/analytics-advanced": "Advanced Analytics",
  "/admin": "Admin Dashboard",
  "/admin/seo": "SEO Dashboard",
  "/for-real-estate-agents": "For Real Estate Agents",
  "/instagram-bio-for-realtors": "Instagram Bio for Realtors",
  "/features/property-listings": "Property Listings Feature",
  "/features/lead-capture": "Lead Capture Feature",
  "/features/calendar-booking": "Calendar Booking Feature",
  "/features/testimonials": "Testimonials Feature",
  "/features/analytics": "Analytics Feature",
  "/tools/instagram-bio-analyzer": "Instagram Bio Analyzer",
  "/tools/listing-description-generator": "Listing Description Generator",
  "/onboarding/wizard": "Onboarding",
};

function getPageTitle(pathname: string): string {
  // Direct match
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  // Dynamic route patterns
  if (pathname.startsWith("/blog/category/")) {
    return "Blog Category";
  }
  if (pathname.startsWith("/blog/")) {
    return "Blog Article";
  }
  if (pathname.startsWith("/for/")) {
    return "Real Estate Agents";
  }
  if (pathname.startsWith("/vs/")) {
    return "Comparison";
  }
  if (pathname.startsWith("/p/")) {
    return "Page";
  }
  if (pathname.startsWith("/dashboard/workflows/")) {
    return "Workflow Builder";
  }

  // Fall back to document title
  const docTitle = document.title;
  if (docTitle) {
    // Strip the site name suffix if present
    const pipeIndex = docTitle.indexOf(" | ");
    const dashIndex = docTitle.indexOf(" – ");
    if (pipeIndex > 0) return docTitle.substring(0, pipeIndex);
    if (dashIndex > 0) return docTitle.substring(0, dashIndex);
    return docTitle;
  }

  return "Page";
}

/**
 * RouteAnnouncer Component
 *
 * Announces page changes to screen readers when navigating in the SPA.
 * This addresses WCAG 2.4.2 (Page Titled) and 4.1.3 (Status Messages)
 * for single-page applications where traditional page loads don't occur.
 *
 * Also manages focus by moving it to the main content area on navigation,
 * addressing WCAG 2.4.3 (Focus Order).
 *
 * @example
 * // In App.tsx
 * <RouteAnnouncer />
 */
export function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    // Don't announce on initial load
    if (previousPathRef.current === location.pathname) {
      return;
    }

    previousPathRef.current = location.pathname;

    // Small delay to let the new page render and update document.title
    const timer = setTimeout(() => {
      const title = getPageTitle(location.pathname);
      setAnnouncement(`Navigated to ${title}`);

      // Move focus to main content for keyboard users (WCAG 2.4.3)
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus({ preventScroll: false });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 1500);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
