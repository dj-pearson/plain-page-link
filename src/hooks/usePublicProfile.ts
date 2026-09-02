import type { PublicProfile } from '@/types/profile';
import type { PublicProfileListing } from '@/types/listing';
import { toStringList } from '@/types/profile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePublicProfile = (username: string) => {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      // Fetch profile by username - ONLY PUBLIC FIELDS
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          `
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
          sms_enabled,
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
        `
        )
        .eq('username', username)
        .neq('is_published', false)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // No view increment here any more (US-115).
      //
      // This called increment_profile_views, a SECURITY DEFINER RPC with no
      // throttle, from the anon client — so profiles.view_count and the
      // analytics_views rows counted different things, and anyone holding the
      // anon key (it ships in the bundle) could loop it. The counter is now a
      // trigger on the throttled analytics_views insert, which useProfileTracking
      // makes once per mounted page. Fetching a profile is not a view: this ran
      // even for an agent whose page immediately redirects to a custom page.

      // Fetch all related data in parallel instead of sequential
      const [
        { data: listings, error: listingsError },
        { data: testimonials, error: testimonialsError },
        { data: links, error: linksError },
        { data: settings, error: settingsError },
        { data: responseHours },
        { data: customPage },
      ] = await Promise.all([
        // Fetch listings with only needed columns
        supabase
          .from('listings')
          .select(
            `
            id,
            image,
            photos,
            address,
            city,
            price,
            bedrooms,
            bathrooms,
            square_feet,
            status,
            sort_order,
            is_featured,
            days_on_market,
            description,
            property_type,
            state,
            zip_code,
            mls_number,
            lot_size_acres,
            virtual_tour_url,
            highlights,
            created_at
          `
          )
          .eq('user_id', profile.id)
          .in('status', ['active', 'pending', 'under_contract', 'sold'])
          .order('sort_order', { ascending: true }),

        // Fetch testimonials with only needed columns
        supabase
          .from('testimonials')
          .select(
            `
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
          `
          )
          .eq('user_id', profile.id)
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),

        // Fetch links with only needed columns
        supabase
          .from('links')
          .select(
            `
            id,
            title,
            url,
            icon,
            position,
            is_active
          `
          )
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .order('position', { ascending: true }),

        // Fetch user settings
        supabase
          .from('user_settings')
          .select(
            'show_listings, show_sold_properties, show_testimonials, show_social_proof, show_contact_buttons'
          )
          .eq('user_id', profile.id)
          .maybeSingle(),

        // Median hours to first response over the last 90 days, or null below
        // 5 responded leads. An aggregate from a SECURITY DEFINER function —
        // `leads` itself stays unreadable to a visitor (US-111). The page used
        // to hard-code "< 1 hour" for every agent.
        supabase.rpc('public_agent_response_hours', { _user_id: profile.id }),

        // The agent's active page-builder page, if they have one.
        //
        // This used to be fetched by FullProfilePage in its own effect, purely
        // to decide whether to <Navigate> away to /p/<slug> — so building a
        // page in the page builder silently replaced the entire listings and
        // lead-capture profile with it. The blocks are a SECTION of the profile
        // now (US-116), so they are fetched with everything else.
        //
        // maybeSingle + limit(1): .single() raises PGRST116 for none AND for
        // several, and an agent with two active pages used to end up with
        // neither.
        supabase
          .from('custom_pages')
          .select('id, slug, title, blocks, theme')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .eq('published', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // Handle errors from parallel queries
      if (listingsError) throw listingsError;
      if (testimonialsError) throw testimonialsError;
      if (linksError) throw linksError;
      if (settingsError) throw settingsError;

      // `review_text` and `title` used to be synthesized here to satisfy types
      // that named columns the schema does not have. Those types now derive from
      // the generated Row (US-056), and the consumers read `review` and
      // `address` directly, so the aliases are gone rather than kept as a second
      // name for the same value.
      const transformedTestimonials = (testimonials || []).map((t) => ({
        ...t,
        date: t.date || t.created_at, // date is nullable; fall back to created_at
      }));

      // One naming convention. beds/baths/sqft are GENERATED from these
      // columns since US-106 and are not selected at all: the normalisation
      // that stood here was `bedrooms ?? beds`, which meant the STALE value won
      // whenever an edit wrote only the integers — an agent changed 3 beds to 4
      // and their clients kept seeing 3.
      const transformedListings: PublicProfileListing[] = (listings || []).map((l) => ({
        ...l,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        square_feet: l.square_feet,
        // photos is jsonb; every consumer treats it as a URL list.
        photos: toStringList(l.photos),
      }));

      // specialties/certifications/service_* are jsonb. Every consumer maps
      // over them as string lists, so narrow once here rather than at each
      // render site; a malformed value degrades to [] instead of throwing.
      const publicProfile: PublicProfile = {
        ...profile,
        specialties: toStringList(profile.specialties),
        certifications: toStringList(profile.certifications),
        service_cities: toStringList(profile.service_cities),
        service_zip_codes: toStringList(profile.service_zip_codes),
      };

      return {
        profile: publicProfile,
        listings: transformedListings,
        testimonials: transformedTestimonials,
        links: links || [],
        responseHours: typeof responseHours === 'number' ? responseHours : null,
        customPage: customPage ?? null,
        settings: settings || {
          show_listings: true,
          show_sold_properties: true,
          show_testimonials: true,
          show_social_proof: true,
          show_contact_buttons: true,
        },
      };
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds - reduces unnecessary refetches
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
};
