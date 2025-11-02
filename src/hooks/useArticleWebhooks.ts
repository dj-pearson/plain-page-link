import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ArticleWebhook {
  id: string;
  user_id: string;
  name: string;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useArticleWebhooks() {
  const queryClient = useQueryClient();

  // Fetch webhooks
  const webhooksQuery = useQuery({
    queryKey: ['article-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ArticleWebhook[];
    },
  });

  // Create webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (webhook: Partial<ArticleWebhook>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('article_webhooks')
        .insert({
          ...webhook,
          user_id: userData.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-webhooks'] });
      toast.success('Webhook created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create webhook: ' + error.message);
    },
  });

  // Update webhook
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ArticleWebhook> }) => {
      const { error } = await supabase
        .from('article_webhooks')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-webhooks'] });
      toast.success('Webhook updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update webhook: ' + error.message);
    },
  });

  // Delete webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('article_webhooks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-webhooks'] });
      toast.success('Webhook deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete webhook: ' + error.message);
    },
  });

  // Test webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      const { data, error } = await supabase.functions.invoke('test-article-webhook', {
        body: { webhookUrl }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Test payload sent successfully! Check your Make.com scenario.');
      } else {
        toast.error(data?.error || 'Test failed');
      }
    },
    onError: (error) => {
      toast.error('Failed to test webhook: ' + error.message);
    },
  });

  return {
    webhooks: webhooksQuery.data,
    isLoading: webhooksQuery.isLoading,
    createWebhook: createWebhookMutation.mutate,
    updateWebhook: updateWebhookMutation.mutate,
    deleteWebhook: deleteWebhookMutation.mutate,
    testWebhook: testWebhookMutation.mutate,
    isTesting: testWebhookMutation.isPending,
    testResult: testWebhookMutation.data,
  };
}
