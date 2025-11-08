import { useState } from "react";
import { Copy, Check, Mail, MessageSquare, Share2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface RequestTestimonialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  agentName: string;
}

export function RequestTestimonialModal({
  open,
  onOpenChange,
  username,
  agentName,
}: RequestTestimonialModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const { toast } = useToast();

  const reviewURL = `${window.location.origin}/${username}/review`;
  const emailTemplate = `Hi there!

I hope you've been enjoying your new home! I wanted to reach out and ask if you'd be willing to share a brief review of your experience working with me.

Your feedback helps me improve my services and helps other clients find the right agent for their needs.

You can leave a review here:
${reviewURL}

It only takes a couple of minutes, and I really appreciate your time!

Best regards,
${agentName}`;

  const smsTemplate = `Hi! Would you mind leaving a quick review of your experience? It helps me serve clients better: ${reviewURL} Thanks! - ${agentName}`;

  const copyToClipboard = async (text: string, type: 'url' | 'email' = 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'url' ? 'Review link' : 'Email template'} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Request for Testimonial - ${agentName}`);
    const body = encodeURIComponent(emailTemplate);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const sms = encodeURIComponent(smsTemplate);
    window.open(`sms:?&body=${sms}`);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Leave a Review",
          text: `I'd appreciate if you could leave a review of your experience!`,
          url: reviewURL,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy
      copyToClipboard(reviewURL);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Client Testimonial</DialogTitle>
          <DialogDescription>
            Share this link with clients to collect reviews and testimonials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Review Link */}
          <div>
            <Label className="text-base font-semibold">Your Review Link</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Send this link to clients so they can leave a review
            </p>
            <div className="flex gap-2">
              <Input
                value={reviewURL}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(reviewURL)}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={shareNative}
                variant="outline"
                size="icon"
                title="Share via..."
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                title="Preview review page"
              >
                <a
                  href={reviewURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Quick Send Options</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>
              <Button
                onClick={shareViaSMS}
                variant="outline"
                className="justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send via SMS
              </Button>
            </div>
          </div>

          {/* Email Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Email Template</Label>
              <Button
                onClick={() => copyToClipboard(emailTemplate, 'email')}
                variant="ghost"
                size="sm"
              >
                {emailCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={emailTemplate}
              readOnly
              rows={12}
              className="font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Customize this template to match your personal style
            </p>
          </div>

          {/* SMS Template */}
          <div>
            <Label className="text-base font-semibold mb-2 block">SMS Template</Label>
            <Textarea
              value={smsTemplate}
              readOnly
              rows={3}
              className="font-mono text-sm resize-none"
            />
          </div>

          {/* Best Practices */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-blue-900">
              📋 Best Practices for Requesting Reviews
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Wait 1-2 weeks after closing for best results</li>
              <li>• Send a personalized message, not just the link</li>
              <li>• Follow up once if no response after 1 week</li>
              <li>• Thank clients regardless of whether they leave a review</li>
              <li>• Make it easy - include the direct link</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
