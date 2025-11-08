import { useState } from "react";
import { ExternalLink, Copy, Check, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProfileURLCardProps {
  username: string;
}

export function ProfileURLCard({ username }: ProfileURLCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const profileURL = `${window.location.origin}/${username}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileURL);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Profile URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Real Estate Profile",
          text: "Check out my professional real estate profile",
          url: profileURL,
        });
      } catch (err) {
        // User cancelled share or error occurred
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          Your Public Profile
        </CardTitle>
        <CardDescription>
          Share this link to showcase your properties and capture leads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
          <code className="flex-1 text-sm text-blue-600 font-mono truncate">
            {profileURL}
          </code>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          <Button
            onClick={shareProfile}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button
            asChild
            variant="default"
          >
            <a
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </a>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="mb-2">💡 <strong>Pro tip:</strong> Share this link on:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Your email signature</li>
            <li>Business cards and flyers</li>
            <li>Social media profiles</li>
            <li>MLS listings and property descriptions</li>
            <li>Text messages to potential clients</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
