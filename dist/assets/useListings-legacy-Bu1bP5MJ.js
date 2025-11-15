;
(function () {
  System.register(['./data-legacy-BmYdDdMQ.js', './supabase-legacy-CQONYrP8.js', './state-stores-legacy-80VekGrm.js'], function (exports, module) {
    'use strict';

    var useQueryClient, useQuery, useMutation, supabase, useAuthStore;
    return {
      setters: [module => {
        useQueryClient = module.b;
        useQuery = module.u;
        useMutation = module.c;
      }, module => {
        supabase = module.s;
      }, module => {
        useAuthStore = module.u;
      }],
      execute: function () {
        exports("u", useListings);
        function useListings() {
          const {
            user
          } = useAuthStore();
          const queryClient = useQueryClient();
          const {
            data: listings = [],
            isLoading
          } = useQuery({
            queryKey: ["listings", user?.id],
            queryFn: async () => {
              if (!user?.id) return [];
              const {
                data,
                error
              } = await supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", {
                ascending: false
              });
              if (error) throw error;
              return data;
            },
            enabled: !!user?.id
          });
          const addListing = useMutation({
            mutationFn: async listingData => {
              if (!user?.id) throw new Error("User not authenticated");
              const {
                data,
                error
              } = await supabase.from("listings").insert({
                user_id: user.id,
                ...listingData
              }).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["listings", user?.id]
              });
            }
          });
          const updateListing = useMutation({
            mutationFn: async ({
              id,
              ...updates
            }) => {
              const {
                data,
                error
              } = await supabase.from("listings").update(updates).eq("id", id).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["listings", user?.id]
              });
            }
          });
          const deleteListing = useMutation({
            mutationFn: async id => {
              const {
                error
              } = await supabase.from("listings").delete().eq("id", id);
              if (error) throw error;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["listings", user?.id]
              });
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
      }
    };
  });
})();
