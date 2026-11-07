import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toStringList } from '@/types/profile';
import { logger } from '@/lib/logger';

/**
 * The listing a lead asked about (US-264).
 *
 * leads.listing_id has been written at capture since US-096 and nothing ever
 * read it back: the lead detail showed the address text only, so "which of my
 * eleven listings is this about, and is it still available?" meant opening the
 * Listings page and matching addresses by eye.
 */
export interface LeadListing {
  id: string;
  address: string;
  city: string;
  state: string | null;
  price: string;
  status: string | null;
  photo: string | null;
  /** The listing owner's username, for the public page link. */
  username: string | null;
}

/** Columns the card needs. `price` is text in this schema. */
const LISTING_COLUMNS = 'id, user_id, address, city, state, price, status, photos, image';

export async function fetchLeadListing(listingId: string): Promise<LeadListing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('id', listingId)
    .maybeSingle();
  if (error) {
    logger.error('Failed to load the listing a lead asked about', error);
    throw error;
  }
  // Deleted since the enquiry (or not visible to this caller).
  if (!data) return null;

  // The owner is usually the caller, but a team assignee may be reading a
  // teammate's lead; the public link must use the owner's page. `username` is
  // one of the public profile columns (US-073).
  const { data: owner } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user_id)
    .maybeSingle();

  return {
    id: data.id,
    address: data.address,
    city: data.city,
    state: data.state,
    price: data.price,
    status: data.status,
    photo: toStringList(data.photos)[0] ?? data.image ?? null,
    username: owner?.username ?? null,
  };
}

export function useLeadListing(listingId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['lead-listing', listingId],
    queryFn: () => fetchLeadListing(listingId as string),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });
  return {
    listing: query.data ?? null,
    isLoading: query.isLoading && !!listingId,
    error: query.error,
  };
}
