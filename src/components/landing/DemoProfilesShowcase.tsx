import { ExternalLink, Home, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface FeaturedProfile {
  id: string;
  username: string;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  service_cities: string[] | null;
  theme: string | null;
}

/**
 * DemoProfilesShowcase Component
 * Displays real agent profiles from the database to inspire new users
 * Falls back to a signup CTA if no public profiles are available
 */
export function DemoProfilesShowcase() {
  // Fetch real public profiles from the database
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['featured-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, title, bio, avatar_url, service_cities, theme')
        .not('username', 'is', null)
        .not('full_name', 'is', null)
        .limit(6);

      if (error) throw error;
      return (data as FeaturedProfile[]).filter(p => p.username && p.full_name);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5" id="demo-profiles">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  // If no profiles available, show signup CTA instead
  if (profiles.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5" id="demo-profiles">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-12">
              <Users className="w-16 h-16 mx-auto text-primary mb-6" />
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mb-4">
                <span className="glass-heading">Be Among the First</span>
              </h2>
              <p className="text-xl glass-body mb-8">
                Join our growing community of real estate professionals and create your professional AgentBio profile today.
              </p>
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                Create Your Profile
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Display real profiles
  return (
    <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5" id="demo-profiles">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            <span className="glass-heading">Meet Our Agents</span>
          </h2>
          <p className="text-xl glass-body max-w-2xl mx-auto">
            Real estate professionals using AgentBio to grow their business.
          </p>
        </header>

        <div className={`grid gap-8 max-w-6xl mx-auto ${profiles.length >= 3 ? 'md:grid-cols-3' : profiles.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 'max-w-md'}`}>
          {profiles.slice(0, 3).map((profile) => (
            <Link
              key={profile.id}
              to={`/p/${profile.username}`}
              className="group block"
            >
              <div className="bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all">
                {/* Avatar */}
                <div className="relative mb-4">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Agent'}
                      width={96}
                      height={96}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-background shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-semibold text-primary">
                        {(profile.full_name || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {profile.theme && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      {profile.theme}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {profile.full_name}
                  </h3>
                  {profile.title && (
                    <p className="text-sm text-primary font-medium mb-1">
                      {profile.title}
                    </p>
                  )}
                  {profile.service_cities && profile.service_cities.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {profile.service_cities.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* View Profile CTA */}
                <div className="flex items-center justify-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                  View Profile
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20"
          >
            <span className="text-foreground">Create Your Own Profile</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
