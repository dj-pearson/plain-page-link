import { Helmet } from 'react-helmet-async';
import { SAME_AS } from '@/config/social-profiles';
import { DEFAULT_SOCIAL_IMAGE, ORGANIZATION_LOGO, isDefaultSocialImage } from '@/config/og-image';
import { getBaseUrl } from '@/config/seo.config';

interface FAQItem {
  question: string;
  answer: string;
}

interface PageSEOProps {
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  author?: string;
  faqs?: FAQItem[];
  noIndex?: boolean;
  structuredData?: Record<string, any>;
}

export function PageSEO({
  title,
  description,
  url,
  imageUrl,
  type = 'website',
  keywords = [],
  author,
  faqs,
  noIndex = false,
  structuredData,
}: PageSEOProps) {
  const siteName = 'AgentBio';
  // getBaseUrl(), not getSafeOrigin(): a canonical is a claim about identity,
  // so it must not read the host the visitor happens to be on. A *.pages.dev
  // preview would otherwise self-canonicalise once the bundle hydrates
  // (US-172).
  const siteUrl = getBaseUrl();
  const fullUrl = url
    ? url.startsWith('http')
      ? url
      : `${siteUrl}${url}`
    : typeof window !== 'undefined'
      ? window.location.href
      : siteUrl;
  const socialImage = imageUrl || `${siteUrl}/Cover.png`;

  // Organization Schema with Social Signals
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}#organization`,
    name: 'AgentBio',
    legalName: 'AgentBio Intelligence',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}${ORGANIZATION_LOGO.path}`,
      // Was width '512', height '512' for a 946x436 file (US-178).
      width: String(ORGANIZATION_LOGO.width),
      height: String(ORGANIZATION_LOGO.height),
    },
    image: `${siteUrl}/Cover.png`,
    description:
      'AI-powered real estate agent bio page builder. Purpose-built platform for real estate professionals to showcase properties, capture leads, and convert Instagram followers into clients.',
    foundingDate: '2024',
    slogan: 'Transform Instagram followers into qualified leads',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@agentbio.net',
      // No `url`. It pointed at /contact, which has never been a route here —
      // seven pages named it, and since US-176 it does not even answer 200.
      // The email is the contact method; a ContactPoint does not need a page
      // to be valid, and one naming a URL that 404s is worse than one that
      // does not (US-179).
      availableLanguage: ['English'],
    },
    // See @/config/social-profiles: these were four accounts this company does
    // not have, and one it does (US-178).
    sameAs: [...SAME_AS],
    // aggregateRating removed (US-157). It claimed ratingValue 4.8 over 523
    // reviews, the same invented pair US-111 took off the landing page and
    // missed here — it was still reaching 31 built pages. Google renders stars
    // in search results from this field, so a fabricated value is a false
    // claim published to everyone who searches, and a structured-data policy
    // violation. Reinstate only from real review data, the way
    // FullProfilePage and ReviewSchema do.
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
  };

  // WebPage Schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': fullUrl,
    url: fullUrl,
    name: title,
    description: description,
    publisher: {
      '@id': `${siteUrl}#organization`,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      name: siteName,
      url: siteUrl,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: socialImage,
      // Dimensions only when they are known; see @/config/og-image (US-174).
      ...(isDefaultSocialImage(socialImage)
        ? { width: DEFAULT_SOCIAL_IMAGE.width, height: DEFAULT_SOCIAL_IMAGE.height }
        : {}),
    },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'ReadAction',
      target: [fullUrl],
    },
  };

  // WebSite Schema with SearchAction
  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: siteName,
    description: 'Link-in-bio platform for real estate agents',
    publisher: {
      '@id': `${siteUrl}#organization`,
    },
    // No potentialAction. A SearchAction is what Google reads to offer a
    // sitelinks searchbox, and this one pointed at /search?q=, a route that has
    // never existed in App.tsx. Since US-176 it returns a real 404, so the
    // searchbox would have sent people nowhere. There is no site-wide search to
    // point it at; the blog has its own, and BlogListSEO declares that one
    // against /blog?search=, which Blog.tsx now actually reads (US-179).
  };

  // FAQ Schema (if FAQs provided)
  const faqSchema =
    faqs && faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  // Combined Schema using @graph
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema,
      webSiteSchema,
      webPageSchema,
      ...(faqSchema ? [faqSchema] : []),
      ...(structuredData ? [structuredData] : []),
    ],
  };

  const robotsContent = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <link rel="canonical" href={fullUrl} />

      {/* Robots Meta Tags */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={socialImage} />
      {/* Width and height only for the image whose size is known. A caller's
          own image is one this code has never seen, and a wrong number breaks
          the card the tag exists to build (US-174). */}
      {isDefaultSocialImage(socialImage) && (
        <meta property="og:image:width" content={String(DEFAULT_SOCIAL_IMAGE.width)} />
      )}
      {isDefaultSocialImage(socialImage) && (
        <meta property="og:image:height" content={String(DEFAULT_SOCIAL_IMAGE.height)} />
      )}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:site" content="@agentbio" />
      {author && <meta name="twitter:creator" content={author} />}

      {/* Additional SEO Meta Tags */}
      <meta name="language" content="English" />
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="revisit-after" content="7 days" />

      {/* AI Search Engine Optimization */}
      <meta name="citation_title" content={title} />
      <meta name="citation_language" content="en" />

      {/* Mobile Meta Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">{JSON.stringify(combinedSchema)}</script>
    </Helmet>
  );
}
