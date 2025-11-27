import { ExternalLink, Home, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * DemoProfilesShowcase Component
 * Displays live demo agent profiles to inspire new users
 */
export function DemoProfilesShowcase() {
  const demoProfiles = [
    {
      name: 'Sarah Johnson',
      username: 'sarahjohnson',
      title: 'Luxury Home Specialist',
      location: 'Austin, TX',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      stats: {
        listings: 12,
        sold: 47,
        rating: 4.9
      },
      theme: 'Luxury',
      description: 'Specializing in high-end properties in downtown Austin'
    },
    {
      name: 'Michael Chen',
      username: 'michaelchen',
      title: "Buyer's Agent",
      location: 'San Francisco, CA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      stats: {
        listings: 8,
        sold: 63,
        rating: 5.0
      },
      theme: 'Modern',
      description: 'Helping first-time buyers navigate the SF market'
    },
    {
      name: 'Jessica Martinez',
      username: 'jessicamartinez',
      title: 'Investment Property Expert',
      location: 'Miami, FL',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
      stats: {
        listings: 15,
        sold: 89,
        rating: 4.8
      },
      theme: 'Coastal',
      description: 'Multi-family and investment properties specialist'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5" id="demo-profiles">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            <span className="glass-heading">See AgentBio in Action</span>
          </h2>
          <p className="text-xl glass-body max-w-2xl mx-auto">
            Real agent profiles built with AgentBio. Click to explore live demos.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {demoProfiles.map((profile) => (
            <Link
              key={profile.username}
              to={`/p/${profile.username}`}
              className="group block"
            >
              <div className="bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all">
                {/* Avatar */}
                <div className="relative mb-4">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    width={96}
                    height={96}
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-background shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    {profile.theme}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-1">
                    {profile.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.location}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-b border-glass-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Home className="h-4 w-4" />
                      <span className="text-lg font-semibold">{profile.stats.listings}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-lg font-semibold">{profile.stats.sold}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-lg font-semibold">{profile.stats.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {profile.description}
                </p>

                {/* View Profile CTA */}
                <div className="flex items-center justify-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                  View Live Profile
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Note about demos */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-6">
            These are example profiles to demonstrate AgentBio's capabilities
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20"
          >
            <span className="text-foreground">Create Your Own Profile in 10 Minutes</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
