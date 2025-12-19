import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctions";
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
      return callEdgeFunction<{ success: boolean; message: string; imported: number }>(
        'import-keywords',
        {
          method: 'POST',
          body: { keywords },
          auth: true,
        }
      );
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
