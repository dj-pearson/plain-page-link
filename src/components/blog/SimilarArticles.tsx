import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface SimilarArticlesProps {
  currentArticleId: string;
  category: string;
  tags: string[];
  limit?: number;
}

export function SimilarArticles({
  currentArticleId,
  category,
  tags = [],
  limit = 3,
}: SimilarArticlesProps) {
  const { data: similarArticles = [] } = useQuery({
    queryKey: ["similar-articles", currentArticleId, category],
    queryFn: async () => {
      // First, try to find articles with matching tags
      let query = supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .neq("id", currentArticleId);

      // If tags exist, prioritize articles with overlapping tags
      if (tags.length > 0) {
        query = query.overlaps("tags", tags);
      } else {
        // Otherwise, just match by category
        query = query.eq("category", category);
      }

      const { data: tagMatches, error: tagError } = await query
        .limit(limit)
        .order("published_at", { ascending: false });

      if (tagError) throw tagError;

      // If we don't have enough articles, fill with same category
      if (!tagMatches || tagMatches.length < limit) {
        const { data: categoryMatches, error: catError } = await supabase
          .from("articles")
          .select("*")
          .eq("status", "published")
          .eq("category", category)
          .neq("id", currentArticleId)
          .limit(limit - (tagMatches?.length || 0))
          .order("published_at", { ascending: false });

        if (catError) throw catError;

        // Combine and deduplicate
        const combined = [...(tagMatches || []), ...(categoryMatches || [])];
        const unique = Array.from(
          new Map(combined.map((item) => [item.id, item])).values()
        );
        return unique.slice(0, limit);
      }

      return tagMatches;
    },
  });

  if (similarArticles.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Similar Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {similarArticles.map((article) => (
          <Link key={article.id} to={`/blog/${article.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              {article.featured_image_url && (
                <img
                  src={article.featured_image_url}
                  alt={article.title}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">
                  {article.category}
                </Badge>
                <CardTitle className="text-lg line-clamp-2">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {article.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(article.published_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
