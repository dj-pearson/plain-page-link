;
(function () {
  System.register(['./data-legacy-BmYdDdMQ.js', './supabase-legacy-CQONYrP8.js', './state-stores-legacy-80VekGrm.js', './index-legacy-CvrXsObU.js'], function (exports, module) {
    'use strict';

    var useQueryClient, useQuery, useMutation, supabase, useAuthStore, useToast;
    return {
      setters: [module => {
        useQueryClient = module.b;
        useQuery = module.u;
        useMutation = module.c;
      }, module => {
        supabase = module.s;
      }, module => {
        useAuthStore = module.u;
      }, module => {
        useToast = module.u;
      }],
      execute: function () {
        exports("u", useTestimonials);
        function useTestimonials() {
          const {
            user
          } = useAuthStore();
          const queryClient = useQueryClient();
          const {
            toast
          } = useToast();
          const {
            data: testimonials = [],
            isLoading
          } = useQuery({
            queryKey: ["testimonials", user?.id],
            queryFn: async () => {
              if (!user?.id) return [];
              const {
                data,
                error
              } = await supabase.from("testimonials").select("*").eq("user_id", user.id).order("date", {
                ascending: false
              });
              if (error) throw error;
              return data;
            },
            enabled: !!user?.id
          });
          const addTestimonial = useMutation({
            mutationFn: async testimonialData => {
              if (!user?.id) throw new Error("User not authenticated");
              const {
                data,
                error
              } = await supabase.from("testimonials").insert({
                user_id: user.id,
                ...testimonialData
              }).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["testimonials", user?.id]
              });
              toast({
                title: "Testimonial Added",
                description: "Your testimonial has been added successfully."
              });
            },
            onError: error => {
              toast({
                title: "Failed to Add Testimonial",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
              });
            }
          });
          const updateTestimonial = useMutation({
            mutationFn: async ({
              id,
              ...updates
            }) => {
              const {
                data,
                error
              } = await supabase.from("testimonials").update(updates).eq("id", id).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["testimonials", user?.id]
              });
              toast({
                title: "Testimonial Updated",
                description: "Your testimonial has been updated successfully."
              });
            },
            onError: error => {
              toast({
                title: "Failed to Update Testimonial",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
              });
            }
          });
          const deleteTestimonial = useMutation({
            mutationFn: async id => {
              const {
                error
              } = await supabase.from("testimonials").delete().eq("id", id);
              if (error) throw error;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["testimonials", user?.id]
              });
              toast({
                title: "Testimonial Deleted",
                description: "Your testimonial has been deleted successfully."
              });
            },
            onError: error => {
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
      }
    };
  });
})();
