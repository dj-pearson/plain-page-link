import { Helmet } from "react-helmet-async";
import { getSafeOrigin } from "@/lib/utils";
import {
  generateBreadcrumbSchema,
  generateEnhancedOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateComparisonSchema,
  generateHowToSchema,
  generatePricingSchema,
} from "@/lib/seo";
import { generateFAQSchema, generateCombinedSchema, type FAQItem } from "@/lib/faq-schema";

type SchemaType =
  | "organization"
  | "software"
  | "article"
  | "faq"
  | "howto"
  | "breadcrumb"
  | "comparison"
  | "pricing"
  | "website"
  | "webpage";

interface SchemaMarkupProps {
  type: SchemaType;
  data?: Record<string, any>;
  additionalSchemas?: Record<string, any>[];
}

/**
 * SchemaMarkup - Reusable JSON-LD structured data component
 *
 * Generates and injects schema.org structured data based on type.
 * Supports combining multiple schemas via @graph for rich AI search results.
 *
 * @example
 * <SchemaMarkup type="software" />
 * <SchemaMarkup type="faq" data={{ faqs: [...] }} />
 * <SchemaMarkup type="comparison" data={{ items: [...] }} />
 */
export function SchemaMarkup({ type, data = {}, additionalSchemas = [] }: SchemaMarkupProps) {
  const siteUrl = getSafeOrigin();

  const generateSchema = (): Record<string, any> | null => {
    switch (type) {
      case "organization":
        return generateEnhancedOrganizationSchema();

      case "software":
        return generateSoftwareApplicationSchema(data);

      case "article": {
        return {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": data.title,
          "description": data.description,
          "datePublished": data.publishedTime,
          "dateModified": data.modifiedTime || data.publishedTime,
          "author": {
            "@type": "Person",
            "name": data.author || "AgentBio Team",
          },
          "publisher": {
            "@type": "Organization",
            "name": "AgentBio",
            "logo": {
              "@type": "ImageObject",
              "url": `${siteUrl}/logo.png`,
            },
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url || siteUrl,
          },
          ...(data.image && {
            "image": {
              "@type": "ImageObject",
              "url": data.image,
              "width": 1200,
              "height": 630,
            },
          }),
          ...(data.wordCount && { "wordCount": data.wordCount }),
          ...(data.category && { "articleSection": data.category }),
          ...(data.tags && { "keywords": data.tags.join(", ") }),
          "inLanguage": "en-US",
          "isAccessibleForFree": true,
        };
      }

      case "faq": {
        const faqs: FAQItem[] = data.faqs || [];
        if (faqs.length === 0) return null;
        return generateFAQSchema(faqs);
      }

      case "howto": {
        if (!data.name || !data.steps) return null;
        return generateHowToSchema({
          name: data.name,
          description: data.description || "",
          totalTime: data.totalTime,
          estimatedCost: data.estimatedCost,
          steps: data.steps,
          tools: data.tools,
        });
      }

      case "breadcrumb": {
        const items = data.items || [];
        if (items.length === 0) return null;
        return generateBreadcrumbSchema(items);
      }

      case "comparison": {
        const items = data.items || [];
        if (items.length === 0) return null;
        return generateComparisonSchema(items);
      }

      case "pricing": {
        const tiers = data.tiers || [];
        if (tiers.length === 0) return null;
        return generatePricingSchema(tiers);
      }

      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${siteUrl}#website`,
          "url": siteUrl,
          "name": "AgentBio",
          "description": "Purpose-built link-in-bio platform for real estate agents",
          "publisher": {
            "@id": `${siteUrl}/#organization`,
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${siteUrl}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        };

      case "webpage":
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": data.url || siteUrl,
          "url": data.url || siteUrl,
          "name": data.title || "AgentBio",
          "description": data.description || "",
          "publisher": {
            "@id": `${siteUrl}/#organization`,
          },
          "isPartOf": {
            "@type": "WebSite",
            "@id": `${siteUrl}#website`,
          },
          "inLanguage": "en-US",
          ...(data.dateModified && { "dateModified": data.dateModified }),
        };

      default:
        return null;
    }
  };

  const primarySchema = generateSchema();
  if (!primarySchema && additionalSchemas.length === 0) return null;

  // Combine with additional schemas if provided
  const allSchemas = [
    ...(primarySchema ? [primarySchema] : []),
    ...additionalSchemas,
  ];

  const finalSchema =
    allSchemas.length === 1
      ? allSchemas[0]
      : generateCombinedSchema(allSchemas);

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
}
