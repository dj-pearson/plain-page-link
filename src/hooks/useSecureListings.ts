/**
 * Secure Listings Hook
 *
 * Enhanced version of useListings with defense-in-depth security layers.
 *
 * Security Layers Applied:
 * 1. Authentication - All operations require valid session
 * 2. Authorization - Permission checks for each operation
 * 3. Ownership - Data scoped to current user (admins can see all)
 * 4. Validation - Input sanitization on all mutations
 * 5. RLS - Database enforces final access control
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSecurity } from '@/hooks/useSecurity';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export interface Listing {
  id: string;
  user_id: string;
  image?: string;
  address: string;
  city: string;
  price: string;
  beds: number;
  baths: number;
  sqft?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Valid listing statuses
const VALID_STATUSES = ['active', 'pending', 'sold'] as const;
type ListingStatus = (typeof VALID_STATUSES)[number];

// ============================================================
// Hook
// ============================================================

export function useSecureListings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    isAuthenticated,
    isAdmin,
    userId,
    requireAccess,
    sanitize,
    validate,
  } = useSecurity();

  // --------------------------------------------------------
  // Query: Fetch Listings (with ownership filtering)
  // --------------------------------------------------------
  const {
    data: listings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['secure-listings', userId, isAdmin],
    queryFn: async () => {
      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'listing.view_own',
      });

      // Build query
      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      // Layer 3: Ownership filtering (admins see all, users see own)
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch listings', error, { action: 'fetch_listings' });
        throw error;
      }

      return data as Listing[];
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // --------------------------------------------------------
  // Mutation: Add Listing
  // --------------------------------------------------------
  const addListing = useMutation({
    mutationFn: async (
      listingData: Omit<Listing, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'listing.create',
      });

      if (!userId) throw new Error('User not authenticated');

      // Layer 4: Input Sanitization
      const sanitizedData = sanitize.listing({
        address: listingData.address,
        city: listingData.city,
        price: listingData.price,
        status: listingData.status,
      });

      // Validate status
      if (sanitizedData.status && !VALID_STATUSES.includes(sanitizedData.status as ListingStatus)) {
        throw new Error('Invalid listing status');
      }

      // Validate numeric fields
      if (listingData.beds < 0 || listingData.baths < 0) {
        throw new Error('Beds and baths must be non-negative');
      }

      if (listingData.sqft !== undefined && listingData.sqft < 0) {
        throw new Error('Square footage must be non-negative');
      }

      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...listingData,
          ...sanitizedData,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add listing', error, { action: 'add_listing' });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-listings', userId] });
    },
  });

  // --------------------------------------------------------
  // Mutation: Update Listing
  // --------------------------------------------------------
  const updateListing = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Listing> & { id: string }) => {
      // Validate resource ID
      validate.resourceId(id, 'listing');

      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'listing.update_own',
      });

      if (!userId) throw new Error('User not authenticated');

      // Layer 4: Input Sanitization
      const sanitizedUpdates = sanitize.listing({
        address: updates.address,
        city: updates.city,
        price: updates.price,
        status: updates.status,
      });

      // Validate status if being updated
      if (sanitizedUpdates.status && !VALID_STATUSES.includes(sanitizedUpdates.status as ListingStatus)) {
        throw new Error('Invalid listing status');
      }

      // Validate numeric fields if being updated
      if (updates.beds !== undefined && updates.beds < 0) {
        throw new Error('Beds must be non-negative');
      }
      if (updates.baths !== undefined && updates.baths < 0) {
        throw new Error('Baths must be non-negative');
      }
      if (updates.sqft !== undefined && updates.sqft < 0) {
        throw new Error('Square footage must be non-negative');
      }

      // Build update with sanitized data
      const updateData = {
        ...updates,
        ...Object.fromEntries(
          Object.entries(sanitizedUpdates).filter(([_, v]) => v !== undefined)
        ),
        updated_at: new Date().toISOString(),
      };

      // Layer 3: Ownership check in query (RLS backup)
      let query = supabase
        .from('listings')
        .update(updateData)
        .eq('id', id);

      // Non-admins must own the resource
      if (!isAdmin) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Listing update ownership violation', {
            listingId: id.substring(0, 8),
            userId: userId?.substring(0, 8),
          });
          throw new Error('Listing not found or access denied');
        }
        logger.error('Failed to update listing', error, { action: 'update_listing' });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-listings', userId] });
    },
  });

  // --------------------------------------------------------
  // Mutation: Delete Listing
  // --------------------------------------------------------
  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      // Validate resource ID
      validate.resourceId(id, 'listing');

      // Layer 1 & 2: Authentication + Authorization
      await requireAccess({
        authenticated: true,
        permission: 'listing.delete_own',
      });

      if (!userId) throw new Error('User not authenticated');

      // Layer 3: Ownership check in query (RLS backup)
      let query = supabase.from('listings').delete().eq('id', id);

      // Non-admins must own the resource
      if (!isAdmin) {
        query = query.eq('user_id', userId);
      }

      const { error, count } = await query;

      if (error) {
        logger.error('Failed to delete listing', error, { action: 'delete_listing' });
        throw error;
      }

      // Check if deletion succeeded
      if (count === 0) {
        logger.warn('Listing delete ownership violation', {
          listingId: id.substring(0, 8),
          userId: userId?.substring(0, 8),
        });
        throw new Error('Listing not found or access denied');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-listings', userId] });
    },
  });

  // --------------------------------------------------------
  // Query: Get Single Listing
  // --------------------------------------------------------
  const getListing = async (id: string): Promise<Listing | null> => {
    // Validate resource ID
    validate.resourceId(id, 'listing');

    // Layer 1 & 2: Authentication + Authorization
    await requireAccess({
      authenticated: true,
      permission: 'listing.view_own',
    });

    if (!userId) return null;

    // Build query with ownership filter
    let query = supabase.from('listings').select('*').eq('id', id);

    // Non-admins must own the resource
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Listing;
  };

  // --------------------------------------------------------
  // Query: Get Listings by Status
  // --------------------------------------------------------
  const getListingsByStatus = async (status: ListingStatus): Promise<Listing[]> => {
    // Layer 1 & 2: Authentication + Authorization
    await requireAccess({
      authenticated: true,
      permission: 'listing.view_own',
    });

    if (!userId) return [];

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      throw new Error('Invalid status');
    }

    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Non-admins see only their own
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as Listing[];
  };

  return {
    listings,
    isLoading,
    isError,
    error,
    refetch,
    addListing,
    updateListing,
    deleteListing,
    getListing,
    getListingsByStatus,
  };
}
