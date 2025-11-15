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
        exports("u", useProfile);
        function useProfile() {
          const {
            user
          } = useAuthStore();
          const queryClient = useQueryClient();
          const {
            data: profile,
            isLoading
          } = useQuery({
            queryKey: ["profile", user?.id],
            queryFn: async () => {
              if (!user?.id) return null;
              const {
                data,
                error
              } = await supabase.from("profiles").select("*").eq("id", user.id).single();
              if (error) throw error;
              return data;
            },
            enabled: !!user?.id
          });
          const updateProfile = useMutation({
            mutationFn: async updates => {
              if (!user?.id) throw new Error("User not authenticated");
              const {
                data,
                error
              } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["profile", user?.id]
              });
            }
          });
          return {
            profile,
            isLoading,
            updateProfile
          };
        }
      }
    };
  });
})();
