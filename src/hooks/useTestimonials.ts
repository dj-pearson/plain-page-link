import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from './use-toast';

// Re-exported from the schema-derived type rather than restated. The local
// interface used to omit client_title, transaction_type, client_photo,
// is_featured, sort_order, is_published and listing_id — all real columns that
// Testimonials.tsx reads, so the page was type-checking against a narrower
// shape than it actually received (US-056).
export type { Testimonial } from '@/types/testimonial';
import type { Testimonial } from '@/types/testimonial';

export function useTestimonials() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: testimonials = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['testimonials', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: !!user?.id,
  });

  const addTestimonial = useMutation({
    mutationFn: async (
      testimonialData: Omit<Testimonial, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          ...testimonialData,
          user_id: user.id,
          // US-074 set the column default to false so anonymous public
          // submissions arrive pending. A testimonial the agent adds here is
          // their own decision, so it goes live unless they explicitly say
          // otherwise.
          is_published: testimonialData.is_published ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials', user?.id] });
      toast({
        title: 'Testimonial Added',
        description: 'Your testimonial has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Testimonial',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  /**
   * Approve (or unpublish) a testimonial. Public submissions arrive with
   * is_published = false — see US-074 — and are invisible on the profile until
   * the agent approves them here.
   */
  const setTestimonialPublished = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('testimonials')
        .update({ is_published: isPublished })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_data, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: ['testimonials', user?.id] });
      toast({
        title: isPublished ? 'Testimonial published' : 'Testimonial hidden',
        description: isPublished
          ? 'It is now visible on your public profile.'
          : 'It is no longer visible on your public profile.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not update the testimonial',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Testimonial> & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Security: Verify user owns this testimonial by requiring both id and user_id match
      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials', user?.id] });
      toast({
        title: 'Testimonial Updated',
        description: 'Your testimonial has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Testimonial',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Security: Verify user owns this testimonial by requiring both id and user_id match
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials', user?.id] });
      toast({
        title: 'Testimonial Deleted',
        description: 'Your testimonial has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Delete Testimonial',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
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
    setTestimonialPublished,
    deleteTestimonial,
  };
}
