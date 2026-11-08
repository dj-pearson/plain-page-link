import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  toViewedListings,
  VIEWED_LISTINGS_FETCH_LIMIT,
  type ViewedListing,
} from '@/lib/leadViewedListings';

interface LeadVisitorRef {
  user_id: string;
  visitor_id?: string | null;
  created_at?: string | null;
}

/**
 * The listings this lead's browser opened before the lead was created
 * (US-531). Reads the agent's own listing_view events; RLS ("Agents read their
 * own interactions") limits them to the agent and to the plan's analytics
 * history window, so a teammate reading an assigned lead sees nothing rather
 * than an error.
 */
export async function fetchLeadViewedListings(lead: LeadVisitorRef): Promise<ViewedListing[]> {
  if (!lead.visitor_id) return [];
  let query = supabase
    .from('analytics_events')
    .select('target_id, target_label, occurred_at')
    .eq('user_id', lead.user_id)
    .eq('visitor_id', lead.visitor_id)
    .eq('event_type', 'listing_view');
  if (lead.created_at) query = query.lte('occurred_at', lead.created_at);
  const { data, error } = await query
    .order('occurred_at', { ascending: false })
    .limit(VIEWED_LISTINGS_FETCH_LIMIT);
  if (error) {
    logger.error('Failed to load the listings a lead viewed', error);
    throw error;
  }
  return toViewedListings(data, lead.created_at);
}

export function useLeadViewedListings(lead: LeadVisitorRef | null | undefined) {
  const visitorId = lead?.visitor_id ?? null;
  const query = useQuery({
    queryKey: ['lead-viewed-listings', lead?.user_id, visitorId, lead?.created_at],
    queryFn: () => fetchLeadViewedListings(lead as LeadVisitorRef),
    enabled: !!lead?.user_id && !!visitorId,
    staleTime: 5 * 60 * 1000,
  });
  return {
    viewed: query.data ?? [],
    isLoading: query.isLoading && !!visitorId,
    isError: query.isError,
  };
}
