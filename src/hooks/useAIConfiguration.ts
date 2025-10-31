import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIModel {
  id: string;
  model_id: string;
  model_name: string;
  provider: string;
  description: string;
  context_window: number;
  max_output_tokens: number;
  supports_vision: boolean;
  is_active: boolean;
}

export interface AIConfig {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

export function useAIConfiguration() {
  const queryClient = useQueryClient();

  // Fetch AI models
  const modelsQuery = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('provider', { ascending: true });
      
      if (error) throw error;
      return data as AIModel[];
    },
  });

  // Fetch AI configuration
  const configQuery = useQuery({
    queryKey: ['ai-configuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_configuration')
        .select('*');
      
      if (error) throw error;
      return data as AIConfig[];
    },
  });

  // Update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('ai_configuration')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('setting_key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configuration'] });
      toast.success('Configuration updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  // Toggle model active status
  const toggleModelMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('ai_models')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast.success('Model status updated');
    },
    onError: (error) => {
      toast.error('Failed to update model: ' + error.message);
    },
  });

  // Test AI model
  const testModelMutation = useMutation({
    mutationFn: async (model?: string) => {
      const { data, error } = await supabase.functions.invoke('test-ai-model', {
        body: { model }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      toast.error('Model test failed: ' + error.message);
    },
  });

  const getConfigValue = (key: string) => {
    const item = configQuery.data?.find(c => c.setting_key === key);
    if (!item) return '';
    
    try {
      // Try to parse as JSON first
      return JSON.parse(item.setting_value);
    } catch {
      // If parsing fails, return the raw string value
      return item.setting_value;
    }
  };

  const handleUpdateConfig = (key: string, value: any) => {
    updateConfigMutation.mutate({ key, value: JSON.stringify(value) });
  };

  return {
    models: modelsQuery.data,
    config: configQuery.data,
    isLoading: modelsQuery.isLoading || configQuery.isLoading,
    getConfigValue,
    handleUpdateConfig,
    toggleModel: toggleModelMutation.mutate,
    testModel: testModelMutation.mutate,
    isTestingModel: testModelMutation.isPending,
  };
}
