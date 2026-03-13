import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  PSEOPage,
  PSEOQueueItem,
  PSEOTaxonomyItem,
  PSEOGenerationError,
  PSEOPrompt,
  PSEOStats,
  PSEOPageType,
  PSEOQueueInput,
  PSEOTaxonomyType,
} from "@/types/pseo";

export function usePSEO() {
  const queryClient = useQueryClient();

  // --- Pages ---

  const pagesQuery = useQuery({
    queryKey: ['pseo-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pseo_pages')
        .select('id, page_type, url_path, combination, is_published, quality_score, agent_count, generated_at, published_at, updated_at, next_refresh_at, generation_model, error_count')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as PSEOPage[];
    },
  });

  const pageDetailQuery = (id: string) => ({
    queryKey: ['pseo-page', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pseo_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PSEOPage;
    },
  });

  const publishPageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pseo_pages')
        .update({ is_published: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-pages'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Page published');
    },
    onError: (error) => {
      toast.error('Failed to publish page: ' + error.message);
    },
  });

  const unpublishPageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pseo_pages')
        .update({ is_published: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-pages'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Page unpublished');
    },
    onError: (error) => {
      toast.error('Failed to unpublish page: ' + error.message);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pseo_pages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-pages'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Page deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete page: ' + error.message);
    },
  });

  // --- Queue ---

  const queueQuery = useQuery({
    queryKey: ['pseo-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pseo_combination_queue')
        .select('*')
        .order('priority', { ascending: true })
        .order('queued_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as PSEOQueueItem[];
    },
  });

  const addToQueueMutation = useMutation({
    mutationFn: async (items: PSEOQueueInput[]) => {
      const rows = items.map(item => ({
        page_type: item.page_type,
        combination: item.combination,
        priority: item.priority ?? 5,
        status: 'pending' as const,
      }));

      const { error } = await supabase
        .from('pseo_combination_queue')
        .upsert(rows, { onConflict: 'page_type,combination' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Items added to generation queue');
    },
    onError: (error) => {
      toast.error('Failed to add to queue: ' + error.message);
    },
  });

  const retryQueueItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pseo_combination_queue')
        .update({ status: 'pending', error_message: null, attempt_count: 0 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Queue item reset to pending');
    },
    onError: (error) => {
      toast.error('Failed to retry: ' + error.message);
    },
  });

  const deleteQueueItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pseo_combination_queue')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Queue item removed');
    },
    onError: (error) => {
      toast.error('Failed to delete queue item: ' + error.message);
    },
  });

  // --- Taxonomy ---

  const taxonomyQuery = useQuery({
    queryKey: ['pseo-taxonomy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pseo_taxonomy')
        .select('*')
        .order('taxonomy_type')
        .order('tier', { ascending: true })
        .order('display_name');

      if (error) throw error;
      return (data ?? []) as PSEOTaxonomyItem[];
    },
  });

  const createTaxonomyMutation = useMutation({
    mutationFn: async (item: Omit<PSEOTaxonomyItem, 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('pseo_taxonomy')
        .insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-taxonomy'] });
      toast.success('Taxonomy item created');
    },
    onError: (error) => {
      toast.error('Failed to create taxonomy item: ' + error.message);
    },
  });

  const updateTaxonomyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PSEOTaxonomyItem> }) => {
      const { error } = await supabase
        .from('pseo_taxonomy')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-taxonomy'] });
      toast.success('Taxonomy item updated');
    },
    onError: (error) => {
      toast.error('Failed to update taxonomy item: ' + error.message);
    },
  });

  const deleteTaxonomyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pseo_taxonomy')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-taxonomy'] });
      toast.success('Taxonomy item deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete taxonomy item: ' + error.message);
    },
  });

  // --- Errors ---

  const errorsQuery = useQuery({
    queryKey: ['pseo-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pseo_generation_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as PSEOGenerationError[];
    },
  });

  // --- Prompts ---

  const promptsQuery = useQuery({
    queryKey: ['pseo-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pseo_prompts')
        .select('*')
        .order('page_type');

      if (error) throw error;
      return (data ?? []) as PSEOPrompt[];
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PSEOPrompt> }) => {
      const { error } = await supabase
        .from('pseo_prompts')
        .update({ ...updates, version: updates.version })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-prompts'] });
      toast.success('Prompt updated');
    },
    onError: (error) => {
      toast.error('Failed to update prompt: ' + error.message);
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: async (prompt: Pick<PSEOPrompt, 'page_type' | 'system_prompt' | 'user_prompt_template'>) => {
      const { error } = await supabase
        .from('pseo_prompts')
        .insert(prompt);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-prompts'] });
      toast.success('Prompt created');
    },
    onError: (error) => {
      toast.error('Failed to create prompt: ' + error.message);
    },
  });

  // --- Stats ---

  const statsQuery = useQuery({
    queryKey: ['pseo-stats'],
    queryFn: async (): Promise<PSEOStats> => {
      const [pagesRes, queueRes, errorsRes] = await Promise.all([
        supabase.from('pseo_pages').select('page_type, is_published, quality_score'),
        supabase.from('pseo_combination_queue').select('status'),
        supabase.from('pseo_generation_errors').select('id').gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),
      ]);

      const pages = pagesRes.data ?? [];
      const queue = queueRes.data ?? [];
      const errors = errorsRes.data ?? [];

      const publishedPages = pages.filter(p => p.is_published);
      const qualityScores = pages.map(p => p.quality_score).filter(Boolean);

      const pagesByType: Record<string, number> = {};
      pages.forEach(p => {
        pagesByType[p.page_type] = (pagesByType[p.page_type] || 0) + 1;
      });

      return {
        totalPages: pages.length,
        publishedPages: publishedPages.length,
        draftPages: pages.length - publishedPages.length,
        avgQualityScore: qualityScores.length
          ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
          : 0,
        queuePending: queue.filter(q => q.status === 'pending').length,
        queueProcessing: queue.filter(q => q.status === 'processing').length,
        queueFailed: queue.filter(q => q.status === 'failed').length,
        recentErrors: errors.length,
        pagesByType,
      };
    },
  });

  // --- Bulk operations ---

  const bulkPublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('pseo_pages')
        .update({ is_published: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-pages'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Pages published');
    },
    onError: (error) => {
      toast.error('Failed to bulk publish: ' + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('pseo_pages')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pseo-pages'] });
      queryClient.invalidateQueries({ queryKey: ['pseo-stats'] });
      toast.success('Pages deleted');
    },
    onError: (error) => {
      toast.error('Failed to bulk delete: ' + error.message);
    },
  });

  return {
    // Pages
    pages: pagesQuery.data,
    isLoadingPages: pagesQuery.isLoading,
    pageDetailQuery,
    publishPage: publishPageMutation.mutate,
    unpublishPage: unpublishPageMutation.mutate,
    deletePage: deletePageMutation.mutate,
    bulkPublish: bulkPublishMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,

    // Queue
    queue: queueQuery.data,
    isLoadingQueue: queueQuery.isLoading,
    addToQueue: addToQueueMutation.mutate,
    isAddingToQueue: addToQueueMutation.isPending,
    retryQueueItem: retryQueueItemMutation.mutate,
    deleteQueueItem: deleteQueueItemMutation.mutate,

    // Taxonomy
    taxonomy: taxonomyQuery.data,
    isLoadingTaxonomy: taxonomyQuery.isLoading,
    createTaxonomy: createTaxonomyMutation.mutate,
    updateTaxonomy: updateTaxonomyMutation.mutate,
    deleteTaxonomy: deleteTaxonomyMutation.mutate,

    // Errors
    errors: errorsQuery.data,
    isLoadingErrors: errorsQuery.isLoading,

    // Prompts
    prompts: promptsQuery.data,
    isLoadingPrompts: promptsQuery.isLoading,
    updatePrompt: updatePromptMutation.mutate,
    createPrompt: createPromptMutation.mutate,

    // Stats
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
  };
}
