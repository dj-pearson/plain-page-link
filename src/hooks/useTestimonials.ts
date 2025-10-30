import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export interface Testimonial {
  id: string;
  user_id: string;
  client_name: string;
  rating: number;
  review: string;
  property_type?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export function useTestimonials() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: !!user?.id,
  });

  const addTestimonial = useMutation({
    mutationFn: async (testimonialData: Omit<Testimonial, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("testimonials")
        .insert({
          user_id: user.id,
          ...testimonialData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", user?.id] });
    },
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Testimonial> & { id: string }) => {
      const { data, error } = await supabase
        .from("testimonials")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", user?.id] });
    },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", user?.id] });
    },
  });

  return {
    testimonials,
    isLoading,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
  };
}
