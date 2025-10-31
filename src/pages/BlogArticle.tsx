import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, ArrowLeft } from "lucide-react";
import { ArticleSEO } from "@/components/blog/ArticleSEO";
import { SimilarArticles } from "@/components/blog/SimilarArticles";
import ReactMarkdown from "react-markdown";

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment view count
  useEffect(() => {
    if (article?.id) {
      supabase
        .from("articles")
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq("id", article.id)
        .then(() => {
          console.log("View count incremented");
        });
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO */}
      <ArticleSEO
        title={article.seo_title || article.title}
        description={article.seo_description || article.excerpt || ""}
        url={`/blog/${article.slug}`}
        imageUrl={article.featured_image_url}
        publishedTime={article.published_at}
        modifiedTime={article.updated_at}
        tags={article.tags || []}
        category={article.category}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Link to="/blog">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Featured Image */}
          {article.featured_image_url && (
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="secondary">{article.category}</Badge>
            {article.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {article.title}
          </h1>

          {/* Date and Views */}
          <div className="flex items-center gap-6 text-muted-foreground mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(article.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.view_count} views</span>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                // Add internal linking for headings
                h2: ({ children, ...props }) => (
                  <h2 {...props} id={String(children).toLowerCase().replace(/\s+/g, "-")}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 {...props} id={String(children).toLowerCase().replace(/\s+/g, "-")}>
                    {children}
                  </h3>
                ),
                // Style links
                a: ({ href, children, ...props }) => {
                  const isInternal = href?.startsWith("/");
                  if (isInternal) {
                    return (
                      <Link to={href} className="text-primary hover:underline">
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Similar Articles */}
          <SimilarArticles
            currentArticleId={article.id}
            category={article.category}
            tags={article.tags || []}
          />
        </article>
      </div>
    </>
  );
}
