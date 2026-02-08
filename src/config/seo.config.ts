/**
 * Centralized SEO Configuration
 * Site-wide constants for consistent SEO across all pages
 */

export const SEO_CONFIG = {
  siteName: 'AgentBio',
  siteUrl: 'https://agentbio.net',
  defaultTitle: 'AgentBio - Real Estate Agent Bio Page Builder',
  defaultDescription: 'Purpose-built link-in-bio for real estate agents. Showcase properties, capture leads, and book appointments from Instagram.',
  defaultImage: '/Cover.png',
  twitterHandle: '@agentbio',
  locale: 'en_US',
  themeColor: '#0ea5e9',

  // Organization info for schema
  organization: {
    name: 'AgentBio',
    legalName: 'AgentBio Intelligence',
    email: 'support@agentbio.net',
    foundingDate: '2024',
    slogan: 'Transform Instagram followers into qualified leads',
    logo: '/logo.png',
    logoWidth: 512,
    logoHeight: 512,
  },

  // Social links for schema
  socialLinks: [
    'https://twitter.com/agentbio',
    'https://www.facebook.com/agentbio',
    'https://www.linkedin.com/company/agentbio',
    'https://www.instagram.com/agentbio',
    'https://www.youtube.com/@agentbio',
    'https://github.com/agentbio',
  ],

  // Default ratings
  ratings: {
    ratingValue: '4.8',
    reviewCount: '523',
    bestRating: '5',
    worstRating: '1',
  },

  // Pricing info
  pricing: {
    startingPrice: '39',
    currency: 'USD',
    priceValidUntil: '2026-12-31',
  },

  // Default keywords
  defaultKeywords: [
    'real estate agent bio page',
    'Instagram bio page for realtors',
    'real estate link in bio',
    'agent portfolio website',
    'real estate social media landing page',
  ],
} as const;

/**
 * Page-specific SEO templates
 */
export const PAGE_SEO_TEMPLATES = {
  home: {
    title: 'Real Estate Agent Bio Page Builder | Turn Instagram Followers into Leads',
    description: 'Purpose-built link-in-bio for real estate agents. Showcase properties, capture leads, and book appointments from Instagram. Start converting followers into clients today.',
    keywords: [
      'real estate agent bio page',
      'Instagram bio page for realtors',
      'real estate link in bio',
      'agent portfolio website',
      'turn Instagram followers into real estate leads',
    ],
  },

  pricing: {
    title: 'Pricing | AgentBio - Real Estate Agent Bio Page Builder',
    description: 'Simple, transparent pricing for real estate agent bio pages. Start free, upgrade when ready. Property galleries, lead capture, and appointment booking included.',
    keywords: [
      'real estate bio page pricing',
      'agent website cost',
      'link in bio pricing',
      'real estate marketing tools cost',
    ],
  },

  blog: {
    title: 'Real Estate Marketing Blog | Tips & Strategies for Agents',
    description: 'Expert tips on real estate marketing, Instagram strategies, lead generation, and growing your real estate business. Updated weekly with fresh content.',
    keywords: [
      'real estate marketing tips',
      'Instagram for realtors',
      'real estate lead generation',
      'agent marketing strategies',
    ],
  },

  tools: {
    instagramBioAnalyzer: {
      title: 'Free Instagram Bio Analyzer for Real Estate Agents',
      description: 'Analyze and optimize your Instagram bio for real estate lead generation. Get actionable tips to convert more followers into clients.',
      keywords: [
        'Instagram bio analyzer',
        'realtor bio optimization',
        'Instagram for real estate',
        'social media bio tips',
      ],
    },
    listingDescriptionGenerator: {
      title: 'Free Listing Description Generator for Real Estate Agents',
      description: 'Generate compelling property listing descriptions with AI. Save time and attract more buyers with professionally written descriptions.',
      keywords: [
        'listing description generator',
        'property description AI',
        'real estate copywriting',
        'MLS description generator',
      ],
    },
  },

  features: {
    propertyListings: {
      title: 'Property Listings Gallery | Showcase Your Real Estate Portfolio',
      description: 'Display active and sold property listings with photos, prices, and details. Perfect for showcasing your real estate portfolio on Instagram.',
      keywords: ['property listings', 'real estate gallery', 'listing showcase', 'property portfolio'],
    },
    leadCapture: {
      title: 'Lead Capture Forms | Convert Visitors into Real Estate Leads',
      description: 'Built-in lead capture forms for buyers, sellers, and home valuations. Capture qualified real estate leads directly from your bio page.',
      keywords: ['real estate lead capture', 'buyer lead forms', 'seller lead generation', 'home valuation form'],
    },
    calendarBooking: {
      title: 'Calendar Booking | Schedule Showings from Your Bio Page',
      description: 'Integrated calendar booking for showing requests and consultations. Let clients book appointments directly from your Instagram bio link.',
      keywords: ['showing scheduler', 'real estate appointment booking', 'Calendly integration', 'consultation booking'],
    },
    testimonials: {
      title: 'Client Testimonials | Showcase Reviews on Your Bio Page',
      description: 'Display client reviews and success stories to build trust. Add video testimonials and 5-star ratings to your real estate bio page.',
      keywords: ['client testimonials', 'real estate reviews', 'agent testimonials', 'social proof'],
    },
    analytics: {
      title: 'Analytics Dashboard | Track Your Bio Page Performance',
      description: 'Detailed analytics on page views, lead sources, and listing engagement. Understand which properties and content drive the most interest.',
      keywords: ['bio page analytics', 'lead tracking', 'real estate metrics', 'engagement analytics'],
    },
  },

  comparisons: {
    linktree: {
      title: 'AgentBio vs Linktree | Best Link in Bio for Real Estate Agents',
      description: 'Compare AgentBio to Linktree for real estate marketing. See why agents choose purpose-built bio pages over generic link tools.',
      keywords: ['AgentBio vs Linktree', 'best link in bio for realtors', 'Linktree alternative for real estate'],
    },
    beacons: {
      title: 'AgentBio vs Beacons | Real Estate Bio Page Comparison',
      description: 'Compare AgentBio to Beacons for real estate agents. Property listings, lead capture, and MLS compliance built for real estate.',
      keywords: ['AgentBio vs Beacons', 'Beacons alternative', 'bio page for real estate agents'],
    },
    later: {
      title: 'AgentBio vs Later | Best Bio Page for Real Estate Marketing',
      description: 'Compare AgentBio to Later Link in Bio for real estate. See why agents prefer specialized bio pages with property listings and lead capture.',
      keywords: ['AgentBio vs Later', 'Later alternative', 'link in bio comparison'],
    },
  },
} as const;

/**
 * Pricing tier definitions for schema generation
 */
export const PRICING_TIERS = [
  {
    name: 'Free',
    description: 'Get started with 3 property listings and 5 links. Perfect for trying AgentBio.',
    price: '0',
    priceCurrency: 'USD',
    billingPeriod: 'P1M',
    features: [
      '3 property listings',
      '5 custom links',
      'Basic analytics',
      'Mobile-optimized page',
    ],
  },
  {
    name: 'Professional',
    description: 'Unlimited listings, lead capture forms, calendar booking, and advanced analytics for growing agents.',
    price: '39',
    priceCurrency: 'USD',
    billingPeriod: 'P1M',
    features: [
      'Unlimited property listings',
      'Lead capture forms',
      'Calendar booking integration',
      'Advanced analytics',
      'Custom branding',
      'QR code generation',
    ],
  },
  {
    name: 'Team',
    description: 'Team collaboration, advanced analytics, and priority support for real estate teams and brokerages.',
    price: '99',
    priceCurrency: 'USD',
    billingPeriod: 'P1M',
    features: [
      'Everything in Professional',
      'Team collaboration',
      'Advanced analytics',
      'Priority support',
      'Team management dashboard',
    ],
  },
  {
    name: 'Enterprise',
    description: 'White-label solution with custom domain, dedicated support, and API access for large brokerages.',
    price: '299',
    priceCurrency: 'USD',
    billingPeriod: 'P1M',
    features: [
      'Everything in Team',
      'White-label branding',
      'Custom domain',
      'Dedicated support',
      'API access',
      'Custom integrations',
    ],
  },
] as const;

/**
 * Comparison data for structured schema on vs. pages
 */
export const COMPARISON_DATA = {
  linktree: {
    competitor: {
      name: 'Linktree',
      description: 'Generic link-in-bio tool for sharing multiple links from a single page. Popular across all industries but lacks real estate-specific features.',
      url: 'https://linktr.ee',
      price: '5',
      rating: '4.2',
    },
    agentbio: {
      name: 'AgentBio',
      description: 'Purpose-built link-in-bio platform for real estate agents with property galleries, lead capture, calendar booking, and MLS compliance.',
      url: 'https://agentbio.net',
      price: '39',
      rating: '4.8',
    },
  },
  beacons: {
    competitor: {
      name: 'Beacons',
      description: 'Link-in-bio and creator monetization platform focused on content creators and e-commerce sellers.',
      url: 'https://beacons.ai',
      price: '10',
      rating: '4.0',
    },
    agentbio: {
      name: 'AgentBio',
      description: 'Purpose-built link-in-bio platform for real estate agents with property galleries, lead capture, calendar booking, and MLS compliance.',
      url: 'https://agentbio.net',
      price: '39',
      rating: '4.8',
    },
  },
  later: {
    competitor: {
      name: 'Later',
      description: 'Social media scheduling and link-in-bio tool. Primarily focused on content scheduling with basic bio link functionality.',
      url: 'https://later.com',
      price: '25',
      rating: '4.1',
    },
    agentbio: {
      name: 'AgentBio',
      description: 'Purpose-built link-in-bio platform for real estate agents with property galleries, lead capture, calendar booking, and MLS compliance.',
      url: 'https://agentbio.net',
      price: '39',
      rating: '4.8',
    },
  },
} as const;

/**
 * Get the base URL - handles SSR and client-side rendering
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return SEO_CONFIG.siteUrl;
};

/**
 * Generate canonical URL from path
 */
export const getCanonicalUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Generate OG image URL
 */
export const getOgImageUrl = (imagePath?: string): string => {
  const baseUrl = getBaseUrl();
  const path = imagePath || SEO_CONFIG.defaultImage;
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
