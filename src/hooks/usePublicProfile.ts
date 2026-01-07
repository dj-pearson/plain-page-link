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
          specialties,
          service_cities,
          service_zip_codes,
          license_number,
          license_state,
          phone,
          email_display,
          calendly_url,
          instagram_url,
          facebook_url,
          linkedin_url,
          tiktok_url,
          youtube_url,
          zillow_url,
          realtor_com_url,
          website_url,
          seo_title,
          seo_description,
          og_image,
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
            address,
            city,
            price,
            beds,
            baths,
            bedrooms,
            bathrooms,
            sqft,
            square_feet,
            status,
            sort_order,
            is_featured,
            days_on_market,
            description,
            property_type
          `)
          .eq('user_id', profile.id)
          .in('status', ['active', 'pending', 'under_contract', 'sold'])
          .order('sort_order', { ascending: true }),

        // Fetch testimonials with only needed columns
        supabase
          .from('testimonials')
          .select(`
            id,
            client_name,
            client_title,
            client_photo,
            review,
            rating,
            sort_order,
            date,
            is_featured,
            transaction_type,
            property_type,
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

      // Transform testimonials to match expected type (review -> review_text)
      const transformedTestimonials = (testimonials || []).map(t => ({
        ...t,
        review_text: t.review,
        date: t.date || t.created_at, // Fallback to created_at if date is null
      }));

      // Transform listings to add expected fields
      const transformedListings = (listings || []).map(l => ({
        ...l,
        title: l.address, // Use address as title since title column doesn't exist
        bedrooms: l.bedrooms ?? l.beds,
        bathrooms: l.bathrooms ?? l.baths,
        square_feet: l.square_feet ?? l.sqft,
      }));

      return {
        profile,
        listings: transformedListings,
        testimonials: transformedTestimonials,
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
