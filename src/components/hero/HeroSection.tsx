import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Hero3D } from './Hero3DLazy';

/**
 * HeroSection Component
 * Professional hero section combining 3D visuals with Liquid Glass design system
 */
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
    icon?: React.ReactNode;
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
    <section className="relative container mx-auto px-4 py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Content Column */}
        <article className="space-y-8 z-10">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-glass-background backdrop-blur-md border border-glass-border rounded-full text-sm font-light tracking-tight">
              <div className="text-transparent bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] bg-clip-text flex items-center gap-2">
                {badge.icon}
                <span className="font-normal">{badge.text}</span>
              </div>
            </div>
          )}

          {/* Heading */}
          <div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4 leading-tight">
              {title}
              <span className="block mt-2">
                <span className="glass-heading text-5xl md:text-7xl lg:text-8xl">
                  {subtitle}
                </span>
              </span>
            </h1>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl glass-body max-w-xl leading-relaxed">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={primaryCta.href}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
            >
              <span className="relative z-10 text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#80d0c7] group-hover:to-[#a1c4fd] group-hover:bg-clip-text transition-all">
                {primaryCta.text}
              </span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#80d0c7]/10 to-[#a1c4fd]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-glass-border rounded-xl font-light tracking-tight text-foreground/90 hover:bg-glass-background hover:border-[#a1c4fd] backdrop-blur-sm transition-all"
            >
              {secondaryCta.text}
              <Sparkles className="h-4 w-4" />
            </a>
          </div>

          {/* Sub-text */}
          <p className="text-sm text-muted-foreground font-light">
            No credit card required • Setup in 5 minutes
          </p>

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-glass-border">
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-light glass-accent">
                  AI-Powered
                </div>
                <div className="text-sm text-muted-foreground font-light">
                  Lead Scoring
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-light glass-accent">
                  Smart
                </div>
                <div className="text-sm text-muted-foreground font-light">
                  Auto-Matching
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-light glass-accent">
                  Data Moat
                </div>
                <div className="text-sm text-muted-foreground font-light">
                  Gets Smarter
                </div>
              </div>
            </div>
          )}
        </article>

        {/* 3D Visual Column */}
        <div className="relative">
          {/* Main 3D Hero */}
          <Hero3D height="500px" className="shadow-2xl" />

          {/* Floating accent cards */}
          <div className="hidden lg:block absolute -top-8 -right-8 w-48 p-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl shadow-lg animate-float-slow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm font-light text-foreground">
                  Interactive 3D
                </div>
                <div className="text-xs text-muted-foreground font-light">
                  Drag to explore
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block absolute -bottom-6 -left-6 w-56 p-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl shadow-lg animate-float-delayed">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-light">
                  Design Quality
                </span>
                <span className="text-xs glass-accent font-normal">
                  98%
                </span>
              </div>
              <div className="h-2 bg-glass-border rounded-full overflow-hidden">
                <div className="h-full w-[98%] bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Animation keyframes for floating elements
const style = document.createElement('style');
style.textContent = `
  @keyframes float-slow {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes float-delayed {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-15px);
    }
  }

  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
    animation-delay: 1s;
  }
`;
document.head.appendChild(style);
