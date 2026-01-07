import { lazy, Suspense } from 'react';

// Lazy load the full HeroSection with GSAP and 3D components
const HeroSectionFull = lazy(() => import('./HeroSection').then(module => ({
  default: module.HeroSection
})));

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  badge?: {
    icon: React.ReactNode;
    text: string;
  };
  showStats?: boolean;
}

/**
 * Lightweight fallback Hero component
 * Displayed immediately while the full 3D hero loads
 * Saves ~900KB+ on initial page load (GSAP + Three.js)
 */
function HeroFallback({
  title = 'AgentBio Intelligence',
  subtitle = 'Stop Guessing. Start Closing.',
  primaryCta = { text: 'Start Building Your Data Moat', href: '/auth/register' },
  secondaryCta = { text: 'See How It Works', href: '#demo-profiles' },
  badge,
}: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Lightweight CSS gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-teal-50/30 to-slate-50 dark:from-slate-900 dark:via-teal-900/10 dark:to-slate-950" />

      {/* Animated gradient orbs - pure CSS */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 mb-8">
              {badge.icon}
              <span>{badge.text}</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
            <span>Real Estate Agent</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 pb-2">
              Bio Page Builder
            </span>
          </h1>

          {/* Subheadline */}
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
            Turn Your Instagram Followers Into <br />
            Qualified Buyer & Seller Leads
          </h2>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
            While your competitors use basic link-in-bio tools, you'll have a complete real estate portfolio with property galleries, lead capture forms, and appointment booking—all optimized to convert social media traffic into closings.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={primaryCta.href}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {primaryCta.text}
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>

            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200"
            >
              {secondaryCta.text}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Lazy-loaded Hero Section
 * Shows lightweight fallback immediately, then hydrates with full 3D experience
 */
export function HeroSectionLazy(props: HeroSectionProps) {
  return (
    <Suspense fallback={<HeroFallback {...props} />}>
      <HeroSectionFull {...props} />
    </Suspense>
  );
}

export default HeroSectionLazy;
