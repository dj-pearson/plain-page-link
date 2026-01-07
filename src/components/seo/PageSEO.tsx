import { Helmet } from "react-helmet-async";

interface FAQItem {
  question: string;
  answer: string;
}

interface PageSEOProps {
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  type?: "website" | "article" | "product";
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
  type = "website",
  keywords = [],
  author,
  faqs,
  noIndex = false,
  structuredData,
}: PageSEOProps) {
  const siteName = "AgentBio";
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://agentbio.net';
  const fullUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : (typeof window !== 'undefined' ? window.location.href : siteUrl);
  const socialImage = imageUrl || `${siteUrl}/Cover.png`;

  // Organization Schema with Social Signals
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    "name": "AgentBio",
    "legalName": "AgentBio Intelligence",
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${siteUrl}/logo.png`,
      "width": "512",
      "height": "512"
    },
    "image": `${siteUrl}/Cover.png`,
    "description": "AI-powered real estate agent bio page builder. Purpose-built platform for real estate professionals to showcase properties, capture leads, and convert Instagram followers into clients.",
    "foundingDate": "2024",
    "slogan": "Transform Instagram followers into qualified leads",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@agentbio.net",
      "url": `${siteUrl}/contact`,
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://twitter.com/agentbio",
      "https://www.facebook.com/agentbio",
      "https://www.linkedin.com/company/agentbio",
      "https://www.instagram.com/agentbio",
      "https://www.youtube.com/@agentbio"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "523",
      "bestRating": "5",
      "worstRating": "1"
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    }
  };

  // WebPage Schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": fullUrl,
    "url": fullUrl,
    "name": title,
    "description": description,
    "publisher": {
      "@id": `${siteUrl}#organization`
    },
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      "name": siteName,
      "url": siteUrl
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": socialImage,
      "width": 1200,
      "height": 630
    },
    "inLanguage": "en-US",
    "potentialAction": {
      "@type": "ReadAction",
      "target": [fullUrl]
    }
  };

  // WebSite Schema with SearchAction
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    "url": siteUrl,
    "name": siteName,
    "description": "Link-in-bio platform for real estate agents",
    "publisher": {
      "@id": `${siteUrl}#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // FAQ Schema (if FAQs provided)
  const faqSchema = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  // Combined Schema using @graph
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      webSiteSchema,
      webPageSchema,
      ...(faqSchema ? [faqSchema] : []),
      ...(structuredData ? [structuredData] : [])
    ]
  };

  const robotsContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
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
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
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
