import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  author_id?: string;
  status: string;
  category: string;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  keyword_id?: string;
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export function useArticles() {
  const queryClient = useQueryClient();

  // Fetch articles
  const articlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Article[];
    },
  });

  // Generate article with AI
  const generateArticleMutation = useMutation({
    mutationFn: async (params: {
      topic?: string;
      category?: string;
      keywords?: string[];
      customInstructions?: string;
      autoSelectKeyword?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Article generated successfully!');
      } else {
        toast.error(data.error || 'Generation failed');
      }
    },
    onError: (error) => {
      toast.error('Failed to generate article: ' + error.message);
    },
  });

  // Create article
  const createArticleMutation = useMutation({
    mutationFn: async (article: Partial<Article>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...article,
          author_id: userData.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create article: ' + error.message);
    },
  });

  // Update article
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Article> }) => {
      const { error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update article: ' + error.message);
    },
  });

  // Publish article
  const publishArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article published successfully');
    },
    onError: (error) => {
      toast.error('Failed to publish article: ' + error.message);
    },
  });

  // Re-publish article (trigger webhooks again)
  const republishArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('publish-article-to-social', {
        body: { articleId: id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Article distributed to social platforms successfully');
      } else {
        toast.error(data?.error || 'Failed to distribute article');
      }
    },
    onError: (error) => {
      toast.error('Failed to distribute article: ' + error.message);
    },
  });

  // Delete article
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete article: ' + error.message);
    },
  });

  return {
    articles: articlesQuery.data,
    isLoading: articlesQuery.isLoading,
    generateArticle: generateArticleMutation.mutate,
    isGenerating: generateArticleMutation.isPending,
    generatedArticle: generateArticleMutation.data,
    createArticle: createArticleMutation.mutate,
    updateArticle: updateArticleMutation.mutate,
    publishArticle: publishArticleMutation.mutate,
    republishArticle: republishArticleMutation.mutate,
    isRepublishing: republishArticleMutation.isPending,
    deleteArticle: deleteArticleMutation.mutate,
  };
}
