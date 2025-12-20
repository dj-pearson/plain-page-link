import { Star, TrendingUp, Clock, Shield, Smartphone, BarChart3, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * AgentBenefits Component (formerly AgentTestimonials)
 * Showcases platform benefits without fabricated testimonials
 * Uses verifiable platform features instead of fake user stories
 */
export function AgentTestimonials() {
  const benefits = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Built for Lead Conversion',
      description: 'Pre-qualification forms, smart contact routing, and lead capture designed specifically for real estate. Every element optimized to convert visitors into qualified leads.',
      highlight: 'Purpose-Built'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Set Up in Minutes',
      description: 'Import your listings, add your credentials, and publish your professional profile. No technical skills required - just enter your information and go live.',
      highlight: 'Quick Start'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Professional Credibility',
      description: 'Display your license, brokerage, sold properties, and certifications. Build trust with verified credentials that set you apart from the competition.',
      highlight: 'Trust Builder'
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Mobile-First Experience',
      description: 'Your profile looks perfect on any device. Optimized for Instagram, Facebook, and social media sharing where your clients spend their time.',
      highlight: 'Mobile Ready'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Actionable Analytics',
      description: 'See which listings get the most views, where your leads come from, and track your conversion performance. Data you can actually use.',
      highlight: 'Data Driven'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Lead Management',
      description: 'Capture buyer inquiries, seller leads, and home valuation requests in one place. Follow up faster with organized lead tracking.',
      highlight: 'CRM Built-In'
    }
  ];

  return (
    <section className="py-20 bg-background" id="benefits">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            <span className="glass-heading">Why Agents Choose AgentBio</span>
          </h2>
          <p className="text-xl glass-body max-w-2xl mx-auto">
            Everything you need to capture leads and showcase your expertise in one professional profile
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-6 hover:border-primary/50 transition-all group"
            >
              {/* Icon */}
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                {benefit.icon}
              </div>

              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-4">
                <span className="text-xs font-semibold text-primary">
                  {benefit.highlight}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <div className="mt-16 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">Real Estate</div>
              <div className="text-sm text-muted-foreground">Focused Platform</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">5 min</div>
              <div className="text-sm text-muted-foreground">Average Setup Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">Free</div>
              <div className="text-sm text-muted-foreground">Plan Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">SSL</div>
              <div className="text-sm text-muted-foreground">Secure & Private</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            Get Started Free
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            No credit card required • Upgrade anytime
          </p>
        </div>
      </div>
    </section>
  );
}
