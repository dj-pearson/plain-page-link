/**
 * FAQ Schema Utilities for AI Search Optimization
 *
 * Generates FAQPage structured data that helps AI search engines
 * (Google SGE, Perplexity, ChatGPT) extract and cite answers.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQPage schema for structured data
 * This is critical for AI search engines to extract and display answers
 */
export const generateFAQSchema = (faqs: FAQItem[]): Record<string, unknown> => {
  return {
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
  };
};

/**
 * Generate combined schema with multiple types using @graph
 * Useful for pages that have both FAQPage and other schemas
 */
export const generateCombinedSchema = (
  schemas: Record<string, unknown>[]
): Record<string, unknown> => {
  // Remove @context from individual schemas and combine
  const cleanedSchemas = schemas.map(schema => {
    const { "@context": _, ...rest } = schema as { "@context"?: string };
    return rest;
  });

  return {
    "@context": "https://schema.org",
    "@graph": cleanedSchemas
  };
};

/**
 * Generate speakable schema for voice search and Google Assistant
 * Identifies content that is most suitable for text-to-speech
 */
export const generateSpeakableSchema = (
  cssSelectors: string[],
  url: string
): Record<string, unknown> => {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": cssSelectors
    },
    "url": url
  };
};

/**
 * Predefined FAQ sets for common feature pages
 */
export const FEATURE_FAQS = {
  leadCapture: [
    {
      question: "What types of lead capture forms does AgentBio offer?",
      answer: "AgentBio offers three specialized lead capture forms for real estate agents: Buyer Inquiry Forms with pre-qualification questions like budget and pre-approval status, Seller Lead Forms that capture timeline and motivation to sell, and Home Valuation Request Forms that attract seller leads with free property valuations."
    },
    {
      question: "How does AgentBio's lead scoring work?",
      answer: "AgentBio automatically scores leads as Hot, Warm, or Cold based on their responses. Hot leads are pre-approved buyers with 0-30 day timelines, Warm leads have 30-90 day timelines with defined budgets, and Cold leads are in early research with 90+ day timelines. This helps agents prioritize who to call first."
    },
    {
      question: "Do I get notified when someone submits a lead form?",
      answer: "Yes, AgentBio sends instant email notifications when leads submit forms. You receive all lead details including name, budget, timeline, and pre-approval status within seconds, allowing you to follow up while leads are still hot."
    },
    {
      question: "Can I export leads to my CRM?",
      answer: "Yes, all leads captured through AgentBio forms are stored in your dashboard and can be exported to your CRM anytime. You can sort leads by date, type, or status before exporting."
    }
  ],
  propertyListings: [
    {
      question: "How many property listings can I showcase on AgentBio?",
      answer: "AgentBio allows real estate agents to showcase unlimited property listings on their bio page. You can display active listings, pending sales, and sold properties to demonstrate your market activity and success."
    },
    {
      question: "Can I sync my MLS listings with AgentBio?",
      answer: "AgentBio supports manual listing entry with all property details including photos, price, beds/baths, and descriptions. MLS integration varies by market. Contact support for specific MLS availability in your area."
    },
    {
      question: "Do property listings on AgentBio help with SEO?",
      answer: "Yes, each property listing on AgentBio generates structured data markup that helps search engines understand your listings. This improves visibility in local real estate searches and Google's property listings features."
    }
  ],
  analytics: [
    {
      question: "What analytics does AgentBio track?",
      answer: "AgentBio tracks comprehensive analytics including page views, unique visitors, link clicks, lead form submissions, and engagement time. You can see which listings get the most views and which content drives the most leads."
    },
    {
      question: "Can I see where my traffic comes from?",
      answer: "Yes, AgentBio analytics show traffic sources including direct visits, social media referrals, and search engine traffic. This helps you understand which marketing channels drive the most engagement."
    },
    {
      question: "How often are analytics updated?",
      answer: "AgentBio analytics update in real-time. You can see visitor activity as it happens and track daily, weekly, and monthly trends from your dashboard."
    }
  ],
  testimonials: [
    {
      question: "How do I add client testimonials to AgentBio?",
      answer: "You can add client testimonials directly from your AgentBio dashboard. Enter the client's name, their review text, and optionally their photo. Testimonials appear on your public bio page with proper schema markup for search engines."
    },
    {
      question: "Do testimonials help with Google rankings?",
      answer: "Yes, AgentBio generates Review and AggregateRating schema markup for your testimonials. This can help your profile appear with star ratings in Google search results, increasing click-through rates."
    },
    {
      question: "Can clients leave testimonials directly?",
      answer: "Currently, testimonials are added by the agent through the dashboard. This gives you control over which reviews appear on your public profile."
    }
  ],
  calendarBooking: [
    {
      question: "How does calendar booking work on AgentBio?",
      answer: "AgentBio's calendar booking lets visitors schedule appointments directly from your bio page. You set your availability, and clients can book showings, consultations, or listing appointments at times that work for both of you."
    },
    {
      question: "Does AgentBio sync with my existing calendar?",
      answer: "AgentBio integrates with Google Calendar to sync your availability and prevent double-bookings. When someone books an appointment, it automatically appears on your calendar."
    },
    {
      question: "Can I set different appointment types?",
      answer: "Yes, you can create different appointment types with varying durations. For example, 15-minute phone consultations, 30-minute buyer consultations, or 1-hour listing presentations."
    }
  ]
} as const;

export type FeatureFAQKey = keyof typeof FEATURE_FAQS;
