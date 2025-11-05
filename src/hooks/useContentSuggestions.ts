import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentSuggestion {
  id: string;
  topic: string;
  category: string | null;
  keywords: string[];
  priority: number | null;
  status: string | null;
  suggested_by: string | null;
  generated_article_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useContentSuggestions() {
  const queryClient = useQueryClient();

  // Fetch all suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["content-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_suggestions")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContentSuggestion[];
    },
  });

  // Generate suggestions
  const generateSuggestionsMutation = useMutation({
    mutationFn: async ({ customInstructions, count }: { customInstructions?: string; count?: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('generate-content-suggestions', {
        body: { customInstructions, count }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate suggestions");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      toast.success("Content suggestions generated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate suggestions");
    },
  });

  // Update suggestion status (queue, reject, etc.)
  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentSuggestion> }) => {
      const { data, error } = await supabase
        .from("content_suggestions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update suggestion");
    },
  });

  // Delete suggestion
  const deleteSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_suggestions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      toast.success("Suggestion deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete suggestion");
    },
  });

  // Add to keywords
  const addToKeywordsMutation = useMutation({
    mutationFn: async (suggestion: ContentSuggestion) => {
      const keywordsToAdd = suggestion.keywords || [suggestion.topic];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('import-keywords', {
        body: { 
          keywords: keywordsToAdd.map(kw => ({
            keyword: kw,
            category: suggestion.category || 'General'
          }))
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to add to keywords");
      }

      // Update suggestion status
      await supabase
        .from("content_suggestions")
        .update({ status: 'completed' })
        .eq("id", suggestion.id);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success("Added to keywords successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add to keywords");
    },
  });

  // Generate article from suggestion
  const writeArticleMutation = useMutation({
    mutationFn: async (suggestion: ContentSuggestion) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // First, queue the suggestion
      await supabase
        .from("content_suggestions")
        .update({ status: 'queued' })
        .eq("id", suggestion.id);

      // Then trigger article generation
      const response = await supabase.functions.invoke('generate-article', {
        body: { 
          topic: suggestion.topic,
          category: suggestion.category,
          keywords: suggestion.keywords,
          autoSelectKeyword: false
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate article");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article generated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate article");
    },
  });

  return {
    suggestions,
    isLoading,
    generateSuggestions: (customInstructions?: string, count?: number) => 
      generateSuggestionsMutation.mutate({ customInstructions, count }),
    isGenerating: generateSuggestionsMutation.isPending,
    updateSuggestion: (id: string, updates: Partial<ContentSuggestion>) =>
      updateSuggestionMutation.mutate({ id, updates }),
    deleteSuggestion: (id: string) => deleteSuggestionMutation.mutate(id),
    queueSuggestion: (id: string) => updateSuggestionMutation.mutate({ id, updates: { status: 'queued' } }),
    rejectSuggestion: (id: string) => updateSuggestionMutation.mutate({ id, updates: { status: 'rejected' } }),
    addToKeywords: (suggestion: ContentSuggestion) => addToKeywordsMutation.mutate(suggestion),
    writeArticle: (suggestion: ContentSuggestion) => writeArticleMutation.mutate(suggestion),
    isWritingArticle: writeArticleMutation.isPending,
  };
}