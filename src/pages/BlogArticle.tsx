import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye, ArrowLeft, Clock, User } from "lucide-react";
import { ArticleSEO } from "@/components/blog/ArticleSEO";
import { SimilarArticles } from "@/components/blog/SimilarArticles";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import ReactMarkdown from "react-markdown";

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();

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

  // Calculate reading time and word count
  const { wordCount, readingTime } = useMemo(() => {
    if (!article?.content) return { wordCount: 0, readingTime: "1 min read" };

    const words = article.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed

    return {
      wordCount: words,
      readingTime: `${minutes} min read`,
    };
  }, [article?.content]);

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
        wordCount={wordCount}
        readingTime={readingTime}
      />

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <PublicHeader />
        
        {/* Breadcrumb Bar */}
        <div className="bg-gray-50 border-b">
          <div className="container mx-auto px-4 py-3">
            <Link to="/blog">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>

        {/* Article Content */}
        <article
          className="container mx-auto px-4 py-12 max-w-4xl"
          itemScope
          itemType="https://schema.org/BlogPosting"
        >
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Blog", href: "/blog" },
              { label: article.title },
            ]}
          />

          {/* Featured Image */}
          {article.featured_image_url && (
            <figure className="mb-8" itemProp="image" itemScope itemType="https://schema.org/ImageObject">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
                itemProp="url"
              />
              <meta itemProp="width" content="1200" />
              <meta itemProp="height" content="630" />
            </figure>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="secondary" itemProp="articleSection">{article.category}</Badge>
            {article.tags?.map((tag) => (
              <Badge key={tag} variant="outline" itemProp="keywords">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" itemProp="headline">
            {article.title}
          </h1>

          {/* Author and Date Info - Semantic markup for AI */}
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Person">
              <User className="h-4 w-4" />
              <span itemProp="name">Real Estate Expert</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time
                dateTime={article.published_at}
                itemProp="datePublished"
              >
                {new Date(article.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readingTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.view_count} views</span>
            </div>
          </div>

          {/* Hidden metadata for search engines */}
          <meta itemProp="dateModified" content={article.updated_at} />
          <meta itemProp="wordCount" content={wordCount.toString()} />
          <meta itemProp="description" content={article.excerpt || ""} />

          <Separator className="mb-8" />

          {/* Article Content - Semantic HTML for AI search */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20"
            itemProp="articleBody"
          >
            <ReactMarkdown
              components={{
                // Add internal linking and semantic IDs for headings
                h2: ({ children, ...props }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, "-");
                  return (
                    <h2
                      {...props}
                      id={id}
                      className="text-3xl font-bold mt-12 mb-4 scroll-mt-20"
                    >
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, "-");
                  return (
                    <h3
                      {...props}
                      id={id}
                      className="text-2xl font-semibold mt-8 mb-3 scroll-mt-20"
                    >
                      {children}
                    </h3>
                  );
                },
                // Enhanced paragraph styling
                p: ({ children, ...props }) => (
                  <p {...props} className="mb-6 leading-relaxed text-lg">
                    {children}
                  </p>
                ),
                // Enhanced list styling
                ul: ({ children, ...props }) => (
                  <ul {...props} className="space-y-2 my-6">
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol {...props} className="space-y-2 my-6">
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li {...props} className="leading-relaxed">
                    {children}
                  </li>
                ),
                // Enhanced blockquote
                blockquote: ({ children, ...props }) => (
                  <blockquote
                    {...props}
                    className="border-l-4 border-primary pl-6 py-2 my-6 italic bg-muted/50 rounded-r"
                  >
                    {children}
                  </blockquote>
                ),
                // Style links with proper attributes
                a: ({ href, children, ...props }) => {
                  const isInternal = href?.startsWith("/");
                  if (isInternal) {
                    return (
                      <Link
                        to={href}
                        className="text-primary hover:underline font-medium"
                      >
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                // Enhanced code blocks
                code: ({ children, ...props }) => (
                  <code
                    {...props}
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                  >
                    {children}
                  </code>
                ),
                pre: ({ children, ...props }) => (
                  <pre
                    {...props}
                    className="bg-muted p-4 rounded-lg overflow-x-auto my-6"
                  >
                    {children}
                  </pre>
                ),
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
        
        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
}
