import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePublicProfile = (username: string) => {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      // Fetch profile by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_published', true)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Increment view count
      await supabase.rpc('increment_profile_views', {
        _profile_id: profile.id
      });

      // Fetch listings
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', profile.id)
        .in('status', ['active', 'pending', 'under_contract', 'sold'])
        .order('sort_order', { ascending: true });

      if (listingsError) throw listingsError;

      // Fetch testimonials
      const { data: testimonials, error: testimonialsError } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (testimonialsError) throw testimonialsError;

      // Fetch links
      const { data: links, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (linksError) throw linksError;

      // Fetch user settings for profile visibility
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('show_listings, show_sold_properties, show_testimonials, show_social_proof, show_contact_buttons')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      return {
        profile,
        listings: listings || [],
        testimonials: testimonials || [],
        links: links || [],
        settings: settings || {
          show_listings: true,
          show_sold_properties: true,
          show_testimonials: true,
          show_social_proof: true,
          show_contact_buttons: true,
        }
      };
    },
    enabled: !!username,
  });
};
