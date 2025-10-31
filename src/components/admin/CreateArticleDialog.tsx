import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CreateArticleDialog() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Real Estate Tips");
  const [keywords, setKeywords] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);

  const { generateArticle, isGenerating, createArticle } = useArticles();

  const handleGenerate = () => {
    if (!topic) return;

    generateArticle({
      topic,
      category,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
      customInstructions: customInstructions || undefined,
    }, {
      onSuccess: (data) => {
        if (data.success) {
          setGeneratedArticle(data.article);
        }
      }
    });
  };

  const handleSave = () => {
    if (!generatedArticle) return;

    createArticle({
      title: generatedArticle.title,
      slug: generatedArticle.slug,
      content: generatedArticle.content,
      excerpt: generatedArticle.excerpt,
      category: generatedArticle.category,
      tags: generatedArticle.tags,
      seo_title: generatedArticle.seoTitle,
      seo_description: generatedArticle.seoDescription,
      seo_keywords: generatedArticle.tags,
      status: 'draft',
    }, {
      onSuccess: () => {
        setOpen(false);
        setGeneratedArticle(null);
        setTopic("");
        setKeywords("");
        setCustomInstructions("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Blog Article</DialogTitle>
          <DialogDescription>
            Create SEO-optimized real estate articles with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Article Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., First-Time Homebuyer Tips for 2025"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Real Estate Tips">Real Estate Tips</SelectItem>
                <SelectItem value="Market Insights">Market Insights</SelectItem>
                <SelectItem value="Buying Guide">Buying Guide</SelectItem>
                <SelectItem value="Selling Guide">Selling Guide</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
                <SelectItem value="Neighborhood Guides">Neighborhood Guides</SelectItem>
                <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              placeholder="e.g., real estate, home buying, mortgage tips"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Add specific requirements, tone, or focus areas..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Article...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Article with AI
              </>
            )}
          </Button>

          {/* Generated Article Preview */}
          {generatedArticle && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <h3 className="font-bold text-lg mb-2">{generatedArticle.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Slug: {generatedArticle.slug}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {generatedArticle.excerpt}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Article Content (Markdown)</Label>
                <div className="p-4 bg-background border rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedArticle.content}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">SEO Title:</p>
                  <p className="text-muted-foreground">{generatedArticle.seoTitle}</p>
                </div>
                <div>
                  <p className="font-semibold">SEO Description:</p>
                  <p className="text-muted-foreground">{generatedArticle.seoDescription}</p>
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
