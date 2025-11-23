import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero3D } from './Hero3DLazy';

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

export function HeroSection({
  title = 'AgentBio Intelligence',
  subtitle = 'Stop Guessing. Start Closing.',
  description = 'AI-powered platform that predicts which leads will convert, automatically matches properties to qualified buyers, and accelerates deals with market intelligence. ML-scored leads convert 2x better. Agents save 5+ hours per week. Close deals 30% faster.',
  primaryCta = {
    text: 'Start Building Your Data Moat',
    href: '/auth/register'
  },
  secondaryCta = {
    text: 'See How It Works',
    href: '#demo-profiles'
  },
  badge = {
    icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
    text: 'AI-Powered Sales Intelligence'
  },
  showStats = true
}: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* 1. Full-Screen 3D Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Hero3D height="100%" className="w-full h-full" />
      </div>

      {/* 2. Content Overlay */}
      <div className="container relative z-10 mx-auto px-4 pointer-events-none">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 mb-8 animate-fade-in pointer-events-auto">
            {badge.icon}
            <span>{badge.text}</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1] animate-slide-up">
            Real Estate Agent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
              Bio Page Builder
            </span>
          </h1>

          {/* Subheadline */}
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-200 mb-6 animate-slide-up delay-100">
            Turn Your Instagram Followers Into <br />
            Qualified Buyer & Seller Leads
          </h2>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed animate-slide-up delay-200">
            While your competitors use basic link-in-bio tools, you'll have a complete real estate portfolio with property galleries, lead capture forms, and appointment booking—all optimized to convert social media traffic into closings.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up delay-300 pointer-events-auto">
            <Link
              to={primaryCta.href}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {primaryCta.text}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

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
