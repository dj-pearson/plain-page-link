import { useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero3D } from './Hero3DLazy';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(TextPlugin);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mainTextRef = useRef<HTMLHeadingElement>(null);
  const highlightTextRef = useRef<HTMLSpanElement>(null);
  const subheadlineRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Initial Setups
    gsap.set(mainTextRef.current, { opacity: 0, y: 30, filter: 'blur(10px)' });
    gsap.set(highlightTextRef.current, {
      scale: 1.1,
      clipPath: 'polygon(0 0, 0% 0, 0% 100%, 0 100%)',
      backgroundImage: 'linear-gradient(to right, #2563eb, #14b8a6, #2563eb)',
      backgroundSize: '200% auto',
      color: 'transparent',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text'
    });
    gsap.set([subheadlineRef.current, descriptionRef.current, ctaRef.current, badgeRef.current], {
      opacity: 0,
      y: 20
    });

    // 2. Animation Sequence
    tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      .to(mainTextRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1,
        ease: 'power3.out'
      }, '-=0.2')
      .to(highlightTextRef.current, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        scale: 1,
        duration: 1.2,
        ease: 'power4.out'
      }, '-=0.6')
      .to(subheadlineRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.8')
      .to(descriptionRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.6')
      .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.6');

    // 3. Continuous Shimmer for Highlight Text
    gsap.to(highlightTextRef.current, {
      backgroundPosition: '200% center',
      duration: 4,
      repeat: -1,
      ease: 'linear'
    });

    // 4. Mouse Parallax Effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const xPos = (clientX / innerWidth - 0.5) * 20;
      const yPos = (clientY / innerHeight - 0.5) * 20;

      gsap.to(mainTextRef.current, { x: xPos, y: yPos, duration: 1, ease: 'power2.out' });
      gsap.to(highlightTextRef.current, { x: xPos * 1.5, y: yPos * 1.5, duration: 1, ease: 'power2.out' });
      gsap.to(subheadlineRef.current, { x: xPos * 0.5, y: yPos * 0.5, duration: 1, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* 1. Full-Screen 3D Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Hero3D height="100%" className="w-full h-full" />
      </div>

      {/* 2. Content Overlay */}
      <div className="container relative z-10 mx-auto px-4 pointer-events-none">
        <div className="max-w-3xl">
          {/* Badge */}
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 mb-8 pointer-events-auto">
            {badge.icon}
            <span>{badge.text}</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
            <div ref={mainTextRef} className="inline-block">Real Estate Agent</div> <br />
            <span ref={highlightTextRef} className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 pb-2">
              Bio Page Builder
            </span>
          </h1>

          {/* Subheadline */}
          <h2 ref={subheadlineRef} className="text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
            Turn Your Instagram Followers Into <br />
            Qualified Buyer & Seller Leads
          </h2>

          {/* Description */}
          <p ref={descriptionRef} className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
            While your competitors use basic link-in-bio tools, you'll have a complete real estate portfolio with property galleries, lead capture forms, and appointment booking—all optimized to convert social media traffic into closings.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
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
