import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePublicProfile = (username: string) => {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      // Fetch profile by username - ONLY PUBLIC FIELDS
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          bio,
          avatar_url,
          theme,
          title,
          brokerage_name,
          brokerage_logo,
          years_experience,
          certifications,
          service_cities,
          service_zip_codes,
          city,
          seo_title,
          seo_description,
          og_image,
          display_name,
          created_at,
          is_published
        `)
        .eq('username', username)
        .eq('is_published', true)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Increment view count (non-blocking - fire and forget)
      supabase.rpc('increment_profile_views', {
        _profile_id: profile.id
      }).then(() => {}).catch(() => {});

      // Fetch all related data in parallel instead of sequential
      const [
        { data: listings, error: listingsError },
        { data: testimonials, error: testimonialsError },
        { data: links, error: linksError },
        { data: settings, error: settingsError }
      ] = await Promise.all([
        // Fetch listings with only needed columns
        supabase
          .from('listings')
          .select(`
            id,
            image,
            photos,
            title,
            address,
            city,
            price,
            original_price,
            bedrooms,
            bathrooms,
            square_feet,
            status,
            sort_order,
            is_featured,
            days_on_market,
            description,
            open_house_date
          `)
          .eq('user_id', profile.id)
          .in('status', ['active', 'pending', 'under_contract', 'sold'])
          .order('sort_order', { ascending: true }),

        // Fetch testimonials with only needed columns
        supabase
          .from('testimonials')
          .select(`
            id,
            author_name,
            author_role,
            content,
            rating,
            sort_order,
            created_at,
            is_published
          `)
          .eq('user_id', profile.id)
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),

        // Fetch links with only needed columns
        supabase
          .from('links')
          .select(`
            id,
            title,
            url,
            icon,
            position,
            is_active
          `)
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .order('position', { ascending: true }),

        // Fetch user settings
        supabase
          .from('user_settings')
          .select('show_listings, show_sold_properties, show_testimonials, show_social_proof, show_contact_buttons')
          .eq('user_id', profile.id)
          .maybeSingle()
      ]);

      // Handle errors from parallel queries
      if (listingsError) throw listingsError;
      if (testimonialsError) throw testimonialsError;
      if (linksError) throw linksError;
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
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds - reduces unnecessary refetches
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
};
