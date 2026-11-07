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
 * Generate speakable schema for voice search and Google Assistant
 * Identifies content that is most suitable for text-to-speech
 */
export const generateSpeakableSchema = (
  cssSelectors: string[],
  url: string
): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
    url: url,
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
        'AgentBio offers three specialized lead capture forms for real estate agents: Buyer Inquiry Forms with pre-qualification questions like budget and pre-approval status, Seller Lead Forms that capture timeline and motivation to sell, and Home Valuation Request Forms that attract seller leads with free property valuations.',
    },
    {
      question: "How does AgentBio's lead scoring work?",
      answer:
        'AgentBio automatically scores leads as Hot, Warm, or Cold based on their responses. Hot leads are pre-approved buyers with 0-30 day timelines, Warm leads have 30-90 day timelines with defined budgets, and Cold leads are in early research with 90+ day timelines. This helps agents prioritize who to call first.',
    },
    {
      question: 'Do I get notified when someone submits a lead form?',
      answer:
        'Yes, AgentBio sends instant email notifications when leads submit forms. You receive all lead details including name, budget, timeline, and pre-approval status within seconds, allowing you to follow up while leads are still hot.',
    },
    {
      question: 'Can I export leads to my CRM?',
      answer:
        'Yes, all leads captured through AgentBio forms are stored in your dashboard and can be exported to your CRM anytime. You can sort leads by date, type, or status before exporting.',
    },
  ],
  propertyListings: [
    {
      question: 'How many property listings can I showcase on AgentBio?',
      answer:
        'AgentBio allows real estate agents to showcase unlimited property listings on their bio page. You can display active listings, pending sales, and sold properties to demonstrate your market activity and success.',
    },
    {
      question: 'Can I sync my MLS listings with AgentBio?',
      answer:
        'Not yet. Listings are entered in AgentBio with photos, price, beds/baths and descriptions; MLS sync is on the roadmap, and you can ask to be notified on the pricing page.',
    },
    {
      question: 'Do property listings on AgentBio help with SEO?',
      answer:
        "Yes, each property listing on AgentBio generates structured data markup that helps search engines understand your listings. This improves visibility in local real estate searches and Google's property listings features.",
    },
  ],
  // analytics, testimonials and calendarBooking were rewritten in US-332 to
  // match what ships: there is no engagement-time metric, no live feed, no
  // Google Calendar sync and no appointment types of our own, and clients can
  // submit reviews (/:username/review). src/features-claims.test.ts scans
  // this file for the removed phrases.
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
  testimonials: [
    {
      question: 'How do I add client testimonials to AgentBio?',
      answer:
        "Add them from your AgentBio dashboard with the client's name, star rating, review text and an optional photo, or send clients your review link so they can write it themselves. Published testimonials appear on your public bio page with review markup for search engines.",
    },
    {
      question: 'Do testimonials help with Google rankings?',
      answer:
        'AgentBio adds Review and AggregateRating markup built from your published testimonials. That makes the reviews readable to search engines; Google decides whether to show star ratings in its results.',
    },
    {
      question: 'Can clients leave testimonials directly?',
      answer:
        'Yes. Each agent has a review page at agentbio.net/yourname/review. A submitted review notifies you and stays hidden until you publish it, so you control what appears on your profile.',
    },
  ],
  calendarBooking: [
    {
      question: 'How does calendar booking work on AgentBio?',
      answer:
        'Add your Calendly link to your profile and every listing on your page gets a Schedule a Showing button. The visitor enters their name and email, books a time in your Calendly inside your page, and the booking is saved to your leads.',
    },
    {
      question: 'Does AgentBio sync with my existing calendar?',
      answer:
        'AgentBio does not connect to your calendar itself. Bookings go through Calendly, which checks and updates whichever calendar you have connected to your Calendly account.',
    },
    {
      question: 'Can I set different appointment types?',
      answer:
        'Appointment types, durations, buffers and notice periods are set in Calendly. AgentBio opens the Calendly link you give it, so whatever you configure there applies.',
    },
  ],
} as const;

/**
 * Homepage / Product FAQ set optimized for GEO citation
 * Direct answers under 300 characters for AI extraction
 */
export const HOMEPAGE_FAQS: FAQItem[] = [
  {
    question: 'What is AgentBio?',
    answer:
      'AgentBio is a purpose-built link-in-bio platform for real estate agents. It includes property listing galleries, lead capture forms with pre-qualification, calendar booking, and testimonial showcases — designed to convert Instagram followers into qualified buyer and seller leads.',
  },
  {
    question: 'How much does AgentBio cost?',
    answer:
      'AgentBio offers a free plan with 3 listings and 5 links. Paid plans start at $39/month with unlimited listings, lead capture forms, calendar integration, and analytics. Enterprise plans with white-label and custom domain are $299/month.',
  },
  {
    question: 'How is AgentBio different from Linktree?',
    answer:
      "AgentBio includes real estate-specific features that Linktree doesn't offer: property listing galleries with MLS details, buyer/seller lead capture forms with pre-qualification scoring, appointment booking for showings, and testimonial showcases with schema markup.",
  },
  {
    question: 'Can I showcase property listings on AgentBio?',
    answer:
      'Yes. AgentBio lets you showcase unlimited property listings (on paid plans) with full photo galleries, pricing, square footage, beds/baths, MLS numbers, property descriptions, and virtual tour links. Mark properties as active, pending, or sold.',
  },
  {
    question: 'Does AgentBio capture leads?',
    answer:
      'Yes. AgentBio includes built-in lead capture forms for buyer inquiries, seller leads, and home valuation requests. Leads are automatically scored as Hot, Warm, or Cold based on responses like budget, timeline, and pre-approval status.',
  },
  {
    question: 'Does AgentBio work with Instagram?',
    answer:
      'Yes. Place your AgentBio link in your Instagram bio, and followers land on a mobile-optimized page with property listings, lead forms, and booking. AgentBio is designed for the 80%+ of Instagram traffic from mobile devices.',
  },
];

/**
 * Pricing page FAQ set
 */
export const PRICING_FAQS: FAQItem[] = [
  {
    question: 'Is there a free plan for AgentBio?',
    answer:
      "Yes. AgentBio's free plan includes 3 property listings, 5 custom links, basic analytics, and a mobile-optimized bio page. No credit card required to get started.",
  },
  {
    question: "What's included in the $39/month Professional plan?",
    answer:
      'The Professional plan includes unlimited property listings, lead capture forms for buyers/sellers/valuations, calendar booking integration, advanced analytics, custom branding, and QR code generation for marketing materials.',
  },
  {
    question: 'Can I cancel my AgentBio subscription anytime?',
    answer:
      'Yes. AgentBio subscriptions can be cancelled anytime with no cancellation fees. Your page remains accessible on the free plan after cancellation.',
  },
  {
    question: 'Is AgentBio cheaper than a traditional real estate website?',
    answer:
      'Yes. Traditional real estate websites cost $3,000-$15,000 upfront plus $100-$300/month for hosting and maintenance. AgentBio starts at $39/month with no setup fees and includes hosting, updates, and support.',
  },
];

/**
 * Comparison page FAQ sets
 */
export const COMPARISON_FAQS = {
  linktree: [
    {
      question: 'Is AgentBio better than Linktree for real estate agents?',
      answer:
        "Yes. AgentBio is purpose-built for real estate with property galleries, lead forms, and MLS compliance. Linktree is a generic link tool that doesn't support listing photos, buyer inquiries, or appointment booking — features critical for real estate lead generation.",
    },
    {
      question: 'Can Linktree display property listings like AgentBio?',
      answer:
        'No. Linktree only displays simple links and basic media embeds. AgentBio includes full property listing galleries with photos, pricing, beds/baths, MLS numbers, and status tracking (active/pending/sold) — designed specifically for real estate agents.',
    },
    {
      question: 'Does Linktree have lead capture for real estate?',
      answer:
        'No. Linktree has basic email collection but no real estate-specific lead forms. AgentBio offers buyer inquiry forms, seller lead forms, and home valuation requests with automatic lead scoring based on budget, timeline, and pre-approval status.',
    },
  ],
  beacons: [
    {
      question: 'How does AgentBio compare to Beacons for real estate?',
      answer:
        "Beacons is designed for content creators and e-commerce. AgentBio is built specifically for real estate agents with property galleries, MLS compliance, lead scoring, and appointment booking — features Beacons doesn't offer.",
    },
    {
      question: 'Can Beacons handle property listings?',
      answer:
        'No. Beacons focuses on digital products and creator monetization. AgentBio provides dedicated property listing galleries with photos, pricing, MLS details, and status tracking designed for real estate marketing.',
    },
  ],
  later: [
    {
      question: 'Should real estate agents use Later or AgentBio?',
      answer:
        'For link-in-bio specifically, AgentBio is better for real estate agents. Later excels at social media scheduling but its bio link feature is basic. AgentBio offers property galleries, lead capture, and booking designed for real estate conversions.',
    },
    {
      question: 'Does Later Link in Bio support property listings?',
      answer:
        "No. Later's link-in-bio feature supports basic links and social feeds but not real estate-specific features like property galleries, lead capture forms, or appointment booking that AgentBio provides.",
    },
  ],
} as const;

export type FeatureFAQKey = keyof typeof FEATURE_FAQS;
