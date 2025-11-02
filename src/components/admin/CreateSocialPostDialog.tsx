import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useSocialMedia } from "@/hooks/useSocialMedia";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function CreateSocialPostDialog() {
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState("property_highlight");
  const [subjectType, setSubjectType] = useState("listing_of_the_day");
  const [platformType, setPlatformType] = useState("combined");
  const [listingId, setListingId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const { generatePost, isGenerating, createPost } = useSocialMedia();

  // Fetch listings for selection
  const { data: listings } = useQuery({
    queryKey: ['listings-for-social'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, address, price, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const handleGenerate = () => {
    generatePost({
      contentType,
      subjectType,
      platformType,
      listingId: listingId || undefined,
      customPrompt: customPrompt || undefined,
    }, {
      onSuccess: (data) => {
        if (data.success) {
          setGeneratedContent(data.content);
        }
      }
    });
  };

  const handleSave = () => {
    if (!generatedContent) return;

    createPost({
      content_type: contentType,
      subject_type: subjectType,
      platform_type: platformType,
      post_content: generatedContent,
      post_title: postTitle || `${contentType} - ${new Date().toLocaleDateString()}`,
      listing_id: listingId || null,
      status: 'draft',
      ai_prompt_used: customPrompt || undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setGeneratedContent(null);
        setPostTitle("");
        setCustomPrompt("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Social Media Post</DialogTitle>
          <DialogDescription>
            Generate AI-powered social media content for your real estate business
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="property_highlight">Property Highlight</SelectItem>
                <SelectItem value="market_update">Market Update</SelectItem>
                <SelectItem value="agent_tip">Agent Tip</SelectItem>
                <SelectItem value="community_spotlight">Community Spotlight</SelectItem>
                <SelectItem value="success_story">Success Story</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Type */}
          <div className="space-y-2">
            <Label htmlFor="subject-type">Subject Type</Label>
            <Select value={subjectType} onValueChange={setSubjectType}>
              <SelectTrigger id="subject-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing_of_the_day">Listing of the Day</SelectItem>
                <SelectItem value="market_analysis">Market Analysis</SelectItem>
                <SelectItem value="buyer_seller_tip">Buyer/Seller Tip</SelectItem>
                <SelectItem value="neighborhood_feature">Neighborhood Feature</SelectItem>
                <SelectItem value="testimonial_highlight">Testimonial Highlight</SelectItem>
                <SelectItem value="special_announcement">Special Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Type */}
          <div className="space-y-2">
            <Label htmlFor="platform-type">Platform</Label>
            <Select value={platformType} onValueChange={setPlatformType}>
              <SelectTrigger id="platform-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">All Platforms</SelectItem>
                <SelectItem value="twitter_threads">Twitter/X Threads</SelectItem>
                <SelectItem value="facebook_linkedin">Facebook/LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listing Selection */}
          {contentType === 'property_highlight' && listings && listings.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="listing">Select Property (Optional)</Label>
              <Select value={listingId} onValueChange={setListingId}>
                <SelectTrigger id="listing">
                  <SelectValue placeholder="Choose a listing..." />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing: any) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.address} - {listing.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Custom Instructions (Optional)</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Add any specific instructions for the AI..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>

          {/* Generated Content Preview */}
          {generatedContent && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="post-title">Post Title</Label>
                <Input
                  id="post-title"
                  placeholder="Enter a title for this post..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Generated Content</Label>
                <div className="p-4 bg-background border rounded-lg whitespace-pre-wrap text-sm">
                  {generatedContent[platformType] || generatedContent.raw}
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                Save as Draft
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
