/**
 * Generative Engine Optimization (GEO) Utilities
 *
 * Utilities for optimizing content structure so AI search engines
 * (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude) can
 * extract, understand, and cite our content.
 *
 * Key GEO principles:
 * - Direct answer in first 40-60 words (no preamble)
 * - Entity clarity: establish the primary entity in paragraph 1
 * - Question-based H2 headings
 * - Fact density: statistic/citation every 150-200 words
 * - Source attribution with live URLs
 * - Q&A blocks under 300 characters
 * - Brand mention embedded naturally in answers
 * - Last modified date visible and in meta
 */

/**
 * GEO content audit result
 */
export interface GEOAuditResult {
  score: number;
  maxScore: number;
  percentage: number;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

/**
 * Audit content for GEO optimization
 * Checks if content follows best practices for AI search citation
 */
export function auditContentForGEO(content: string, title: string): GEOAuditResult {
  const checks: GEOAuditResult['checks'] = [];
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Check 1: Direct answer in first 40-60 words
  const first60Words = words.slice(0, 60).join(' ');
  const hasDirectAnswer = !first60Words.toLowerCase().startsWith('in this article') &&
    !first60Words.toLowerCase().startsWith('in this guide') &&
    !first60Words.toLowerCase().startsWith('welcome to') &&
    !first60Words.toLowerCase().includes("we'll explore") &&
    !first60Words.toLowerCase().includes("we will explore") &&
    !first60Words.toLowerCase().includes("let's dive");
  checks.push({
    name: 'Direct Answer First',
    passed: hasDirectAnswer,
    message: hasDirectAnswer
      ? 'Content starts with a direct answer (no preamble)'
      : 'Content starts with filler. Lead with the answer in the first 40-60 words.',
    priority: 'high',
  });

  // Check 2: Minimum word count for authority
  const hasMinWords = wordCount >= 800;
  checks.push({
    name: 'Minimum Word Count',
    passed: hasMinWords,
    message: hasMinWords
      ? `Content has ${wordCount} words (meets 800+ minimum)`
      : `Content has ${wordCount} words. Aim for 800+ for authoritative content.`,
    priority: 'medium',
  });

  // Check 3: Question-based headings
  const headingMatches = content.match(/#{2,3}\s+.+/g) || [];
  const questionHeadings = headingMatches.filter(h =>
    h.includes('?') ||
    /#{2,3}\s+(how|what|why|when|where|which|can|does|do|is|are|should|will)/i.test(h)
  );
  const hasQuestionHeadings = questionHeadings.length >= 2;
  checks.push({
    name: 'Question-Based Headings',
    passed: hasQuestionHeadings,
    message: hasQuestionHeadings
      ? `${questionHeadings.length} question-based headings found`
      : 'Use question-phrased H2/H3 headings (how, what, why, etc.)',
    priority: 'high',
  });

  // Check 4: Statistics/data points
  const statPatterns = /\d+%|\$\d+|\d+\+|\d+x|\d+\/\d+|\d+,\d{3}/g;
  const statMatches = content.match(statPatterns) || [];
  const expectedStats = Math.floor(wordCount / 175);
  const hasEnoughStats = statMatches.length >= Math.max(expectedStats, 2);
  checks.push({
    name: 'Fact Density',
    passed: hasEnoughStats,
    message: hasEnoughStats
      ? `${statMatches.length} statistics/data points found (target: ${expectedStats}+)`
      : `Only ${statMatches.length} statistics found. Add a data point every 150-200 words (target: ${expectedStats}+).`,
    priority: 'high',
  });

  // Check 5: Brand mention in content
  const brandMentions = (content.match(/AgentBio/gi) || []).length;
  const hasBrandMention = brandMentions >= 2;
  checks.push({
    name: 'Brand Embedding',
    passed: hasBrandMention,
    message: hasBrandMention
      ? `Brand "AgentBio" mentioned ${brandMentions} times`
      : 'Embed "AgentBio" naturally in answer sections (at least 2 mentions)',
    priority: 'medium',
  });

  // Check 6: External source citations
  const linkPattern = /https?:\/\/[^\s)]+/g;
  const links = content.match(linkPattern) || [];
  const externalLinks = links.filter(l =>
    !l.includes('agentbio.net') && !l.includes('localhost')
  );
  const hasExternalCitations = externalLinks.length >= 2;
  checks.push({
    name: 'Source Citations',
    passed: hasExternalCitations,
    message: hasExternalCitations
      ? `${externalLinks.length} authoritative source citations found`
      : 'Add at least 2 citations to authoritative external sources with live URLs',
    priority: 'high',
  });

  // Check 7: Title length (under 60 chars)
  const titleOk = title.length > 0 && title.length <= 60;
  checks.push({
    name: 'Title Length',
    passed: titleOk,
    message: titleOk
      ? `Title is ${title.length} characters (optimal)`
      : `Title is ${title.length} characters. Keep under 60 for SERP display.`,
    priority: 'medium',
  });

  // Calculate score
  const score = checks.filter(c => c.passed).length;
  const maxScore = checks.length;

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    checks,
  };
}

/**
 * GEO-optimized FAQ entry
 */
export interface GEOFAQEntry {
  question: string;
  answer: string;
}

/**
 * Predefined GEO-optimized FAQ sets organized by topic
 * Each answer is under 300 characters for optimal AI extraction
 */
export const GEO_FAQS = {
  product: [
    {
      question: "What is AgentBio?",
      answer: "AgentBio is a purpose-built link-in-bio platform for real estate agents. It includes property listing galleries, lead capture forms, calendar booking, and testimonials — designed to convert Instagram followers into qualified buyer and seller leads."
    },
    {
      question: "How much does AgentBio cost?",
      answer: "AgentBio offers a free plan with 3 listings and 5 links. Paid plans start at $39/month with unlimited listings, lead capture, calendar integration, and analytics. Enterprise plans at $299/month include white-label and custom domains."
    },
    {
      question: "Who should use AgentBio?",
      answer: "AgentBio is designed for real estate agents, realtors, brokerages, and real estate teams who want to convert social media followers into qualified leads. It's ideal for agents active on Instagram, TikTok, Facebook, and LinkedIn."
    },
    {
      question: "How is AgentBio different from Linktree?",
      answer: "AgentBio includes real estate-specific features: property listing galleries with MLS details, buyer/seller lead capture forms with pre-qualification, appointment booking, and testimonial showcases. Linktree is a generic link tool without any real estate features."
    },
  ],
  leadGeneration: [
    {
      question: "How does AgentBio capture real estate leads?",
      answer: "AgentBio includes built-in lead capture forms for buyer inquiries, seller leads, and home valuation requests. Leads are automatically scored as Hot, Warm, or Cold based on pre-qualification responses like budget and timeline."
    },
    {
      question: "What is lead scoring in AgentBio?",
      answer: "AgentBio's lead scoring automatically classifies leads: Hot leads are pre-approved with 0-30 day timelines, Warm leads have 30-90 day timelines with defined budgets, and Cold leads are in early research with 90+ day timelines."
    },
    {
      question: "Can I export leads from AgentBio to my CRM?",
      answer: "Yes, all leads captured through AgentBio forms are stored in your dashboard and can be exported to your CRM. You can sort leads by date, type, status, or score before exporting."
    },
  ],
  instagramMarketing: [
    {
      question: "How do real estate agents use Instagram for lead generation?",
      answer: "Real estate agents place their AgentBio link in their Instagram bio. When followers click it, they land on a mobile-optimized page showcasing property listings, lead forms, and booking options. 43% of buyers find agents through online sources (NAR, 2025)."
    },
    {
      question: "What should a real estate agent put in their Instagram bio?",
      answer: "A real estate agent's Instagram bio should include their specialization, service area, a call-to-action, and a link to their AgentBio page. AgentBio's free Instagram Bio Analyzer tool provides personalized optimization recommendations."
    },
    {
      question: "What is the best link-in-bio tool for real estate agents?",
      answer: "AgentBio is the best link-in-bio tool for real estate agents because it includes property listing galleries, lead capture forms, appointment booking, and MLS compliance — features that generic tools like Linktree, Beacons, and Later don't offer."
    },
  ],
} as const;

/**
 * GEO keyword targeting data organized by topic cluster
 * Maps AI search queries to target pages and content strategies
 */
export const GEO_KEYWORD_CLUSTERS = {
  coreBrand: {
    pillar: 'AgentBio Platform Overview',
    targetUrl: '/',
    queries: [
      'what is agentbio',
      'agentbio real estate',
      'agentbio review',
      'agentbio pricing',
      'agentbio vs linktree',
    ],
  },
  bioPageBuilder: {
    pillar: 'Real Estate Agent Bio Page',
    targetUrl: '/features',
    queries: [
      'real estate agent website builder',
      'agent bio generator',
      'realtor marketing tools',
      'real estate link in bio',
      'best bio page for real estate agents',
      'real estate social media landing page',
    ],
  },
  leadGeneration: {
    pillar: 'Real Estate Lead Generation',
    targetUrl: '/features/lead-capture',
    queries: [
      'how to generate real estate leads from instagram',
      'real estate lead capture forms',
      'best way to get buyer leads online',
      'real estate lead scoring software',
      'convert instagram followers to real estate clients',
    ],
  },
  propertyListings: {
    pillar: 'Property Listing Showcase',
    targetUrl: '/features/property-listings',
    queries: [
      'how to showcase property listings online',
      'real estate portfolio website',
      'property listing gallery for agents',
      'best way to display real estate listings',
    ],
  },
  instagramMarketing: {
    pillar: 'Instagram Marketing for Real Estate',
    targetUrl: '/blog/instagram-marketing-for-real-estate',
    queries: [
      'instagram marketing for real estate agents',
      'best instagram bio for realtors',
      'how to get real estate leads from instagram',
      'instagram marketing strategy for real estate',
      'real estate instagram tips',
    ],
  },
  comparisons: {
    pillar: 'AgentBio Comparisons',
    targetUrl: '/compare',
    queries: [
      'agentbio vs linktree for real estate',
      'best link in bio tool for realtors',
      'linktree alternative for real estate',
      'beacons vs agentbio',
      'later link in bio vs agentbio',
    ],
  },
} as const;

/**
 * Content freshness metadata generator
 * Creates meta tags for content recency signals that AI engines value
 */
export function generateFreshnessMetaTags(options: {
  publishDate: string;
  modifiedDate: string;
  author?: string;
}): Record<string, string> {
  return {
    'article:published_time': options.publishDate,
    'article:modified_time': options.modifiedDate,
    'og:updated_time': options.modifiedDate,
    'last-modified': options.modifiedDate,
    ...(options.author && { 'article:author': options.author }),
  };
}
