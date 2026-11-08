/**
 * FAQ Schema Utilities for AI Search Optimization
 *
 * Generates FAQPage structured data that helps AI search engines
 * (Google SGE, Perplexity, ChatGPT) extract and cite answers.
 */

import { PRICING_PLANS, listingAllowanceSummary } from '@/config/pricing-plans';

/*
 * Plan facts in these answers come from PRICING_PLANS (US-355). The answers
 * said "unlimited property listings" (Professional allows 25, only Team and
 * above are unlimited), "Paid plans start at $39/month" (Starter is $29) and
 * "the $39/month Professional plan" (it is $49).
 */
const planPrice = (id: string): number => {
  const plan = PRICING_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`faq-schema: no pricing plan "${id}"`);
  return plan.price_monthly;
};
const FREE_PLAN = PRICING_PLANS.find((p) => p.price_monthly === 0);
const FIRST_PAID_PRICE = Math.min(
  ...PRICING_PLANS.filter((p) => p.price_monthly > 0).map((p) => p.price_monthly)
);
const LISTING_ALLOWANCE = listingAllowanceSummary();

/** What the public page shows that an MLS or state advertising rule usually asks for. */
const DISCLOSURES =
  'the Equal Housing Opportunity logo and statement, your license number and the MLS number on each listing';

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
  propertyListings: [
    {
      question: 'How many property listings can I showcase on AgentBio?',
      answer: `It depends on your plan: ${LISTING_ALLOWANCE}. You can display active listings, pending sales, and sold properties to demonstrate your market activity and success.`,
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
    answer: `AgentBio offers a free plan with ${FREE_PLAN?.limits.listings} listings and ${FREE_PLAN?.limits.links} links. Paid plans start at $${FIRST_PAID_PRICE}/month and raise the allowances: ${LISTING_ALLOWANCE}. Enterprise, with white-label branding and a custom domain, is $${planPrice('enterprise')}/month.`,
  },
  {
    question: 'How is AgentBio different from Linktree?',
    answer:
      "AgentBio includes real estate-specific features that Linktree doesn't offer: property listing galleries with MLS details, buyer/seller lead capture forms with pre-qualification scoring, appointment booking for showings, and testimonial showcases with schema markup.",
  },
  {
    question: 'Can I showcase property listings on AgentBio?',
    answer: `Yes. AgentBio lets you showcase property listings (${LISTING_ALLOWANCE}) with full photo galleries, pricing, square footage, beds/baths, MLS numbers, property descriptions, and virtual tour links. Mark properties as active, pending, or sold.`,
  },
  {
    question: 'Does AgentBio capture leads?',
    answer:
      'Yes. AgentBio includes built-in lead capture forms for buyer inquiries, seller leads, and home valuation requests. Leads are automatically scored as Hot, Warm, or Cold from signals like pre-approval status, whether a timeline was given and whether a phone number was left.',
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
    answer: `Yes. AgentBio's free plan includes ${FREE_PLAN?.limits.listings} property listings, ${FREE_PLAN?.limits.links} custom links, basic analytics, and a mobile-optimized bio page. No credit card required to get started.`,
  },
  {
    question: `What's included in the $${planPrice('professional')}/month Professional plan?`,
    answer: `The Professional plan includes ${PRICING_PLANS.find((p) => p.id === 'professional')?.limits.listings} property listings, unlimited links, lead capture forms for buyers/sellers/valuations, calendar booking, advanced analytics, custom branding, and QR code generation for marketing materials.`,
  },
  {
    question: 'Can I cancel my AgentBio subscription anytime?',
    answer:
      'Yes. AgentBio subscriptions can be cancelled anytime with no cancellation fees. Your page remains accessible on the free plan after cancellation.',
  },
  {
    question: 'Is AgentBio cheaper than a traditional real estate website?',
    answer: `Yes. Traditional real estate websites cost $3,000-$15,000 upfront plus $100-$300/month for hosting and maintenance. AgentBio's paid plans start at $${FIRST_PAID_PRICE}/month with no setup fees and include hosting, updates, and support.`,
  },
];

/**
 * Comparison page FAQ sets
 */
export const COMPARISON_FAQS = {
  linktree: [
    {
      question: 'Is AgentBio better than Linktree for real estate agents?',
      answer: `Yes. AgentBio is purpose-built for real estate with property galleries, lead forms, and ${DISCLOSURES}. Linktree is a generic link tool that doesn't support listing photos, buyer inquiries, or appointment booking — features critical for real estate lead generation.`,
    },
    {
      question: 'Can Linktree display property listings like AgentBio?',
      answer:
        'No. Linktree only displays simple links and basic media embeds. AgentBio includes full property listing galleries with photos, pricing, beds/baths, MLS numbers, and status tracking (active/pending/sold) — designed specifically for real estate agents.',
    },
    {
      question: 'Does Linktree have lead capture for real estate?',
      answer:
        'No. Linktree has basic email collection but no real estate-specific lead forms. AgentBio offers buyer inquiry forms, seller lead forms, and home valuation requests with automatic lead scoring based on pre-approval status, timeline and contact details.',
    },
  ],
  beacons: [
    {
      question: 'How does AgentBio compare to Beacons for real estate?',
      answer:
        "Beacons is designed for content creators and e-commerce. AgentBio is built specifically for real estate agents with property galleries, the MLS number on each listing, lead scoring, and appointment booking — features Beacons doesn't offer.",
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
