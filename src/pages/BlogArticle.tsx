import { useEffect, useMemo } from 'react';
import { SEO_CONFIG, getBaseUrl } from '@/config/seo.config';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Eye, ArrowLeft, Clock, User } from 'lucide-react';
import { ArticleSEO } from '@/components/blog/ArticleSEO';
import { SimilarArticles } from '@/components/blog/SimilarArticles';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { categoryByName } from '@/config/blog-categories';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import ReactMarkdown from 'react-markdown';
import { logger } from '@/lib/logger';
import { getVisitorId } from '@/lib/analyticsEvents';
import { rehypeArticleHeadings, stripLeadingTitle } from '@/lib/articleMarkdown';
import {
  ARTICLE_AUTHOR_COLUMNS,
  resolveArticleAuthor,
  type ArticleAuthorRow,
} from '@/lib/articleAuthor';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Who wrote it (US-181). A separate lookup rather than an embed — see
  // src/lib/articleAuthor.ts for why — and never fatal: an unresolved author
  // is credited to the organisation, which is what US-180 settled on.
  const authorId = article?.author_id ?? null;
  const { data: authorRow, isLoading: authorLoading } = useQuery({
    queryKey: ['article-author', authorId],
    queryFn: async (): Promise<ArticleAuthorRow | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(ARTICLE_AUTHOR_COLUMNS)
        .eq('id', authorId as string)
        .eq('is_published', true)
        .maybeSingle();
      if (error) {
        logger.debug('Article author not resolved', { articleId: article?.id });
        return null;
      }
      return (data as ArticleAuthorRow | null) ?? null;
    },
    enabled: !!authorId,
    staleTime: 10 * 60 * 1000,
  });
  const author = useMemo(() => resolveArticleAuthor(authorRow, getBaseUrl()), [authorRow]);

  // Calculate reading time and word count
  const { wordCount, readingTime } = useMemo(() => {
    if (!article?.content) return { wordCount: 0, readingTime: '1 min read' };

    const words = article.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed

    return {
      wordCount: words,
      readingTime: `${minutes} min read`,
    };
  }, [article?.content]);

  // The model's `# Title` line duplicates the h1 this page renders (US-262).
  const body = useMemo(() => stripLeadingTitle(article?.content ?? ''), [article?.content]);

  // Count the view. This was `.update({ view_count: n + 1 })`, which no policy
  // lets a visitor make, so it counted nothing — and for an admin it bumped
  // updated_at, the date the sitemap and dateModified report. The RPC is
  // published-only, throttled per visitor, and leaves updated_at alone.
  useEffect(() => {
    if (!article?.id) return;
    supabase
      .rpc('increment_article_view', {
        p_article_id: article.id,
        p_visitor_id: getVisitorId() ?? undefined,
      })
      .then(({ error }) => {
        if (error) logger.debug('Article view not counted', { articleId: article.id });
      });
  }, [article?.id]);

  // Wait for the author too, so the byline and the JSON-LD never flash from
  // the organisation to a person — and so the prerender snapshot carries the
  // resolved author rather than the fallback.
  if (isLoading || (!!authorId && authorLoading)) {
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
        description={article.seo_description || article.excerpt || ''}
        url={`/blog/${article.slug}`}
        imageUrl={article.featured_image_url ?? undefined}
        publishedTime={article.published_at ?? undefined}
        modifiedTime={article.updated_at ?? undefined}
        author={author}
        tags={article.tags || []}
        category={article.category ?? undefined}
        wordCount={wordCount}
        readingTime={readingTime}
      />

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <PublicHeader />

        <main id="main-content" tabIndex={-1}>
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
            <Breadcrumbs items={[{ label: 'Blog', href: '/blog' }, { label: article.title }]} />

            {/* Featured Image */}
            {article.featured_image_url && (
              <figure
                className="mb-8"
                itemProp="image"
                itemScope
                itemType="https://schema.org/ImageObject"
              >
                <img
                  src={article.featured_image_url}
                  alt={article.title}
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                  itemProp="url"
                />
                {/* itemProp width/height stood here claiming 1200x630 for
                    whatever featured_image_url the article carries. Nothing had
                    measured it (US-174). */}
              </figure>
            )}

            {/* Meta Info.
                The category was a bare badge, so an article was a dead end
                towards its own topic — nothing led from a post to the other
                posts about the same thing (US-165's problem, one level down).
                It links only when the category actually has a page: the
                registry answers that, which is the whole reason it exists
                (US-166). An unlisted category still shows, unlinked. */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {(() => {
                const category = categoryByName(article.category);
                if (!category) {
                  return article.category ? (
                    <Badge variant="secondary" itemProp="articleSection">
                      {article.category}
                    </Badge>
                  ) : null;
                }
                return (
                  <Link
                    to={`/blog/category/${category.slug}`}
                    aria-label={`More articles in ${category.label}`}
                  >
                    <Badge
                      variant="secondary"
                      itemProp="articleSection"
                      className="hover:bg-secondary/80 transition-colors"
                    >
                      {category.label}
                    </Badge>
                  </Link>
                );
              })()}
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
              {/* The byline said "Real Estate Expert", marked up as a
                  schema.org/Person — a job description presented as a named
                  author, on every article (US-180). It is now the author's
                  name from their published profile, linking to their page
                  (US-181), and the organisation when there is no such
                  profile — matching ArticleSEO's JSON-LD either way. */}
              {author ? (
                <div
                  className="flex items-center gap-2"
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Person"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {author.url ? (
                    <a
                      href={author.url}
                      itemProp="url"
                      rel="author"
                      className="underline-offset-4 hover:underline"
                    >
                      <span itemProp="name">{author.name}</span>
                    </a>
                  ) : (
                    <span itemProp="name">{author.name}</span>
                  )}
                </div>
              ) : (
                <div
                  className="flex items-center gap-2"
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Organization"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span itemProp="name">{SEO_CONFIG.siteName}</span>
                </div>
              )}
              {article.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={article.published_at} itemProp="datePublished">
                    {new Date(article.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              )}
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
            <meta itemProp="dateModified" content={article.updated_at ?? ''} />
            <meta itemProp="wordCount" content={wordCount.toString()} />
            <meta itemProp="description" content={article.excerpt || ''} />

            <Separator className="mb-8" />

            {/* Article Content - Semantic HTML for AI search */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20"
              itemProp="articleBody"
            >
              <ReactMarkdown
                // Demotes body h1s to h2 and gives every heading a unique id
                // from its text (US-262). Done on the tree, not here: ids
                // allocated in a render component would change on re-render.
                rehypePlugins={[rehypeArticleHeadings]}
                components={{
                  h2: ({ node: _node, children, ...props }) => (
                    <h2 {...props} className="text-3xl font-bold mt-12 mb-4 scroll-mt-20">
                      {children}
                    </h2>
                  ),
                  h3: ({ node: _node, children, ...props }) => (
                    <h3 {...props} className="text-2xl font-semibold mt-8 mb-3 scroll-mt-20">
                      {children}
                    </h3>
                  ),
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
                    if (href && href.startsWith('/')) {
                      return (
                        <Link
                          to={href}
                          className="text-primary underline hover:no-underline font-medium"
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
                        className="text-primary underline hover:no-underline font-medium"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  // Enhanced code blocks
                  code: ({ children, ...props }) => (
                    <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children, ...props }) => (
                    <pre {...props} className="bg-muted p-4 rounded-lg overflow-x-auto my-6">
                      {children}
                    </pre>
                  ),
                }}
              >
                {body}
              </ReactMarkdown>
            </div>

            {/* Similar Articles */}
            <SimilarArticles
              currentArticleId={article.id}
              category={article.category}
              tags={article.tags || []}
            />
          </article>
        </main>

        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
}
