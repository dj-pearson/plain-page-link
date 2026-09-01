import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

/** A row from `social_media_posts`, exactly as stored. */
export type SocialMediaPost = Database['public']['Tables']['social_media_posts']['Row'];

/** A row from `social_media_webhooks`, exactly as stored. */
export type SocialMediaWebhook = Database['public']['Tables']['social_media_webhooks']['Row'];

/**
 * The mutations take the tables' own Insert types rather than a Partial of
 * the Row: content_type, subject_type and platform_type are NOT NULL on posts,
 * and name, platform and webhook_url are NOT NULL on webhooks, so a Partial
 * let a caller omit them and find out at the database. The hand-written types
 * these replace also missed `created_by`, `metadata` and `webhook_urls`
 * entirely, and typed post_title/status/created_at non-nullable.
 */
export type NewSocialMediaPost = Omit<
  Database['public']['Tables']['social_media_posts']['Insert'],
  'created_by'
>;

export type NewSocialMediaWebhook = Database['public']['Tables']['social_media_webhooks']['Insert'];

export function useSocialMedia() {
  const queryClient = useQueryClient();

  // Fetch posts
  const postsQuery = useQuery({
    queryKey: ['social-media-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SocialMediaPost[];
    },
  });

  // Fetch marketing posts
  const marketingPostsQuery = useQuery({
    queryKey: ['marketing-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('content_type', 'marketing')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SocialMediaPost[];
    },
  });

  // Fetch webhooks
  const webhooksQuery = useQuery({
    queryKey: ['social-media-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_webhooks')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SocialMediaWebhook[];
    },
  });

  // Generate post with AI
  const generatePostMutation = useMutation({
    mutationFn: async (params: {
      contentType: string;
      subjectType: string;
      platformType: string;
      listingId?: string;
      customPrompt?: string;
    }) => {
      const { data, error } = await edgeFunctions.invoke('generate-social-post', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Content generated successfully!');
      } else {
        toast.error(data.error || 'Generation failed');
      }
    },
    onError: (error) => {
      toast.error('Failed to generate content: ' + error.message);
    },
  });

  // Create post
  const createPostMutation = useMutation({
    mutationFn: async (post: NewSocialMediaPost) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('social_media_posts')
        .insert({
          ...post,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
      toast.success('Post created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create post: ' + error.message);
    },
  });

  // Update post
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SocialMediaPost> }) => {
      const { error } = await supabase
        .from('social_media_posts')
        .update(updates)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
      toast.success('Post updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update post: ' + error.message);
    },
  });

  // Delete post
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_media_posts').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete post: ' + error.message);
    },
  });

  // Create webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (webhook: NewSocialMediaWebhook) => {
      const { data, error } = await supabase
        .from('social_media_webhooks')
        .insert(webhook)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-webhooks'] });
      toast.success('Webhook created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create webhook: ' + error.message);
    },
  });

  // Update webhook
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SocialMediaWebhook> }) => {
      const { error } = await supabase
        .from('social_media_webhooks')
        .update(updates)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-webhooks'] });
      toast.success('Webhook updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update webhook: ' + error.message);
    },
  });

  // Delete webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_media_webhooks').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-webhooks'] });
      toast.success('Webhook deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete webhook: ' + error.message);
    },
  });

  // Test webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await edgeFunctions.invoke('test-social-webhook', {
        body: { webhookId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Test webhook sent successfully!');
      } else {
        toast.error('Test webhook failed: ' + (data.error || 'Unknown error'));
      }
    },
    onError: (error) => {
      toast.error('Failed to test webhook: ' + error.message);
    },
  });

  // Generate marketing post
  const generateMarketingPostMutation = useMutation({
    mutationFn: async (webhookUrl?: string) => {
      const { data, error } = await edgeFunctions.invoke('generate-marketing-post', {
        body: { webhookUrl },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-posts'] });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to generate post');
      }
    },
    onError: (error) => {
      toast.error('Failed to generate post: ' + error.message);
    },
  });

  // Retry/redeploy marketing post
  const retryMarketingPostMutation = useMutation({
    mutationFn: async ({ postId, webhookUrl }: { postId: string; webhookUrl: string }) => {
      const { data: post } = await supabase
        .from('social_media_posts')
        .select('post_content')
        .eq('id', postId)
        .single();

      if (!post) throw new Error('Post not found');

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post.post_content),
      });

      if (!webhookResponse.ok) {
        throw new Error('Webhook delivery failed');
      }

      await supabase
        .from('social_media_posts')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          webhook_urls: [webhookUrl],
        })
        .eq('id', postId)
        .select('id')
        .single();

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast.success('Post resent successfully');
    },
    onError: (error) => {
      logger.error('Failed to retry post', error as Error);
      toast.error('Failed to resend post');
    },
  });

  return {
    posts: postsQuery.data,
    marketingPosts: marketingPostsQuery.data,
    webhooks: webhooksQuery.data,
    isLoading: postsQuery.isLoading || webhooksQuery.isLoading || marketingPostsQuery.isLoading,
    generatePost: generatePostMutation.mutate,
    isGenerating: generatePostMutation.isPending,
    generatedContent: generatePostMutation.data,
    createPost: createPostMutation.mutate,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    createWebhook: createWebhookMutation.mutate,
    updateWebhook: updateWebhookMutation.mutate,
    deleteWebhook: deleteWebhookMutation.mutate,
    testWebhook: testWebhookMutation.mutate,
    isTestingWebhook: testWebhookMutation.isPending,
    generateMarketingPost: generateMarketingPostMutation.mutate,
    isGeneratingMarketingPost: generateMarketingPostMutation.isPending,
    marketingPostData: generateMarketingPostMutation.data,
    retryMarketingPost: retryMarketingPostMutation.mutate,
    isRetryingPost: retryMarketingPostMutation.isPending,
  };
}
