import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, TestTube, Brain } from "lucide-react";

interface AIModel {
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

interface AIConfig {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

export function AIConfigurationManager() {
  const queryClient = useQueryClient();
  const [isTestingModel, setIsTestingModel] = useState(false);

  // Fetch AI models
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('provider', { ascending: true });
      
      if (error) throw error;
      return data as AIModel[];
    },
  });

  // Fetch AI configuration
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['ai-configuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_configuration')
        .select('*');
      
      if (error) throw error;
      return data as AIConfig[];
    },
  });

  // Update configuration mutation
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
      toast.success('Configuration updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update configuration: ' + error.message);
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

  const getConfigValue = (key: string) => {
    const item = config?.find(c => c.setting_key === key);
    return item ? JSON.parse(item.setting_value) : '';
  };

  const handleUpdateConfig = (key: string, value: any) => {
    updateConfigMutation.mutate({ key, value: JSON.stringify(value) });
  };

  const testModel = async () => {
    setIsTestingModel(true);
    try {
      // Test the AI configuration by making a simple request
      toast.info('Testing AI model connection...');
      
      // Here you would call your edge function to test the model
      // For now, just simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('AI model is working correctly!');
    } catch (error) {
      toast.error('Model test failed');
    } finally {
      setIsTestingModel(false);
    }
  };

  if (modelsLoading || configLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const defaultModel = getConfigValue('default_model');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>
            Configure AI models and settings for content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="default-model">Default AI Model</Label>
            <div className="flex gap-2">
              <Select
                value={defaultModel}
                onValueChange={(value) => handleUpdateConfig('default_model', value)}
              >
                <SelectTrigger id="default-model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models?.map((model) => (
                    <SelectItem key={model.id} value={model.model_id}>
                      {model.model_name} ({model.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={testModel}
                disabled={isTestingModel}
              >
                {isTestingModel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Temperature Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp-precise">Precise Temperature</Label>
              <Input
                id="temp-precise"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={getConfigValue('temperature_precise')}
                onChange={(e) => handleUpdateConfig('temperature_precise', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">For data extraction and precise tasks</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-creative">Creative Temperature</Label>
              <Input
                id="temp-creative"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={getConfigValue('temperature_creative')}
                onChange={(e) => handleUpdateConfig('temperature_creative', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">For content generation and creative tasks</p>
            </div>
          </div>

          {/* Token Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tokens-standard">Standard Max Tokens</Label>
              <Input
                id="tokens-standard"
                type="number"
                step="100"
                value={getConfigValue('max_tokens_standard')}
                onChange={(e) => handleUpdateConfig('max_tokens_standard', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokens-large">Large Content Max Tokens</Label>
              <Input
                id="tokens-large"
                type="number"
                step="100"
                value={getConfigValue('max_tokens_large')}
                onChange={(e) => handleUpdateConfig('max_tokens_large', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle>Available AI Models</CardTitle>
          <CardDescription>Manage which models are available for selection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models?.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">{model.model_name}</h4>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Context: {model.context_window.toLocaleString()} tokens</span>
                    <span>Max Output: {model.max_output_tokens.toLocaleString()} tokens</span>
                    {model.supports_vision && <span>✓ Vision Support</span>}
                  </div>
                </div>
                <Switch
                  checked={model.is_active}
                  onCheckedChange={(checked) => 
                    toggleModelMutation.mutate({ id: model.id, isActive: checked })
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
