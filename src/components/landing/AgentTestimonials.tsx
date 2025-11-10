import { Star, Quote } from 'lucide-react';

/**
 * AgentTestimonials Component
 * Real estate agent testimonials with ROI metrics
 */
export function AgentTestimonials() {
  const testimonials = [
    {
      name: 'Jennifer Rodriguez',
      title: 'Luxury Real Estate Agent',
      location: 'Los Angeles, CA',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
      rating: 5,
      quote: "AgentBio completely transformed my Instagram strategy. I was using Linktree before and getting maybe 1-2 leads per month. Now I'm getting 10-15 qualified buyer inquiries every month. The sold properties showcase is a game-changer for building trust.",
      metrics: {
        leadIncrease: '5x',
        timeFrame: '2 months'
      }
    },
    {
      name: 'David Thompson',
      title: 'First-Time Buyer Specialist',
      location: 'Denver, CO',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 5,
      quote: "The buyer inquiry form with pre-qualification questions saves me hours of back-and-forth. I can immediately see if someone is serious and ready to buy. Setup took me 8 minutes and I had my first lead within 2 hours of sharing my profile.",
      metrics: {
        leadIncrease: '3x',
        timeFrame: '6 weeks'
      }
    },
    {
      name: 'Emily Parker',
      title: 'Investment Property Advisor',
      location: 'Phoenix, AZ',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rating: 5,
      quote: "I moved from a generic link tool to AgentBio and the difference is night and day. Being able to showcase my 50+ investment property sales with actual numbers gives me instant credibility. My close rate went from 15% to 32%.",
      metrics: {
        leadIncrease: '32%',
        timeFrame: 'Close rate'
      }
    },
    {
      name: 'Marcus Williams',
      title: 'Commercial Real Estate Broker',
      location: 'Chicago, IL',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      rating: 5,
      quote: "The analytics are incredible. I can see exactly which listings get the most clicks and where my leads are coming from. This data helps me optimize my marketing spend. ROI tracking shows I'm getting $47 in commission for every $1 spent on AgentBio.",
      metrics: {
        leadIncrease: '47:1',
        timeFrame: 'ROI'
      }
    },
    {
      name: 'Sophia Chen',
      title: 'Residential Sales Agent',
      location: 'Seattle, WA',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      rating: 5,
      quote: "My brokerage requires us to maintain compliance with MLS rules. AgentBio's purpose-built platform makes it easy to showcase listings properly. The home valuation form alone has generated 23 seller leads in the past month.",
      metrics: {
        leadIncrease: '23',
        timeFrame: 'Seller leads/mo'
      }
    },
    {
      name: 'Robert Jackson',
      title: 'New Construction Specialist',
      location: 'Nashville, TN',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
      rating: 5,
      quote: "I was skeptical about another tool, but AgentBio is specifically built for agents. The mobile experience is flawless - most of my traffic comes from Instagram stories. The QR code feature on my for-sale signs has been huge for open houses.",
      metrics: {
        leadIncrease: '4x',
        timeFrame: 'Open house leads'
      }
    }
  ];

  return (
    <section className="py-20 bg-background" id="testimonials">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            <span className="glass-heading">Loved by Real Estate Agents</span>
          </h2>
          <p className="text-xl glass-body max-w-2xl mx-auto">
            See how agents are converting more leads and closing more deals with AgentBio
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-6 hover:border-primary/50 transition-all"
            >
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  "{testimonial.quote}"
                </p>
              </div>

              {/* Metrics Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg mb-4">
                <span className="text-lg font-bold text-green-600">
                  {testimonial.metrics.leadIncrease}
                </span>
                <span className="text-xs text-muted-foreground">
                  {testimonial.metrics.timeFrame}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-glass-border">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20"
          >
            <span className="text-foreground">Join Thousands of Successful Agents</span>
          </a>
          <p className="text-sm text-muted-foreground mt-3">
            Free plan available • Upgrade anytime
          </p>
        </div>
      </div>
    </section>
  );
}
