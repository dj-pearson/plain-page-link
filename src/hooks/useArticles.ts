import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

/**
 * A row from `articles`, exactly as stored.
 *
 * Restated by hand this omitted generated_from_suggestion_id and typed
 * status, category, tags, view_count, created_at and updated_at non-nullable
 * against a nullable schema.
 */
export type Article = Database['public']['Tables']['articles']['Row'];

/**
 * The columns a caller may supply when creating an article.
 *
 * The table's Insert type, not Partial<Article>: title, slug and content are
 * NOT NULL, and a Partial let a caller omit them and find out at the database.
 */
export type NewArticle = Omit<Database['public']['Tables']['articles']['Insert'], 'author_id'>;

/** The columns a caller may change on an existing article. */
export type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

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
      const { data, error } = await edgeFunctions.invoke('generate-article', {
        body: params,
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
    mutationFn: async (article: NewArticle) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...article,
          author_id: userData.user?.id,
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
    mutationFn: async ({ id, updates }: { id: string; updates: ArticleUpdate }) => {
      const { error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select('id')
        .single();

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
          published_at: new Date().toISOString(),
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

  // Helper function that accepts mutation options
  const publishArticle = (
    id: string,
    options?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    publishArticleMutation.mutate(id, {
      onSuccess: () => {
        options?.onSuccess?.();
      },
      onError: (error) => {
        options?.onError?.(error);
      },
    });
  };

  // Re-publish article (trigger webhooks again)
  const republishArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await edgeFunctions.invoke('publish-article-to-social', {
        body: { articleId: id },
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
      const { error } = await supabase.from('articles').delete().eq('id', id);

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
    publishArticle,
    isPublishing: publishArticleMutation.isPending,
    republishArticle: republishArticleMutation.mutate,
    isRepublishing: republishArticleMutation.isPending,
    deleteArticle: deleteArticleMutation.mutate,
  };
}
