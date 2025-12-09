import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Loader2,
  Search,
} from "lucide-react";
import type { Article } from "@/hooks/useArticles";

interface SEOValidationResult {
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  passed: string[];
}

interface SEOValidationDialogProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

/**
 * Validates article SEO fields and returns a comprehensive report
 */
function validateArticleSEO(article: Article): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const passed: string[] = [];

  // Title validation
  const seoTitle = article.seo_title || article.title;
  if (!seoTitle || seoTitle.length === 0) {
    errors.push("SEO title is missing");
  } else if (seoTitle.length < 30) {
    warnings.push(`SEO title is too short (${seoTitle.length}/30 minimum characters)`);
  } else if (seoTitle.length > 60) {
    warnings.push(`SEO title is too long (${seoTitle.length}/60 maximum characters)`);
  } else {
    passed.push(`SEO title length is optimal (${seoTitle.length} characters)`);
  }

  // Meta description validation
  const seoDescription = article.seo_description || article.excerpt;
  if (!seoDescription || seoDescription.length === 0) {
    errors.push("Meta description is missing");
  } else if (seoDescription.length < 120) {
    warnings.push(`Meta description is too short (${seoDescription.length}/120 minimum characters)`);
  } else if (seoDescription.length > 160) {
    warnings.push(`Meta description is too long (${seoDescription.length}/160 maximum characters)`);
  } else {
    passed.push(`Meta description length is optimal (${seoDescription.length} characters)`);
  }

  // SEO keywords validation
  const keywords = article.seo_keywords || [];
  if (!keywords || keywords.length === 0) {
    warnings.push("No SEO keywords defined");
  } else if (keywords.length < 3) {
    suggestions.push(`Consider adding more keywords (${keywords.length}/3+ recommended)`);
  } else {
    passed.push(`Keywords defined (${keywords.length} keywords)`);
  }

  // Slug validation
  if (!article.slug || article.slug.length === 0) {
    errors.push("Article slug is missing");
  } else if (article.slug.includes(" ")) {
    errors.push("Slug contains spaces - should use hyphens");
  } else if (!/^[a-z0-9-]+$/.test(article.slug)) {
    warnings.push("Slug contains special characters - consider using only lowercase letters, numbers, and hyphens");
  } else {
    passed.push("Slug is properly formatted");
  }

  // Content validation
  if (!article.content || article.content.length === 0) {
    errors.push("Article content is empty");
  } else {
    const wordCount = article.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 300) {
      warnings.push(`Content is thin (${wordCount} words) - aim for 300+ words for better SEO`);
    } else if (wordCount < 800) {
      suggestions.push(`Content has ${wordCount} words - consider expanding to 800+ for comprehensive coverage`);
    } else {
      passed.push(`Content length is good (${wordCount} words)`);
    }

    // Check for headings
    const hasH2 = article.content.includes("## ");
    const hasH3 = article.content.includes("### ");
    if (!hasH2 && !hasH3) {
      suggestions.push("Consider adding subheadings (## or ###) for better content structure");
    } else {
      passed.push("Content has proper heading structure");
    }

    // Check for internal/external links
    const hasLinks = article.content.includes("](");
    if (!hasLinks) {
      suggestions.push("Consider adding internal or external links for better SEO");
    }
  }

  // Excerpt validation
  if (!article.excerpt || article.excerpt.length === 0) {
    warnings.push("Article excerpt is missing - used for previews and social sharing");
  } else if (article.excerpt.length > 200) {
    suggestions.push("Excerpt is long - consider shortening to under 200 characters");
  } else {
    passed.push("Excerpt is defined");
  }

  // Featured image validation
  if (!article.featured_image_url) {
    suggestions.push("Consider adding a featured image for social sharing and visual appeal");
  } else {
    passed.push("Featured image is set");
  }

  // Category validation
  if (!article.category) {
    warnings.push("Article category is not set");
  } else {
    passed.push("Category is defined");
  }

  // Tags validation
  if (!article.tags || article.tags.length === 0) {
    suggestions.push("Consider adding tags for better content organization");
  } else {
    passed.push(`Tags defined (${article.tags.length} tags)`);
  }

  // Calculate score (0-100)
  const totalChecks = errors.length + warnings.length + suggestions.length + passed.length;
  const passedWeight = passed.length * 10;
  const suggestionPenalty = suggestions.length * 2;
  const warningPenalty = warnings.length * 5;
  const errorPenalty = errors.length * 15;

  let score = Math.max(
    0,
    Math.min(100, 100 - errorPenalty - warningPenalty - suggestionPenalty + Math.floor(passedWeight / totalChecks * 10))
  );

  // Ensure minimum score if no errors
  if (errors.length === 0 && score < 50) {
    score = 50;
  }

  return { score, errors, warnings, suggestions, passed };
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function SEOValidationDialog({
  article,
  open,
  onOpenChange,
  onPublish,
  isPublishing = false,
}: SEOValidationDialogProps) {
  const validation = useMemo(() => {
    if (!article) return null;
    return validateArticleSEO(article);
  }, [article]);

  if (!article || !validation) return null;

  const canPublish = validation.errors.length === 0;
  const hasIssues = validation.warnings.length > 0 || validation.suggestions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pre-Publish SEO Validation
          </DialogTitle>
          <DialogDescription>
            Review SEO requirements before publishing "{article.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SEO Score */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex-shrink-0">
              <div className={`text-4xl font-bold ${getScoreColor(validation.score)}`}>
                {validation.score}
              </div>
              <div className={`text-sm font-medium ${getScoreColor(validation.score)}`}>
                {getScoreLabel(validation.score)}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-2">SEO Score</div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(validation.score)} transition-all duration-500`}
                  style={{ width: `${validation.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <AlertCircle className="h-4 w-4" />
                Critical Issues ({validation.errors.length})
              </div>
              <div className="space-y-2">
                {validation.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-600 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Warnings ({validation.warnings.length})
              </div>
              <div className="space-y-2">
                {validation.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <Lightbulb className="h-4 w-4" />
                Suggestions ({validation.suggestions.length})
              </div>
              <div className="space-y-2">
                {validation.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                  >
                    <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-800">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passed Checks */}
          {validation.passed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Passed ({validation.passed.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {validation.passed.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!canPublish ? (
            <Button disabled variant="destructive">
              Fix Critical Issues First
            </Button>
          ) : hasIssues ? (
            <Button
              onClick={onPublish}
              disabled={isPublishing}
              variant="default"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Anyway"
              )}
            </Button>
          ) : (
            <Button onClick={onPublish} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Article
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export validation function for use in other components
export { validateArticleSEO };
export type { SEOValidationResult };
