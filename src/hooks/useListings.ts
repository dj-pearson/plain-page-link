import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export interface Listing {
  id: string;
  user_id: string;
  image?: string | null;
  photos?: string[] | null;
  address: string;
  city: string;
  state?: string | null;
  zip_code?: string | null;
  price: string;
  beds: number;
  baths: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  square_feet?: number | null;
  status: string;
  description?: string | null;
  property_type?: string | null;
  mls_number?: string | null;
  lot_size_acres?: number | null;
  virtual_tour_url?: string | null;
  open_house_date?: string | null;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export function useListings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["listings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const addListing = useMutation({
    mutationFn: async (listingData: Partial<Omit<Listing, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          ...listingData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", user?.id] });
    },
  });

  const updateListing = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Listing> & { id: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Security: Verify user owns this listing by requiring both id and user_id match
      const { data, error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", user?.id] });
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Security: Verify user owns this listing by requiring both id and user_id match
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", user?.id] });
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
    deleteListing,
  };
}
