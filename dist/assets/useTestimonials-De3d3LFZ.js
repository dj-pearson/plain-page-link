import { b as useQueryClient, u as useQuery, c as useMutation } from "./data-kszmrHwg.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
import { u as useAuthStore } from "./state-stores-BzsyoW3J.js";
import { u as useToast } from "./index-CAwD2FR9.js";
function useTestimonials() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials", user == null ? void 0 : user.id],
    queryFn: async () => {
      if (!(user == null ? void 0 : user.id)) return [];
      const { data, error } = await supabase.from("testimonials").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!(user == null ? void 0 : user.id)
  });
  const addTestimonial = useMutation({
    mutationFn: async (testimonialData) => {
      if (!(user == null ? void 0 : user.id)) throw new Error("User not authenticated");
      const { data, error } = await supabase.from("testimonials").insert({
        user_id: user.id,
        ...testimonialData
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", user == null ? void 0 : user.id] });
      toast({
        title: "Testimonial Added",
        description: "Your testimonial has been added successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Testimonial",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  const updateTestimonial = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from("testimonials").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", user == null ? void 0 : user.id] });
      toast({
        title: "Testimonial Updated",
        description: "Your testimonial has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Testimonial",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  const deleteTestimonial = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", user == null ? void 0 : user.id] });
      toast({
        title: "Testimonial Deleted",
        description: "Your testimonial has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Testimonial",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  return {
    testimonials,
    isLoading,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial
  };
}
export {
  useTestimonials as u
};
