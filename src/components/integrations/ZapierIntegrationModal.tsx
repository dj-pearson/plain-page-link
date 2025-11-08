import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, CheckCircle, XCircle, Zap, AlertCircle, ExternalLink } from "lucide-react";

interface ZapierIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZapierIntegrationModal({
  open,
  onOpenChange,
}: ZapierIntegrationModalProps) {
  const { toast } = useToast();
  const { profile, refetch } = useProfile();
  const [webhookUrl, setWebhookUrl] = useState(profile?.zapier_webhook_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ zapier_webhook_url: webhookUrl || null })
        .eq('id', user.id);

      if (error) throw error;

      await refetch();

      toast({
        title: "Saved!",
        description: webhookUrl
          ? "Zapier webhook configured successfully"
          : "Zapier webhook removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save webhook URL",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const testPayload = {
        test: true,
        lead_id: "test-lead-id",
        name: "Test Lead",
        email: "test@example.com",
        phone: "+1 555-123-4567",
        message: "This is a test lead from AgentBio.net",
        lead_type: "contact",
        created_at: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        setTestResult("success");
        toast({
          title: "Test successful!",
          description: "Your Zapier webhook is working correctly",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setTestResult("error");
      toast({
        title: "Test failed",
        description: "Could not reach your webhook. Check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            Zapier Integration
          </DialogTitle>
          <DialogDescription>
            Automatically send new leads to your CRM via Zapier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Webhook URL Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Zapier Webhook URL
            </label>
            <Input
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste your Zapier webhook URL here
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                testResult === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {testResult === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {testResult === "success"
                  ? "Webhook test successful!"
                  : "Webhook test failed. Check your URL."}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={isTesting || !webhookUrl}
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Webhook
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-2">
                  How to set up Zapier integration:
                </p>
                <ol className="text-blue-800 space-y-2 list-decimal list-inside">
                  <li>
                    Go to{" "}
                    <a
                      href="https://zapier.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline inline-flex items-center gap-1"
                    >
                      Zapier.com
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    and create a new Zap
                  </li>
                  <li>Choose "Webhooks by Zapier" as the trigger</li>
                  <li>Select "Catch Hook" as the event</li>
                  <li>Copy the webhook URL Zapier provides</li>
                  <li>Paste it in the field above and save</li>
                  <li>Connect your CRM (Salesforce, HubSpot, etc.) as the action</li>
                  <li>Map the lead fields to your CRM fields</li>
                  <li>Turn on your Zap!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Available Fields */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">
              Available Fields in Webhook Payload:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-gray-600">lead_id</div>
              <div className="text-gray-600">name</div>
              <div className="text-gray-600">email</div>
              <div className="text-gray-600">phone</div>
              <div className="text-gray-600">message</div>
              <div className="text-gray-600">lead_type</div>
              <div className="text-gray-600">price_range</div>
              <div className="text-gray-600">timeline</div>
              <div className="text-gray-600">property_address</div>
              <div className="text-gray-600">preapproved</div>
              <div className="text-gray-600">referrer_url</div>
              <div className="text-gray-600">utm_source</div>
              <div className="text-gray-600">utm_medium</div>
              <div className="text-gray-600">utm_campaign</div>
              <div className="text-gray-600">device</div>
              <div className="text-gray-600">created_at</div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-purple-900">
              ⚡ Benefits of Zapier Integration:
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Automatically sync leads to 5,000+ apps</li>
              <li>• Connect to popular CRMs (Salesforce, HubSpot, Zoho)</li>
              <li>• Send leads to Google Sheets for easy tracking</li>
              <li>• Get instant Slack/Teams notifications for new leads</li>
              <li>• Create tasks in your project management tools</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
