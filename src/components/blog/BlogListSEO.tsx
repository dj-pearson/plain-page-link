import { Helmet } from "react-helmet-async";
import { getSafeOrigin } from "@/lib/utils";

interface BlogListSEOProps {
  totalArticles: number;
  latestArticleDate?: string;
}

export function BlogListSEO({ totalArticles, latestArticleDate }: BlogListSEOProps) {
  const siteName = "AgentBio";
  const siteUrl = getSafeOrigin();
  const blogUrl = `${siteUrl}/blog`;
  const title = "Real Estate Blog - Tips, Guides & Market Insights";
  const description =
    "Discover expert real estate advice, market insights, buying and selling guides, investment tips, and neighborhood information. Stay informed with our comprehensive blog for agents, buyers, and sellers.";

  // Structured data for Blog
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": blogUrl,
    name: title,
    description: description,
    url: blogUrl,
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/Cover.png`,
      },
    },
    inLanguage: "en-US",
    ...(latestArticleDate && { dateModified: latestArticleDate }),
  };

  // Structured data for Organization
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/Cover.png`,
    },
    sameAs: [
      // Add your social media URLs here
    ],
  };

  // Structured data for WebSite with SearchAction
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteUrl,
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${blogUrl}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Breadcrumb list for blog homepage
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blogUrl,
      },
    ],
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="real estate blog, real estate tips, home buying guide, selling guide, market insights, investment tips, neighborhood guides, real estate agents, property advice"
      />
      <link rel="canonical" href={blogUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={blogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}/Cover.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={blogUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}/Cover.png`} />

      {/* AI Search Engine Optimization */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />

      {/* Article-specific for AI understanding */}
      <meta property="article:publisher" content={siteName} />
      <meta property="article:section" content="Real Estate" />

      {/* Additional SEO */}
      <meta name="author" content={siteName} />
      <meta name="language" content="English" />
      <meta httpEquiv="content-language" content="en-US" />

      {/* Structured Data (JSON-LD) - Multiple schemas for rich results */}
      <script type="application/ld+json">{JSON.stringify(blogStructuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationStructuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteStructuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbStructuredData)}</script>
    </Helmet>
  );
}
