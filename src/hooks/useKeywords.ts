import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Keyword {
  id: string;
  keyword: string;
  category: string;
  usage_count: number;
  last_used_at: string | null;
  is_active: boolean;
  difficulty: string;
  search_volume: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useKeywords() {
  const queryClient = useQueryClient();

  // Fetch all keywords
  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ["keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .order("usage_count", { ascending: true })
        .order("keyword", { ascending: true });

      if (error) throw error;
      return data as Keyword[];
    },
  });

  // Fetch unused keywords (never used or least used)
  const { data: unusedKeywords = [] } = useQuery({
    queryKey: ["keywords", "unused"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: true })
        .order("last_used_at", { ascending: true, nullsFirst: true })
        .limit(50);

      if (error) throw error;
      return data as Keyword[];
    },
  });

  // Import keywords from CSV
  const importKeywordsMutation = useMutation({
    mutationFn: async (keywords: Array<string | Partial<Keyword>>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/import-keywords`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keywords }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import keywords");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success(data.message || "Keywords imported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import keywords");
    },
  });

  // Update keyword
  const updateKeywordMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Keyword> }) => {
      const { data, error } = await supabase
        .from("keywords")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success("Keyword updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update keyword");
    },
  });

  // Delete keyword
  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("keywords")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success("Keyword deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete keyword");
    },
  });

  return {
    keywords,
    unusedKeywords,
    isLoading,
    importKeywords: (keywords: Array<string | Partial<Keyword>>) => importKeywordsMutation.mutate(keywords),
    isImporting: importKeywordsMutation.isPending,
    updateKeyword: (id: string, updates: Partial<Keyword>) =>
      updateKeywordMutation.mutate({ id, updates }),
    deleteKeyword: (id: string) => deleteKeywordMutation.mutate(id),
  };
}
