import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useArticleWebhooks } from "@/hooks/useArticleWebhooks";

export function ArticleWebhookDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const { createWebhook } = useArticleWebhooks();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !webhookUrl.trim()) {
      return;
    }

    createWebhook({
      name,
      webhook_url: webhookUrl,
      is_active: isActive,
    });

    // Reset form
    setName("");
    setWebhookUrl("");
    setIsActive(true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Article Webhook</DialogTitle>
          <DialogDescription>
            Configure a webhook to receive article data when articles are published
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Webhook Name</Label>
            <Input
              id="name"
              placeholder="My Social Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Webhook URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/webhooks/article"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <Button type="submit" className="w-full">
            Create Webhook
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
