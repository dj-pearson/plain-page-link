import { Helmet } from 'react-helmet-async';
import { DEFAULT_SOCIAL_IMAGE, isDefaultSocialImage } from '@/config/og-image';
import { getBaseUrl } from '@/config/seo.config';

interface ArticleSEOProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  category?: string;
  wordCount?: number;
  readingTime?: string;
}

export function ArticleSEO({
  title,
  description,
  url,
  imageUrl,
  publishedTime,
  modifiedTime,
  author = 'Real Estate Expert',
  tags = [],
  category = 'Real Estate',
  wordCount,
  readingTime,
}: ArticleSEOProps) {
  const siteName = 'AgentBio';
  // getBaseUrl(), not getSafeOrigin(): a canonical is a claim about identity,
  // so it must not read the host the visitor happens to be on. A *.pages.dev
  // preview would otherwise self-canonicalise once the bundle hydrates
  // (US-172).
  const siteUrl = getBaseUrl();
  const fullUrl = `${siteUrl}${url}`;

  // Use Cover.png as fallback if no featured image
  const socialImage = imageUrl || `${siteUrl}${DEFAULT_SOCIAL_IMAGE.path}`;

  // Build structured data for Article with enhanced properties for AI search
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: {
      '@type': 'ImageObject',
      url: socialImage,
      // Google reads ImageObject width/height to decide large-image rich-result
      // eligibility, which wants 1200px or more. This claimed 1200x630 for
      // whatever featured_image_url an article carried — a file this code has
      // never opened. Stated only when known (US-174).
      ...(isDefaultSocialImage(socialImage)
        ? { width: DEFAULT_SOCIAL_IMAGE.width, height: DEFAULT_SOCIAL_IMAGE.height }
        : {}),
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/Cover.png`,
      },
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    articleSection: category,
    keywords: tags.join(', '),
    ...(wordCount && { wordCount }),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    backstory: description,
  };

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: fullUrl,
      },
    ],
  };

  // WebPage structured data for better AI understanding
  const webPageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': fullUrl,
    url: fullUrl,
    name: title,
    description: description,
    isPartOf: {
      '@type': 'WebSite',
      '@id': siteUrl,
      name: siteName,
      url: siteUrl,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: socialImage,
    },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'ReadAction',
      target: [fullUrl],
    },
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>
        {title} | {siteName}
      </title>
      <meta name="description" content={description} />
      <meta name="keywords" content={tags.join(', ')} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={socialImage} />
      {/* Width and height only for the image whose size is known. An article's
          featured_image_url is an arbitrary upload this code has never seen
          (US-174). */}
      {isDefaultSocialImage(socialImage) && (
        <meta property="og:image:width" content={String(DEFAULT_SOCIAL_IMAGE.width)} />
      )}
      {isDefaultSocialImage(socialImage) && (
        <meta property="og:image:height" content={String(DEFAULT_SOCIAL_IMAGE.height)} />
      )}
      <meta
        property="og:image:alt"
        content={isDefaultSocialImage(socialImage) ? DEFAULT_SOCIAL_IMAGE.alt : title}
      />
      <meta property="og:site_name" content={siteName} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {category && <meta property="article:section" content={category} />}
      {tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:creator" content={author} />
      <meta name="twitter:label1" content="Reading time" />
      {readingTime && <meta name="twitter:data1" content={readingTime} />}

      {/* AI Search Engine Optimization */}
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta
        name="googlebot"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <meta name="bingbot" content="index, follow" />
      <meta name="googlebot-news" content="snippet" />

      {/* Additional metadata for AI comprehension */}
      <meta property="article:author" content={author} />
      <meta name="author" content={author} />
      <meta name="article:content_tier" content="free" />
      <meta name="language" content="English" />
      <meta httpEquiv="content-language" content="en-US" />

      {/* Perplexity and AI search hints */}
      <meta name="citation_title" content={title} />
      <meta name="citation_author" content={author} />
      {publishedTime && <meta name="citation_publication_date" content={publishedTime} />}
      <meta name="citation_language" content="en" />

      {/* Additional Open Graph for better social sharing */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content={siteName} />

      {/* Structured Data (JSON-LD) - Multiple schemas for rich AI results */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbStructuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(webPageStructuredData)}</script>
    </Helmet>
  );
}
