/**
 * FAQ Schema Utilities for AI Search Optimization
 *
 * Generates FAQPage structured data that helps AI search engines
 * (Google SGE, Perplexity, ChatGPT) extract and cite answers.
 */

/*
 * Only the FAQ sets a page renders live here (US-577). Unrendered sets
 * (HOMEPAGE_FAQS, PRICING_FAQS, COMPARISON_FAQS and the propertyListings,
 * testimonials and calendarBooking feature sets) were deleted: nothing showed
 * them, so the claims tests that guard rendered copy never read them, and one
 * import was all it took to publish "Traditional real estate websites cost
 * $3,000-$15,000" as FAQPage JSON-LD. src/dead-claim-exports.test.ts fails if
 * an export here, or a FEATURE_FAQS key, loses its last importer.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQPage schema for structured data
 * This is critical for AI search engines to extract and display answers
 */
export const generateFAQSchema = (faqs: readonly FAQItem[]): Record<string, unknown> => {
  return {
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
  const cleanedSchemas = schemas.map((schema) => {
    const { '@context': _, ...rest } = schema as { '@context'?: string };
    return rest;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': cleanedSchemas,
  };
};

/**
 * Predefined FAQ sets for common feature pages
 */
export const FEATURE_FAQS = {
  leadCapture: [
    {
      question: 'What types of lead capture forms does AgentBio offer?',
      answer:
        'AgentBio offers three lead capture forms for real estate agents: a Buyer Inquiry Form with pre-qualification questions like price range, timeline and pre-approval status, a Seller Lead Form that asks for the property address, timeline and reason for selling, and a Home Valuation Request Form for homeowners who want to know what their home is worth (you prepare the valuation). Each asks for a name and an email or phone first; the qualifying questions come second and are optional.',
    },
    {
      question: "How does AgentBio's lead scoring work?",
      answer:
        'AgentBio scores each lead from 0 to 100 and labels it Hot, Warm, or Cold. The score weighs whether the lead is pre-approved, whether they gave a timeline, the kind of enquiry, whether they left a phone number, how much they wrote and where they came from. It is a fixed set of rules, not a trained model, and it helps agents decide who to call first.',
    },
    {
      question: 'Do I get notified when someone submits a lead form?',
      answer:
        "Yes. By default AgentBio emails you as each lead arrives, with the lead's name, email, phone, message and the listing or page they came from; their answers to the qualifying questions are on the lead in your dashboard. You can switch to a morning digest or turn the emails off. Leads beyond your plan's monthly allowance are still saved, but their contact details stay hidden in the email and the dashboard until you upgrade.",
    },
    {
      question: 'Can I export leads to my CRM?',
      answer:
        'There is no built-in CRM integration. You can connect a Zapier webhook that sends each new lead on to your CRM as it arrives, and on paid plans you can export your leads as a CSV file, filtered by status or lead type, to import yourself.',
    },
  ],
  // analytics was rewritten in US-332 to match what ships: there is no
  // engagement-time metric and no live feed. src/features-claims.test.ts
  // scans this file for the removed phrases.
  analytics: [
    {
      question: 'What analytics does AgentBio track?',
      answer:
        'AgentBio tracks page views, unique visitors, clicks on each link, Call, Email and Text taps, lead form opens and submissions, and views per listing. It shows your visitor-to-lead conversion rate and leads by type for the last 7, 30 or 90 days.',
    },
    {
      question: 'Can I see where my traffic comes from?',
      answer:
        'Yes. AgentBio separates campaign visits (links tagged with a source such as ?utm_source=instagram), referrals from other websites and direct visits, and shows page views, lead form opens and leads for each campaign source.',
    },
    {
      question: 'How often are analytics updated?',
      answer:
        'Visits, taps and leads are recorded as they happen and appear in your dashboard the next time it loads. You can export the numbers as CSV or a PDF report.',
    },
  ],
} as const;
