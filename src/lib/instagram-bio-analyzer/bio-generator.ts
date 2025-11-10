/**
 * Bio Rewrite Generator
 * Creates 3 optimized bio versions in different styles
 */

import { BioAnalysisInput, BioRewrite } from './types';

const EMOJI_MAP = {
  home: '🏡',
  key: '🔑',
  location: '📍',
  phone: '📱',
  email: '📧',
  award: '🏆',
  star: '⭐',
  chart: '📈',
  handshake: '🤝',
  check: '✅',
  point_down: '👇',
  sparkles: '✨',
  house: '🏠',
  building: '🏢',
  sunset: '🌅',
  dollar: '💰',
  trophy: '🏆',
  crown: '👑',
  rocket: '🚀'
};

interface BioTemplate {
  style: 'professional' | 'friendly' | 'problem-solver';
  title: string;
  description: string;
  structure: (input: BioAnalysisInput) => string;
}

const PROFESSIONAL_TEMPLATE: BioTemplate = {
  style: 'professional',
  title: 'Professional Authority',
  description: 'Establishes credibility with credentials and results',
  structure: (input: BioAnalysisInput) => {
    const parts: string[] = [];

    // Title line
    const specialties = input.primaryFocus.slice(0, 2).join(' & ');
    parts.push(`${EMOJI_MAP.home} ${specialties || 'Real Estate'} Specialist`);

    // Location
    parts.push(`${EMOJI_MAP.location} ${input.city}, ${input.state}`);

    // Experience & credentials
    const expText = getExperienceText(input.yearsExperience);
    if (expText) {
      parts.push(`${EMOJI_MAP.award} ${expText}`);
    }

    // CTA based on goal
    const cta = getCallToAction(input.primaryGoal);
    parts.push(`${EMOJI_MAP.point_down} ${cta}`);

    return parts.join(' | ');
  }
};

const FRIENDLY_TEMPLATE: BioTemplate = {
  style: 'friendly',
  title: 'Friendly Local Expert',
  description: 'Approachable and community-focused tone',
  structure: (input: BioAnalysisInput) => {
    const parts: string[] = [];

    // Friendly intro
    parts.push(`${EMOJI_MAP.key} Your ${input.city} Real Estate Guide`);

    // Personal touch
    const focus = input.primaryFocus[0] || 'families';
    parts.push(`${EMOJI_MAP.handshake} Helping ${getFocusAudience(focus)} since ${getYearStarted(input.yearsExperience)}`);

    // CTA
    const cta = getFriendlyCTA(input.primaryGoal);
    parts.push(`${EMOJI_MAP.sparkles} ${cta}`);

    return parts.join('\n');
  }
};

const PROBLEM_SOLVER_TEMPLATE: BioTemplate = {
  style: 'problem-solver',
  title: 'Problem-Solving Specialist',
  description: 'Focuses on solutions and specific results',
  structure: (input: BioAnalysisInput) => {
    const parts: string[] = [];

    // Problem statement
    const problem = getProblemStatement(input.primaryGoal);
    parts.push(problem);

    // Solution
    parts.push(`${EMOJI_MAP.check} ${input.city} Real Estate Expert`);

    // Proof
    const proof = getProofStatement(input.yearsExperience, input.primaryFocus);
    if (proof) {
      parts.push(`${EMOJI_MAP.chart} ${proof}`);
    }

    // CTA
    parts.push(`${EMOJI_MAP.point_down} ${getDirectCTA(input.primaryGoal)}`);

    return parts.join('\n');
  }
};

function getExperienceText(years: string): string {
  switch (years) {
    case '<1':
      return 'Fresh perspective & modern approach';
    case '1-3':
      return '3+ Years Experience';
    case '3-5':
      return '5+ Years Proven Results';
    case '5-10':
      return '10+ Years Market Expertise';
    case '10+':
      return '15+ Years Local Authority';
    default:
      return 'Licensed Real Estate Professional';
  }
}

function getYearStarted(years: string): string {
  const currentYear = new Date().getFullYear();
  switch (years) {
    case '<1':
      return currentYear.toString();
    case '1-3':
      return (currentYear - 2).toString();
    case '3-5':
      return (currentYear - 4).toString();
    case '5-10':
      return (currentYear - 7).toString();
    case '10+':
      return (currentYear - 12).toString();
    default:
      return currentYear.toString();
  }
}

function getFocusAudience(focus: string): string {
  const audienceMap: Record<string, string> = {
    'buyers': 'first-time buyers',
    'sellers': 'home sellers',
    'rentals': 'renters & landlords',
    'luxury': 'luxury clients',
    'first-time-buyers': 'first-time buyers',
    'investment': 'investors'
  };
  return audienceMap[focus.toLowerCase()] || 'families';
}

function getCallToAction(goal: string): string {
  const ctaMap: Record<string, string> = {
    'seller-leads': 'Free home valuation below',
    'buyer-leads': "Buyer's guide in link",
    'brand': 'Market insights & tips below',
    'following': 'Follow for daily tips',
    'referrals': 'Trusted by 500+ families'
  };
  return ctaMap[goal] || 'Click link for listings';
}

function getFriendlyCTA(goal: string): string {
  const ctaMap: Record<string, string> = {
    'seller-leads': "DM 'VALUE' for instant home estimate",
    'buyer-leads': "Let's find your perfect home!",
    'brand': 'Follow for local market insights',
    'following': 'Join our community of homeowners',
    'referrals': "Let's make your real estate goals happen"
  };
  return ctaMap[goal] || "DM me to get started";
}

function getDirectCTA(goal: string): string {
  const ctaMap: Record<string, string> = {
    'seller-leads': "Get your free home value",
    'buyer-leads': "Find homes in your budget",
    'brand': 'Weekly market updates',
    'following': 'Daily real estate tips',
    'referrals': 'Book a free consultation'
  };
  return ctaMap[goal] || 'Link to listings below';
}

function getProblemStatement(goal: string): string {
  const problemMap: Record<string, string> = {
    'seller-leads': `${EMOJI_MAP.house} Want to know what your home is worth?`,
    'buyer-leads': `${EMOJI_MAP.key} Tired of losing out on homes?`,
    'brand': `${EMOJI_MAP.chart} Want insider market knowledge?`,
    'following': `${EMOJI_MAP.sparkles} Want expert real estate advice?`,
    'referrals': `${EMOJI_MAP.handshake} Need a trusted real estate advisor?`
  };
  return problemMap[goal] || `${EMOJI_MAP.home} Looking for expert real estate help?`;
}

function getProofStatement(years: string, focus: string[]): string {
  const isExperienced = years === '5-10' || years === '10+';
  if (isExperienced) {
    if (focus.includes('luxury')) {
      return '$50M+ in luxury sales';
    } else if (focus.includes('investment')) {
      return '200+ investment properties sold';
    } else {
      return '500+ families helped';
    }
  }

  if (focus.includes('first-time-buyers')) {
    return 'First-time buyer specialist';
  } else if (focus.includes('sellers')) {
    return 'Avg. 95% of asking price';
  }

  return 'Proven track record';
}

/**
 * Generate all 3 bio rewrites
 */
export function generateBioRewrites(input: BioAnalysisInput): BioRewrite[] {
  const templates = [PROFESSIONAL_TEMPLATE, FRIENDLY_TEMPLATE, PROBLEM_SOLVER_TEMPLATE];

  return templates.map(template => {
    const bioText = template.structure(input);
    const emojis = extractEmojis(bioText);

    return {
      style: template.style,
      title: template.title,
      bio: bioText,
      characterCount: bioText.length,
      emojis,
      reasoning: template.description
    };
  });
}

/**
 * Generate a custom bio based on specific parameters
 */
export function generateCustomBio(input: BioAnalysisInput, preferences: {
  includeEmojis: boolean;
  includeStats: boolean;
  tone: 'formal' | 'casual' | 'balanced';
}): string {
  const parts: string[] = [];

  // Build custom bio based on preferences
  const emojiPrefix = preferences.includeEmojis ? EMOJI_MAP.home + ' ' : '';

  if (preferences.tone === 'formal') {
    parts.push(`${emojiPrefix}${input.primaryFocus[0] || 'Real Estate'} Professional`);
    parts.push(`${input.city}, ${input.state}`);
    if (preferences.includeStats) {
      parts.push(getExperienceText(input.yearsExperience));
    }
  } else if (preferences.tone === 'casual') {
    parts.push(`${emojiPrefix}Your ${input.city} real estate friend`);
    parts.push(`Making home ${input.primaryGoal === 'buyer-leads' ? 'buying' : 'selling'} easy`);
  } else {
    // Balanced
    parts.push(`${emojiPrefix}${input.city} Real Estate Agent`);
    parts.push(`${input.primaryFocus[0] || 'Residential'} Specialist`);
    if (preferences.includeStats) {
      parts.push(getExperienceText(input.yearsExperience));
    }
  }

  // Add CTA
  const ctaEmoji = preferences.includeEmojis ? EMOJI_MAP.point_down + ' ' : '';
  parts.push(`${ctaEmoji}${getCallToAction(input.primaryGoal)}`);

  return parts.join(' | ');
}

function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  return text.match(emojiRegex) || [];
}

/**
 * Optimize bio length to fit Instagram's 150 character limit
 */
export function optimizeBioLength(bio: string, maxLength: number = 150): string {
  if (bio.length <= maxLength) {
    return bio;
  }

  // Try to trim intelligently at sentence/phrase boundaries
  const parts = bio.split('|').map(p => p.trim());

  let optimized = '';
  for (const part of parts) {
    if ((optimized + ' | ' + part).length <= maxLength) {
      optimized += (optimized ? ' | ' : '') + part;
    } else {
      break;
    }
  }

  // If still too long, hard truncate
  if (optimized.length > maxLength) {
    optimized = optimized.substring(0, maxLength - 3) + '...';
  }

  return optimized;
}

/**
 * Get emoji suggestions for bio enhancement
 */
export function getEmojiSuggestions(input: BioAnalysisInput): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {
    essential: ['🏡', '📍', '🔑'],
    attention: ['👇', '⬇️', '✨'],
    trust: ['⭐', '🏆', '💎'],
    action: ['📱', '📧', '🤝'],
  };

  // Add specialty-specific emojis
  if (input.primaryFocus.includes('luxury')) {
    suggestions.luxury = ['👑', '💎', '🌟'];
  }
  if (input.primaryFocus.includes('investment')) {
    suggestions.investment = ['📈', '💰', '🏢'];
  }

  return suggestions;
}
