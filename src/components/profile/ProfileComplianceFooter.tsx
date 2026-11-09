/**
 * The Equal Housing statement, license line, legal links and attribution that
 * close every public page an agent has: the profile and each listing page
 * (US-275). One component, so a listing page can never ship without the
 * disclosure the profile carries.
 */
import { poweredByUrl } from '@/lib/signupIntent';

interface ProfileComplianceFooterProps {
  profile: {
    username: string;
    full_name?: string | null;
    title?: string | null;
    brokerage_name?: string | null;
    license_number?: string | null;
    license_state?: string | null;
  };
  /** False on plans with removeBranding (20260923000002). */
  showBranding: boolean;
}

export function ProfileComplianceFooter({ profile, showBranding }: ProfileComplianceFooterProps) {
  return (
    <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 pb-4 sm:pb-6 border-t border-gray-200 bg-gray-50 rounded-lg">
      <div className="text-center px-3 sm:px-4">
        {/* Equal Housing Opportunity Logo */}
        <div className="flex justify-center mb-2 sm:mb-3">
          <svg
            className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600"
            viewBox="0 0 100 100"
            fill="currentColor"
            role="img"
            aria-label="Equal Housing Opportunity"
          >
            {/* Simple Equal Housing symbol */}
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="none" />
            <rect
              x="30"
              y="20"
              width="40"
              height="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <line x1="35" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="3" />
            <line x1="35" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>

        {/* Equal Housing Statement */}
        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
          Equal Housing Opportunity
        </p>
        <p className="text-xs text-gray-600 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed">
          We are pledged to the letter and spirit of U.S. policy for the achievement of equal
          housing opportunity throughout the Nation.
        </p>

        {/* License Information */}
        {profile.license_number && (
          <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-300">
            <p className="text-xs sm:text-sm text-gray-700 font-medium">
              {profile.full_name || profile.username}
              {profile.title && ` | ${profile.title}`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {profile.brokerage_name && `${profile.brokerage_name} | `}
              License #{profile.license_number} ({profile.license_state})
            </p>
          </div>
        )}

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs text-gray-500 mb-2 sm:mb-3">
          <a
            href="/terms"
            className="hover:text-blue-600 active:text-blue-700 hover:underline min-h-[32px] flex items-center"
          >
            Terms of Service
          </a>
          <span>•</span>
          <a
            href="/privacy"
            className="hover:text-blue-600 active:text-blue-700 hover:underline min-h-[32px] flex items-center"
          >
            Privacy Policy
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} {profile.full_name || profile.username}. All rights reserved.
        </p>
        {showBranding && (
          <p className="text-xs text-gray-600 mt-1 sm:mt-2">
            Powered by{' '}
            {/* US-232: attributed to this profile, so the signups it
                brings can be counted (profiles.referred_by). */}
            <a
              href={poweredByUrl(profile.username)}
              className="hover:text-blue-600 active:text-blue-700 hover:underline"
              target="_blank"
              rel="noopener"
            >
              AgentBio.net
            </a>
          </p>
        )}
      </div>
    </footer>
  );
}
