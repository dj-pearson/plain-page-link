import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { logAuditEvent } from '@/lib/audit';
import { toStringList } from '@/types/profile';
import { applySortOrderChanges, type SortOrderChange } from '@/lib/listingOrder';
import type { Database } from '@/integrations/supabase/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];

/**
 * A listing as the dashboard consumes it.
 *
 * Restated by hand this omitted `highlights`, `sort_order`, `listed_date`,
 * `sold_date` and `days_on_market` — and the omission was not harmless: the
 * add-listing form collects Property Highlights and passes them to
 * addListing, where `Partial<Omit<Listing, ...>>` silently rejected the key.
 * `as Listing[]` on the query hid all of it.
 *
 * `photos` is jsonb; every consumer treats it as a URL list, so it is narrowed
 * at the read boundary the same way usePublicProfile does.
 */
export type Listing = Omit<ListingRow, 'photos'> & { photos: string[] | null };

/**
 * The columns a caller may supply when creating a listing.
 *
 * The table's own Insert type, not a Partial of the Row: address, city, price,
 * beds and baths are NOT NULL, and a Partial let a caller omit them and find
 * out at the database.
 */
export type NewListing = Omit<Database['public']['Tables']['listings']['Insert'], 'user_id'>;

/** The columns a caller may change on an existing listing. */
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];

export function useListings() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const {
    data: listings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        // Same order the public gallery uses, so a reorder on the dashboard
        // shows the agent exactly what a visitor will see. It ordered by
        // created_at, which meant the dashboard and the public page disagreed
        // as soon as sort_order was written (US-107). created_at breaks ties,
        // since every listing starts at sort_order 0, and id breaks the rest so
        // equal rows cannot swap between fetches (US-253). Mirrors
        // compareListingOrder, which the optimistic reorder sorts with.
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .order('id', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row): Listing => ({ ...row, photos: toStringList(row.photos) }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const addListing = useMutation({
    mutationFn: async (listingData: NewListing) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          ...listingData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings', user?.id] });
      logAuditEvent('listing_create', {
        resourceType: 'listing',
        resourceId: (data as { id?: string })?.id,
      });
    },
  });

  const updateListing = useMutation({
    mutationFn: async ({ id, ...updates }: ListingUpdate & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Security: Verify user owns this listing by requiring both id and user_id match
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listings', user?.id] });
      logAuditEvent('listing_update', {
        resourceType: 'listing',
        resourceId: variables.id,
      });
    },
  });

  /**
   * Write a new display order (US-253).
   *
   * Takes only the rows whose sort_order changes (see sortOrderChanges), so a
   * drag writes what moved rather than every listing. The reorder used to call
   * updateListing once per visible row: N requests, N cache invalidations and
   * N audit events for one drag. This writes the changed rows in parallel,
   * reorders the cache immediately so the card lands where it was dropped,
   * restores it if any write fails, and invalidates and audits once.
   */
  const reorderListings = useMutation({
    mutationFn: async (changes: SortOrderChange[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      const results = await Promise.all(
        changes.map(({ id, sort_order }) =>
          supabase.from('listings').update({ sort_order }).eq('id', id).eq('user_id', user.id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (changes) => {
      const key = ['listings', user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Listing[]>(key);
      if (previous) {
        queryClient.setQueryData<Listing[]>(key, applySortOrderChanges(previous, changes));
      }
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Listing[]>(['listings', user?.id], context.previous);
      }
    },
    onSuccess: (_data, changes) => {
      logAuditEvent('listing_reorder', {
        resourceType: 'listing',
        details: { changed: changes.length },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', user?.id] });
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Security: Verify user owns this listing by requiring both id and user_id match
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['listings', user?.id] });
      logAuditEvent('listing_delete', {
        resourceType: 'listing',
        resourceId: id,
      });
    },
  });

  return {
    listings,
    isLoading,
    isError,
    error,
    refetch,
    addListing,
    updateListing,
    reorderListings,
    deleteListing,
  };
}
