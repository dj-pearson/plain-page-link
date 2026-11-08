import type { PublicProfile } from '@/types/profile';
import type { PublicProfileListing } from '@/types/listing';
import { toStringList } from '@/types/profile';
import type { ProfileRow } from '@/types/profile';
import type { PublicProfileFields } from '@/types/profile';
import type { PublicListingFields } from '@/types/listing';
import type { Database } from '@/integrations/supabase/types';
import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeUsername } from '@/lib/username';
import { publicProfileFilter } from '@/lib/profilePublishing';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  agentFactRowsFromPublicPage,
  agentPageFactsQueryOptions,
  profileCustomCssQueryOptions,
  profileShowsBrandingQueryOptions,
  publicOpenHousesQueryOptions,
  type PublicOpenHouse,
} from '@/lib/publicProfileSideQueries';

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type ListingRow = Row<'listings'>;

/**
 * The page as the database hands it over, before the jsonb list columns are
 * narrowed. Both paths below produce exactly this, and shapePublicProfilePage
 * turns it into what the page renders, so the two cannot drift apart.
 */
interface RawPublicProfilePage {
  profile: Pick<ProfileRow, PublicProfileFields>;
  listings: Pick<ListingRow, PublicListingFields>[] | null;
  testimonials:
    | Pick<
        Row<'testimonials'>,
        | 'id'
        | 'client_name'
        | 'client_title'
        | 'client_photo'
        | 'review'
        | 'rating'
        | 'sort_order'
        | 'date'
        | 'is_featured'
        | 'transaction_type'
        | 'property_type'
        | 'created_at'
        | 'is_published'
      >[]
    | null;
  links: Pick<Row<'links'>, 'id' | 'title' | 'url' | 'icon' | 'position' | 'is_active'>[] | null;
  settings: Pick<
    Row<'user_settings'>,
    | 'show_listings'
    | 'show_sold_properties'
    | 'show_testimonials'
    | 'show_social_proof'
    | 'show_contact_buttons'
  > | null;
  responseHours: unknown;
  customPage: Pick<Row<'custom_pages'>, 'id' | 'slug' | 'title' | 'blocks' | 'theme'> | null;
}

/** What get_public_profile_page returns: the raw page plus the two side reads. */
interface PublicProfilePageRpcResult extends RawPublicProfilePage {
  showsBranding: boolean | null;
  /**
   * The agent's custom CSS (US-514): null when there is none to apply,
   * absent on a database that predates 20261108000514.
   */
  customCss?: string | null;
  /** Null when the agent hides listings: the section never renders then. */
  openHouses: PublicOpenHouse[] | null;
}

/** PostgREST / Postgres codes for "this function does not exist here". */
const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883']);

/**
 * The whole page in one round trip (US-329, slice of US-286).
 *
 * get_public_profile_page is SECURITY INVOKER: it runs as the visitor, so RLS
 * and the profiles column grants apply exactly as they do to the table reads
 * it replaces. Returns the page, `null` for no such (visible) profile, or
 * `undefined` when the function is not deployed on this database — the caller
 * then falls back to the table reads, so the frontend can ship first.
 */
async function fetchPublicProfilePageRpc(
  username: string
): Promise<PublicProfilePageRpcResult | null | undefined> {
  const { data, error } = await supabase.rpc('get_public_profile_page', { _username: username });
  if (error) {
    if (MISSING_FUNCTION_CODES.has(error.code)) return undefined;
    throw error;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as unknown as PublicProfilePageRpcResult;
}

function notFound(): Error {
  // FullProfilePage renders NotFound for PGRST116 or this message (US-112).
  return Object.assign(new Error('Profile not found'), { code: 'PGRST116' });
}

/** Narrow the jsonb columns and fill defaults; shared by both fetch paths. */
function shapePublicProfilePage(raw: RawPublicProfilePage) {
  const { profile, listings, testimonials, links, settings, responseHours, customPage } = raw;
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
}

/**
 * The public profile read, as query options shared by two callers (US-267):
 *
 *   - usePublicProfile, inside FullProfilePage, which renders it; and
 *   - ProfileRoute, in the entry chunk, which starts the same query the moment
 *     the /:slug route matches — before the FullProfilePage chunk has even
 *     been requested.
 *
 * Before, the profile's critical path was strictly serial: entry JS, then the
 * lazy FullProfilePage chunk and its imports, then mount, then the profiles
 * row, then the six related reads. The data could not start until the code
 * that asks for it had downloaded. Sharing the key lets the chunk download and
 * the data read overlap; the page's useQuery finds the request already in
 * flight (or finished) and does not issue another.
 *
 * The data read itself is one round trip since US-329 (get_public_profile_page)
 * where it used to be two: the profile row, then everything keyed on its id.
 *
 * Keep this module light: it is in the entry graph, so it may import only what
 * the entry already carries (the Supabase client, react-query, small helpers).
 */
export const publicProfileQueryOptions = (rawUsername: string, viewerId: string | null) => {
  // Usernames are stored canonical (lower case); the slug comes from a URL a
  // human typed. Compare the two in the same form or `/JaneDoe` 404s.
  const username = normalizeUsername(rawUsername);
  // The signed-in agent may see their own page while it is unpublished
  // (US-265). The viewer is part of the key so a cached owner preview is never
  // served after sign-out, and a cached 404 never hides the page from its owner.
  return queryOptions({
    queryKey: ['public-profile', username, viewerId] as const,
    queryFn: async ({ client }) => {
      const page = await fetchPublicProfilePageRpc(username);
      if (page === null) throw notFound();
      if (page) {
        seedSideQueries(client, page);
        seedPageFacts(client, page, viewerId);
        return shapePublicProfilePage(page);
      }
      const raw = await fetchPublicProfilePageByTables(client, username, viewerId);
      seedPageFacts(client, raw, viewerId);
      return shapePublicProfilePage(raw);
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 60 seconds - reduces unnecessary refetches
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
};

/**
 * The branding flag and open houses arrive inside the one payload. Hand them
 * to the hooks that own them, under those hooks' keys, so neither issues its
 * own RPC on mount. Open houses are absent when listings are hidden — the
 * section does not mount then, so there is nothing to seed and nothing fetched.
 */
function seedSideQueries(client: QueryClient, page: PublicProfilePageRpcResult) {
  const agentId = page.profile.id;
  if (typeof page.showsBranding === 'boolean') {
    client.setQueryData(profileShowsBrandingQueryOptions(agentId).queryKey, page.showsBranding);
  }
  if (Array.isArray(page.openHouses)) {
    client.setQueryData(publicOpenHousesQueryOptions(agentId).queryKey, page.openHouses);
  }
  // Absent (an older database): leave it to the hook's own read.
  if (page.customCss === null || typeof page.customCss === 'string') {
    client.setQueryData(
      profileCustomCssQueryOptions(agentId).queryKey,
      page.customCss && page.customCss.trim() ? page.customCss : null
    );
  }
}

/**
 * The page builder's Stats and Testimonial blocks read the agent's listing
 * counts, years of experience and published testimonials. The payload already
 * holds all of it, so hand it over under the blocks' own key and they make no
 * requests of their own on /:username (US-316); before, that was four more.
 * Only when the page has blocks to show; agentFactRowsFromPublicPage declines
 * for the owner's own view, which can include sample listings.
 */
function seedPageFacts(client: QueryClient, raw: RawPublicProfilePage, viewerId: string | null) {
  if (!raw.customPage) return;
  const rows = agentFactRowsFromPublicPage(raw, viewerId);
  if (rows) client.setQueryData(agentPageFactsQueryOptions(raw.profile.id).queryKey, rows);
}

/**
 * The previous two-round-trip path: the profile row, then six reads keyed on
 * its id. Kept for a database that does not have get_public_profile_page yet.
 */
async function fetchPublicProfilePageByTables(
  client: QueryClient,
  username: string,
  viewerId: string | null
): Promise<RawPublicProfilePage> {
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
    // Published, or the viewer's own (US-265). This was
    // `.neq('is_published', false)`, so an unpublished page was invisible
    // to its owner too, and there was no way to preview it.
    .or(publicProfileFilter(viewerId))
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

  // The branding and open-house reads belong to their own hooks, which
  // mount only after this query resolves and the page renders — a third
  // serial round trip (US-307). Start them now, under the hooks' own keys,
  // so they travel with the six reads below. Not awaited: the profile does
  // not wait on them, and prefetchQuery never throws. A query that is
  // already cached and fresh is not fetched again, and one in flight is
  // joined, so the hooks never issue a second request on mount.
  void client.prefetchQuery(profileShowsBrandingQueryOptions(profile.id));
  void client.prefetchQuery(publicOpenHousesQueryOptions(profile.id));
  void client.prefetchQuery(profileCustomCssQueryOptions(profile.id));

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
      // The dashboard's order exactly (compareListingOrder). sort_order
      // alone left ties — every listing an agent never dragged sits at 0
      // — in whatever order Postgres returned them, which could change
      // from one visit to the next (US-253).
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true }),

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

  return {
    profile,
    listings,
    testimonials,
    links,
    settings,
    responseHours,
    customPage: customPage ?? null,
  };
}

export const usePublicProfile = (rawUsername: string) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery(publicProfileQueryOptions(rawUsername, viewerId));
};
