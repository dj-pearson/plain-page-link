import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "./use-toast";

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
  const { toast } = useToast();

  const { data: testimonials = [], isLoading, isError, error, refetch } = useQuery({
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
      toast({
        title: "Testimonial Added",
        description: "Your testimonial has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Testimonial",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
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
      toast({
        title: "Testimonial Updated",
        description: "Your testimonial has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Testimonial",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
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
      toast({
        title: "Testimonial Deleted",
        description: "Your testimonial has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Testimonial",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  return {
    testimonials,
    isLoading,
    isError,
    error,
    refetch,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
  };
}
