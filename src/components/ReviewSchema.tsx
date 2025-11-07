import { Helmet } from "react-helmet-async";

export interface ReviewSchemaProps {
  reviews: {
    author: string;
    rating: number; // 1-5
    reviewBody: string;
    datePublished: string; // ISO 8601 date string
  }[];
  itemReviewed: {
    type: "RealEstateAgent" | "Product" | "Service" | "Organization";
    name: string;
    url?: string;
    image?: string;
  };
}

/**
 * ReviewSchema Component
 *
 * Generates structured data for reviews/testimonials to improve SEO
 * and visibility in search results and AI-powered search engines.
 *
 * @example
 * <ReviewSchema
 *   itemReviewed={{
 *     type: "RealEstateAgent",
 *     name: "John Smith",
 *     url: "https://agentbio.net/john-smith"
 *   }}
 *   reviews={[
 *     {
 *       author: "Jane Doe",
 *       rating: 5,
 *       reviewBody: "John helped us find our dream home!",
 *       datePublished: "2024-03-15"
 *     }
 *   ]}
 * />
 */
export function ReviewSchema({ reviews, itemReviewed }: ReviewSchemaProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Calculate aggregate rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      // Aggregate Rating
      {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": reviews.length,
        "bestRating": "5",
        "worstRating": "1",
      },
      // Individual Reviews
      ...reviews.map((review, index) => ({
        "@type": "Review",
        "@id": `#review-${index}`,
        "itemReviewed": {
          "@type": itemReviewed.type,
          "name": itemReviewed.name,
          ...(itemReviewed.url && { "url": itemReviewed.url }),
          ...(itemReviewed.image && { "image": itemReviewed.image }),
        },
        "author": {
          "@type": "Person",
          "name": review.author,
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating.toString(),
          "bestRating": "5",
          "worstRating": "1",
        },
        "reviewBody": review.reviewBody,
        "datePublished": review.datePublished,
      })),
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * Helper function to format testimonials for ReviewSchema
 *
 * @param testimonials - Array of testimonial objects from your database
 * @param agentName - Name of the agent being reviewed
 * @param agentUrl - URL to the agent's profile
 * @returns Formatted reviews array for ReviewSchema component
 */
export function formatTestimonialsForSchema(
  testimonials: Array<{
    author?: string;
    rating?: number;
    content: string;
    created_at?: string;
  }>,
  agentName: string,
  agentUrl: string
): ReviewSchemaProps {
  return {
    itemReviewed: {
      type: "RealEstateAgent",
      name: agentName,
      url: agentUrl,
    },
    reviews: testimonials
      .filter((t) => t.rating && t.author && t.content)
      .map((testimonial) => ({
        author: testimonial.author || "Anonymous",
        rating: testimonial.rating || 5,
        reviewBody: testimonial.content,
        datePublished:
          testimonial.created_at || new Date().toISOString().split("T")[0],
      })),
  };
}
