import { b as useQueryClient, u as useQuery, c as useMutation } from './data-zpsFEjqp.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as useAuthStore } from './state-stores-BQHzCYsU.js';

function useProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
  const updateProfile = useMutation({
    mutationFn: async (updates) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    }
  });
  return {
    profile,
    isLoading,
    updateProfile
  };
}

export { useProfile as u };
