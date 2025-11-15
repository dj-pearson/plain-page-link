import { b as useQueryClient, u as useQuery, c as useMutation } from './data-zpsFEjqp.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as useAuthStore } from './state-stores-BQHzCYsU.js';

function useListings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
  const addListing = useMutation({
    mutationFn: async (listingData) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase.from("listings").insert({
        user_id: user.id,
        ...listingData
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", user?.id] });
    }
  });
  const updateListing = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from("listings").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", user?.id] });
    }
  });
  const deleteListing = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", user?.id] });
    }
  });
  return {
    listings,
    isLoading,
    addListing,
    updateListing,
    deleteListing
  };
}

export { useListings as u };
