import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, TestTube, Brain } from "lucide-react";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";

export function AIConfigurationManager() {
  const {
    models,
    config,
    isLoading,
    getConfigValue,
    handleUpdateConfig,
    toggleModel,
    testModel,
    isTestingModel,
  } = useAIConfiguration();

  if (isLoading) {
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
                onClick={() => testModel(defaultModel)}
                disabled={isTestingModel}
                title="Test AI Model"
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
                    toggleModel({ id: model.id, isActive: checked })
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
