import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { AIModel } from "@/hooks/useAIConfiguration";

interface AddModelDialogProps {
  onAdd: (model: Omit<AIModel, 'id'>) => void;
  isAdding: boolean;
}

export function AddModelDialog({ onAdd, isAdding }: AddModelDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    model_name: '',
    model_id: '',
    description: '',
    context_window: 200000,
    max_output_tokens: 8192,
    supports_vision: true,
    is_active: true,
    auth_type: 'bearer' as 'bearer' | 'x-api-key',
    secret_name: '',
    api_endpoint: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    // Reset form
    setFormData({
      provider: '',
      model_name: '',
      model_id: '',
      description: '',
      context_window: 200000,
      max_output_tokens: 8192,
      supports_vision: true,
      is_active: true,
      auth_type: 'bearer',
      secret_name: '',
      api_endpoint: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Model
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New AI Model</DialogTitle>
            <DialogDescription>
              Configure a new AI model with authentication and endpoint details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider Name *</Label>
              <Input
                id="provider"
                placeholder="e.g., Anthropic"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                required
              />
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <Label htmlFor="model_name">Display Name *</Label>
              <Input
                id="model_name"
                placeholder="e.g., Claude Sonnet 4.5"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                required
              />
            </div>

            {/* Model ID */}
            <div className="space-y-2">
              <Label htmlFor="model_id">Model ID *</Label>
              <Input
                id="model_id"
                placeholder="e.g., claude-sonnet-4-5-20250929"
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">The exact model identifier for API calls</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of model capabilities"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Auth Type */}
            <div className="space-y-2">
              <Label htmlFor="auth_type">Authentication Type *</Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value: 'bearer' | 'x-api-key') => 
                  setFormData({ ...formData, auth_type: value })
                }
              >
                <SelectTrigger id="auth_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="x-api-key">X-API-Key Header</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How the API key is sent (Bearer for most, X-API-Key for Anthropic)
              </p>
            </div>

            {/* Secret Name */}
            <div className="space-y-2">
              <Label htmlFor="secret_name">Supabase Secret Name *</Label>
              <Input
                id="secret_name"
                placeholder="e.g., CLAUDE_API_KEY"
                value={formData.secret_name}
                onChange={(e) => setFormData({ ...formData, secret_name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Name of the secret stored in Supabase (must be added to Supabase secrets)
              </p>
            </div>

            {/* API Endpoint */}
            <div className="space-y-2">
              <Label htmlFor="api_endpoint">API Endpoint *</Label>
              <Input
                id="api_endpoint"
                placeholder="e.g., https://api.anthropic.com/v1/messages"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                required
              />
            </div>

            {/* Context Window */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="context_window">Context Window</Label>
                <Input
                  id="context_window"
                  type="number"
                  value={formData.context_window}
                  onChange={(e) => setFormData({ ...formData, context_window: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_output_tokens">Max Output Tokens</Label>
                <Input
                  id="max_output_tokens"
                  type="number"
                  value={formData.max_output_tokens}
                  onChange={(e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Switches */}
            <div className="flex items-center justify-between">
              <Label htmlFor="supports_vision">Supports Vision</Label>
              <Switch
                id="supports_vision"
                checked={formData.supports_vision}
                onCheckedChange={(checked) => setFormData({ ...formData, supports_vision: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Model
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
