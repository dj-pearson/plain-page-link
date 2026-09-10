import { Link } from 'react-router-dom';
import { Home, Mail, Facebook, Instagram, Linkedin } from 'lucide-react';
import { openCookiePreferences } from '@/lib/cookie-consent';
import { TOOLS } from '@/config/tools';

export function PublicFooter() {
  return (
    <footer
      className="bg-gray-900 text-gray-400 py-12 mt-auto"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand Section */}
          <div className="sm:col-span-2">
            <Link
              to="/"
              className="flex items-center gap-2 mb-4"
              aria-label="AgentBio.net - Go to homepage"
            >
              <Home className="h-6 w-6 text-blue-500" aria-hidden="true" />
              <span className="text-xl font-bold text-white">AgentBio.net</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Professional real estate agent portfolio links to showcase your properties and capture
              qualified leads.
            </p>
            {/* Social Links */}
            <div className="flex gap-3" role="list" aria-label="Social media links">
              <a
                href="https://www.facebook.com/agentbioapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Facebook (opens in a new tab)"
                role="listitem"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://x.com/AgentBioApp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="X, formerly Twitter (opens in a new tab)"
                role="listitem"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/agentbioapp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Instagram (opens in a new tab)"
                role="listitem"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/company/agentbio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="LinkedIn (opens in a new tab)"
                role="listitem"
              >
                <Linkedin className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Product Links.
              Every one of these pages was prerendered, in the sitemap and
              linked from nowhere a crawler could reach (US-165). The footer is
              the only surface that appears on all 57 pages, so it is what
              decides whether a page is part of the site or an island. */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/features/property-listings"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Property listings
                </Link>
              </li>
              <li>
                <Link
                  to="/features/lead-capture"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Lead capture
                </Link>
              </li>
              <li>
                <Link
                  to="/features/calendar-booking"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Calendar booking
                </Link>
              </li>
              <li>
                <Link
                  to="/features/testimonials"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="/features/analytics"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Comparison Links.
              The comparison pages were reachable only by typing the URL, which
              is part of why they took zero impressions in 16 months (US-156).
              /vs/linktree was added to the footer then; the other two were not,
              and ended the year on one inbound internal link between them. */}
          <div>
            <h3 className="text-white font-semibold mb-4">Compare</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/vs/linktree"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  AgentBio vs Linktree
                </Link>
              </li>
              <li>
                <Link to="/vs/beacons" className="text-gray-400 hover:text-white transition-colors">
                  AgentBio vs Beacons
                </Link>
              </li>
              <li>
                <Link to="/vs/later" className="text-gray-400 hover:text-white transition-colors">
                  AgentBio vs Later
                </Link>
              </li>
            </ul>
          </div>

          {/* Free tools.
              All three were unreachable from the homepage by any internal link
              (US-165). The list comes from src/config/tools.ts, the same one the
              /tools hub renders, so a tool cannot be added to one and forgotten
              in the other — which is exactly how the bio generator ended up in
              the sitemap with no inbound link anywhere. */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              <Link to="/tools" className="hover:text-gray-300 transition-colors">
                Free tools
              </Link>
            </h3>
            <ul className="space-y-2">
              {TOOLS.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-gray-400 hover:text-white transition-colors">
                    {tool.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources.
              This column used to hold three links — "Real Estate Tips",
              "Market Insights" and "Agent Guides" — all three pointing at /blog.
              Three anchors promising three destinations and delivering one is
              worse than one honest link. */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/for-real-estate-agents"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  For real estate agents
                </Link>
              </li>
              <li>
                <Link
                  to="/instagram-bio-for-realtors"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Instagram bios for realtors
                </Link>
              </li>
              <li>
                {/* A roundup author who cannot find the facts writes about
                    somebody else (US-158). */}
                <Link to="/press" className="text-gray-400 hover:text-white transition-colors">
                  Press &amp; product facts
                </Link>
              </li>
            </ul>
          </div>
          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="text-gray-400 hover:text-white transition-colors">
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/acceptable-use"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Acceptable Use
                </Link>
              </li>
              <li>
                <Link
                  to="/accessibility"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-choices"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Your Privacy Choices
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Cookie Preferences
                </button>
              </li>
              <li>
                <a
                  href="mailto:legal@agentbio.net"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Legal Inquiries
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@agentbio.net"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Equal Housing Opportunity & Disclaimers Section */}
        <div className="border-t border-gray-800 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center mb-6">
            <div className="flex items-center gap-3">
              {/* Equal Housing Opportunity Logo */}
              <div className="bg-white rounded p-2">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Equal Housing Opportunity logo"
                >
                  <rect width="100" height="100" fill="white" />
                  <path d="M50 10L20 40H30V90H70V40H80L50 10Z" fill="#000" />
                  <rect x="40" y="50" width="20" height="20" fill="white" />
                  <text
                    x="50"
                    y="66"
                    fontFamily="Arial"
                    fontSize="20"
                    fontWeight="bold"
                    fill="#000"
                    textAnchor="middle"
                  >
                    =
                  </text>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">Equal Housing Opportunity</p>
                <p className="text-gray-400 text-xs">
                  AgentBio.net is committed to fair housing compliance
                </p>
              </div>
            </div>
          </div>

          {/* Platform Disclaimers */}
          <div className="space-y-3 text-xs text-gray-500 text-center max-w-4xl mx-auto">
            <p className="font-semibold text-gray-400">Important Legal Notices</p>
            <p>
              <strong className="text-gray-400">Passive Hosting Platform:</strong> AgentBio.net is a
              passive hosting platform and interactive computer service under 47 U.S.C. § 230. We do
              NOT create, verify, endorse, or take responsibility for any content posted by agents,
              including property listings, photographs, descriptions, pricing, credentials,
              testimonials, or any other information.
            </p>
            <p>
              <strong className="text-gray-400">Agent Responsibility:</strong> All real estate
              agents using this platform are solely and exclusively responsible for: (1) the
              accuracy of all property information and credentials, (2) copyright compliance for all
              photos and materials they upload, (3) Fair Housing Act compliance in all listings and
              content, (4) obtaining photographer permissions and license authorizations, and (5)
              compliance with state licensing and advertising requirements in all jurisdictions
              where they hold licenses.
            </p>
            <p>
              <strong className="text-gray-400">Fair Housing Compliance:</strong> All listings must
              comply with the Fair Housing Act (42 U.S.C. § 3604) and applicable state fair housing
              laws prohibiting discrimination based on race, color, religion, sex, handicap,
              familial status, national origin, or other protected characteristics.
            </p>
            <p>
              <strong className="text-gray-400">Copyright Notice:</strong> Violations of copyright
              law may result in liability, including statutory damages ranging from $750 to $150,000
              per work. Users who receive three valid DMCA notices within 12 months will have their
              accounts permanently terminated. See our DMCA Policy for details.
            </p>
            <p className="pt-2">
              For complete terms, please review our{' '}
              <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>
              ,{' '}
              <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </Link>
              , and{' '}
              <Link to="/dmca" className="text-blue-400 hover:text-blue-300">
                DMCA Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left text-gray-400">
              &copy; {new Date().getFullYear()} AgentBio.net. All rights reserved.
            </p>
            {/*
              The legal links that were repeated here are in the Legal column
              above, and the ones the notice text refers to are linked in that
              paragraph. Three sitewide link sets to the same six pages pushed
              internal link equity at pages that took 207 of 1,481 impressions
              in the 16 months to 2026-09-08 and converted none of them
              (US-151). The pages stay indexable and stay one click away; they
              just stop being linked three times from every page on the site.
            */}
          </div>
        </div>
      </div>
    </footer>
  );
}
