import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string[];
  schema?: object;
  ogType?: 'website' | 'article' | 'profile' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  twitterHandle?: string;
  noindex?: boolean;
  nofollow?: boolean;
  // AI Search Optimization props
  speakableSelectors?: string[];
  citationTitle?: string;
  citationAuthor?: string;
  citationDate?: string;
  aiSearchOptimized?: boolean;
}

/**
 * SEOHead Component - Comprehensive SEO meta tags for all pages
 *
 * Optimized for:
 * - Traditional search engines (Google, Bing)
 * - Social media (Facebook, Twitter, LinkedIn)
 * - AI-powered search (ChatGPT, Perplexity)
 *
 * @example
 * <SEOHead
 *   title="Page Title"
 *   description="Page description"
 *   ogImage="https://example.com/image.jpg"
 *   canonicalUrl="https://example.com/page"
 *   keywords={["keyword1", "keyword2"]}
 *   schema={{ "@type": "WebPage", ... }}
 * />
 */
export const SEOHead = ({
  title,
  description,
  ogImage,
  canonicalUrl,
  keywords = [],
  schema,
  ogType = 'website',
  author,
  publishedTime,
  modifiedTime,
  siteName = 'AgentBio',
  locale = 'en_US',
  twitterHandle = '@agentbio',
  noindex = false,
  nofollow = false,
  // AI Search Optimization
  speakableSelectors = [],
  citationTitle,
  citationAuthor,
  citationDate,
  aiSearchOptimized = false
}: SEOHeadProps) => {
  // Truncate title and description to optimal lengths
  const fullTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  const metaDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;

  // Default OG image if not provided
  const defaultOgImage = `${window.location.origin}/Cover.png`;
  const imageUrl = ogImage || defaultOgImage;

  // Generate robots meta tag
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  // Generate speakable schema for voice search if selectors provided
  const speakableSchema = speakableSelectors.length > 0 && canonicalUrl ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": speakableSelectors
    },
    "url": canonicalUrl
  } : null;

  // Combine schemas if multiple exist
  const combinedSchema = (() => {
    const schemas: object[] = [];
    if (schema) schemas.push(schema);
    if (speakableSchema) schemas.push(speakableSchema);

    if (schemas.length === 0) return null;
    if (schemas.length === 1) return schemas[0];

    // Use @graph for multiple schemas
    return {
      "@context": "https://schema.org",
      "@graph": schemas.map(s => {
        const { "@context": _, ...rest } = s as Record<string, unknown>;
        return rest;
      })
    };
  })();

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robotsContent} />

      {/* AI Search Optimization - Citation metadata for Perplexity, ChatGPT, Google SGE */}
      {aiSearchOptimized && (
        <>
          {/* Enable AI crawlers to index and cite this content */}
          <meta name="robots" content={`${robotsContent}, max-image-preview:large, max-snippet:-1`} />
        </>
      )}
      {citationTitle && <meta name="citation_title" content={citationTitle} />}
      {citationAuthor && <meta name="citation_author" content={citationAuthor} />}
      {citationDate && <meta name="citation_publication_date" content={citationDate} />}

      {/* Perplexity AI specific meta */}
      <meta name="perplexity-verification" content="agentbio-verified" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook / LinkedIn */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content={locale} />

      {/* Article-specific OG tags */}
      {ogType === 'article' && author && <meta property="article:author" content={author} />}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />

      {/* Performance and Core Web Vitals Optimization */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Structured Data (combines page schema with speakable if provided) */}
      {combinedSchema && (
        <script type="application/ld+json">
          {JSON.stringify(combinedSchema)}
        </script>
      )}
    </Helmet>
  );
};
