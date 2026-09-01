import { useState } from 'react';
import { Share2, Copy, Check, Facebook, Instagram, Twitter, Linkedin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { formatPrice, parsePrice } from '@/lib/format';

/**
 * Just the fields this dialog reads.
 *
 * `price` is text in the schema, and both callers pass it through unchanged —
 * but this declared `number`, so formatPrice() received the raw string. For a
 * price the agent typed as "$450,000" that is Intl.NumberFormat.format() on a
 * non-numeric string, i.e. a share caption reading "$NaN". Everywhere else in
 * the dashboard the pair is formatPrice(parsePrice(...)); it is here now too.
 *
 * The component also carried its own `const formatPrice`, declared two lines
 * AFTER `useState(generatePostText())` called it — a temporal dead zone, so
 * opening the dialog threw "Cannot access 'formatPrice' before initialization"
 * before it could render. The shared helper from @/lib/format replaces it.
 */
export interface SharedListing {
  address: string;
  city: string;
  price: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  property_type?: string | null;
  image?: string | null;
}

interface SocialShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: SharedListing;
  agentName?: string;
}

export function SocialShareDialog({ open, onOpenChange, listing }: SocialShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate social media post text
  const generatePostText = () => {
    const parts = [];

    parts.push(`🏡 NEW LISTING ALERT! 🏡`);
    parts.push('');
    parts.push(`📍 ${listing.address}, ${listing.city}`);
    parts.push(`💰 ${formatPrice(parsePrice(listing.price))}`);

    if (listing.beds || listing.baths) {
      const details = [];
      if (listing.beds) details.push(`${listing.beds} beds`);
      if (listing.baths) details.push(`${listing.baths} baths`);
      parts.push(`🛏️ ${details.join(' | ')}`);
    }

    if (listing.sqft) {
      parts.push(`📐 ${listing.sqft.toLocaleString()} sq ft`);
    }

    parts.push('');
    parts.push(`Don't miss out on this ${listing.property_type || 'amazing property'}!`);
    parts.push('');
    parts.push('📞 Contact me for details or to schedule a showing!');
    parts.push('');
    parts.push('#RealEstate #NewListing #HomesForSale #DreamHome #Property');
    if (listing.city) {
      parts.push(`#${listing.city.replace(/\s+/g, '')}RealEstate`);
    }

    return parts.join('\n');
  };

  const [postText, setPostText] = useState(generatePostText());

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Post text copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent(postText);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(postText.substring(0, 280)); // Twitter character limit
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `New Listing: ${listing.address}`,
          text: postText,
        });
      } catch (err) {
        logger.debug('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Share2 className="h-6 w-6 text-blue-600" />
            Share Your New Listing
          </DialogTitle>
          <DialogDescription>
            Post automatically generated - customize and share on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Card */}
          {listing.image && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={listing.image} alt={listing.address} className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                NEW
              </div>
            </div>
          )}

          {/* Post Text Editor */}
          <div>
            <label className="block text-sm font-semibold mb-2">Post Caption</label>
            <Textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={12}
              className="font-sans text-sm resize-none"
              placeholder="Customize your post..."
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Add your phone number or website for easy contact
              </p>
              <span className="text-xs text-muted-foreground">{postText.length} characters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={shareToFacebook} variant="outline" className="justify-start">
                <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                Facebook
              </Button>
              <Button onClick={shareToTwitter} variant="outline" className="justify-start">
                <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                Twitter/X
              </Button>
              <Button onClick={shareToLinkedIn} variant="outline" className="justify-start">
                <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                LinkedIn
              </Button>
              <Button onClick={shareNative} variant="outline" className="justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                More...
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="secondary" className="flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text
                  </>
                )}
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Instagram Note */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Instagram className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-purple-900 mb-1">For Instagram:</p>
                <p className="text-purple-800">
                  Copy the text above and paste it when creating your Instagram post. Don't forget
                  to upload your listing photo!
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Best Practices */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-blue-900">
              📱 Social Media Best Practices
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Post during peak hours (7-9 AM or 5-7 PM)</li>
              <li>• Use high-quality photos (first photo is most important)</li>
              <li>• Include local hashtags for better reach</li>
              <li>• Respond quickly to comments and DMs</li>
              <li>• Share to Instagram Stories for 24-hour visibility</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
