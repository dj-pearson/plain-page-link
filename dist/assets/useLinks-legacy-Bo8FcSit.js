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
        exports("u", useLinks);
        function useLinks() {
          const {
            user
          } = useAuthStore();
          const queryClient = useQueryClient();
          const {
            toast
          } = useToast();
          const {
            data: links = [],
            isLoading
          } = useQuery({
            queryKey: ["links", user?.id],
            queryFn: async () => {
              if (!user?.id) return [];
              const {
                data,
                error
              } = await supabase.from("links").select("*").eq("user_id", user.id).order("position", {
                ascending: true
              });
              if (error) throw error;
              return data;
            },
            enabled: !!user?.id
          });
          const addLink = useMutation({
            mutationFn: async linkData => {
              if (!user?.id) throw new Error("User not authenticated");
              const maxPosition = links.length > 0 ? Math.max(...links.map(l => l.position)) : -1;
              const {
                data,
                error
              } = await supabase.from("links").insert({
                user_id: user.id,
                title: linkData.title,
                url: linkData.url,
                icon: linkData.icon,
                position: maxPosition + 1,
                is_active: linkData.active
              }).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["links", user?.id]
              });
              toast({
                title: "Link Added",
                description: "Your custom link has been added successfully."
              });
            },
            onError: error => {
              toast({
                title: "Failed to Add Link",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
              });
            }
          });
          const updateLink = useMutation({
            mutationFn: async ({
              id,
              ...updates
            }) => {
              const {
                data,
                error
              } = await supabase.from("links").update(updates).eq("id", id).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["links", user?.id]
              });
              toast({
                title: "Link Updated",
                description: "Your link has been updated successfully."
              });
            },
            onError: error => {
              toast({
                title: "Failed to Update Link",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
              });
            }
          });
          const deleteLink = useMutation({
            mutationFn: async id => {
              const {
                error
              } = await supabase.from("links").delete().eq("id", id);
              if (error) throw error;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["links", user?.id]
              });
              toast({
                title: "Link Deleted",
                description: "Your link has been deleted successfully."
              });
            },
            onError: error => {
              toast({
                title: "Failed to Delete Link",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
              });
            }
          });
          const toggleActive = useMutation({
            mutationFn: async ({
              id,
              is_active
            }) => {
              const {
                error
              } = await supabase.from("links").update({
                is_active
              }).eq("id", id);
              if (error) throw error;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["links", user?.id]
              });
            }
          });
          return {
            links,
            isLoading,
            addLink,
            updateLink,
            deleteLink,
            toggleActive
          };
        }
      }
    };
  });
})();
