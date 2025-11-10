/**
 * Bio Scoring Algorithm
 * Analyzes Instagram bios across 6 key categories
 */

import { BioAnalysisInput, CategoryScore, BioAnalysisResult } from './types';

const REAL_ESTATE_KEYWORDS = ['realtor', 'agent', 'broker', 'real estate', 'realty', 'properties', 'homes', 'luxury', 'residential', 'commercial'];
const GENERIC_PHRASES = ['helping you find', 'dream home', 'making dreams', 'here to help', 'your next home', 'let me help'];
const CTA_KEYWORDS = ['dm me', 'click', 'link below', 'contact', 'call', 'text', 'visit', 'schedule', 'book', 'download', 'get', 'start'];
const TRUST_INDICATORS = ['years', 'award', 'top', 'certified', 'licensed', 'expert', 'specialist', 'million', 'sold', '#1'];

/**
 * Clarity Score (20 points)
 * Evaluates if it's immediately clear what the agent does
 */
function scoreClarity(input: BioAnalysisInput): CategoryScore {
  const bio = input.currentBio.toLowerCase();
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  const examples: string[] = [];

  // Check for real estate keywords (10 points)
  const hasRealEstateKeyword = REAL_ESTATE_KEYWORDS.some(keyword => bio.includes(keyword));
  if (hasRealEstateKeyword) {
    score += 10;
  } else {
    issues.push("Bio doesn't clearly mention you're a real estate professional");
    recommendations.push("Add 'Real Estate Agent', 'Realtor', or similar to your bio");
    examples.push("🏡 Real Estate Agent | Miami, FL");
  }

  // Check for location mention (5 points)
  const hasLocation = bio.includes(input.city.toLowerCase()) ||
                       bio.includes(input.state.toLowerCase()) ||
                       bio.includes(input.location.toLowerCase());
  if (hasLocation) {
    score += 5;
  } else {
    issues.push("Location not mentioned in bio");
    recommendations.push(`Include "${input.city}" or "${input.state}" to establish local presence`);
    examples.push(`Helping families in ${input.city} find their perfect home`);
  }

  // Check for specialty mention (5 points)
  if (input.primaryFocus.length > 0 && input.primaryFocus.some(focus => bio.includes(focus.toLowerCase()))) {
    score += 5;
  } else {
    issues.push("Your specialty or focus area isn't clear");
    recommendations.push(`Mention your specialty: ${input.primaryFocus.join(', ')}`);
    examples.push("Luxury Home Specialist | Waterfront Properties");
  }

  const impact = score < 10 ?
    "Critical: Visitors don't understand what you do. You're losing 70%+ of potential leads." :
    score < 15 ?
    "Moderate: Some confusion about your services. Losing 30-40% of potential engagement." :
    "Good: Bio clearly communicates your role and expertise.";

  return {
    score,
    maxScore: 20,
    issues,
    recommendations,
    examples,
    impact
  };
}

/**
 * Differentiation Score (20 points)
 * Evaluates if the bio stands out from generic agent bios
 */
function scoreDifferentiation(input: BioAnalysisInput): CategoryScore {
  const bio = input.currentBio.toLowerCase();
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  const examples: string[] = [];

  // Check for generic phrases (penalize)
  const genericCount = GENERIC_PHRASES.filter(phrase => bio.includes(phrase)).length;
  if (genericCount === 0) {
    score += 10;
  } else {
    issues.push(`Using ${genericCount} generic phrase(s) that ${(genericCount * 30).toFixed(0)}% of agents use`);
    recommendations.push("Replace generic phrases with specific value propositions");
    examples.push("Instead of 'Helping you find your dream home', try 'Sold 200+ homes in [City] | Avg. 18 days to close'");
  }

  // Check for unique value proposition (10 points)
  const hasStats = /\d+/.test(bio); // Has any numbers
  const hasUniqueAngle = bio.length > 50 && !bio.includes('helping'); // Longer and not using "helping"

  if (hasStats && hasUniqueAngle) {
    score += 10;
  } else if (hasStats || hasUniqueAngle) {
    score += 5;
    issues.push("Bio could be more specific and unique");
    recommendations.push("Add specific stats, credentials, or unique selling points");
    examples.push("15 years exp. | 500+ families helped | Certified Negotiation Expert");
  } else {
    issues.push("Bio is too generic - sounds like every other agent");
    recommendations.push("Differentiate yourself with specific achievements or specialties");
    examples.push("Former architect turned realtor | Design-savvy home finder");
  }

  const impact = score < 10 ?
    "Critical: You blend in with 1M+ other agents on Instagram. No reason to choose you." :
    score < 15 ?
    "Moderate: Some differentiation but not compelling enough to stand out." :
    "Good: Bio has unique elements that make you memorable.";

  return {
    score,
    maxScore: 20,
    issues,
    recommendations,
    examples,
    impact
  };
}

/**
 * Call-to-Action Score (20 points)
 * Evaluates if there's a clear next step for followers
 */
function scoreCallToAction(input: BioAnalysisInput): CategoryScore {
  const bio = input.currentBio.toLowerCase();
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  const examples: string[] = [];

  // Check for CTA presence (10 points)
  const hasCTA = CTA_KEYWORDS.some(keyword => bio.includes(keyword));
  if (hasCTA) {
    score += 10;
  } else {
    issues.push("No clear call-to-action in bio");
    recommendations.push("Tell people what to do next: DM, click link, call, etc.");
    examples.push("📲 DM 'SELLING' for free home valuation");
  }

  // Check for link mention (5 points)
  const mentionsLink = bio.includes('link') || bio.includes('below') || bio.includes('👇') || bio.includes('⬇️');
  if (mentionsLink) {
    score += 5;
  } else {
    issues.push("Link in bio not called out");
    recommendations.push("Draw attention to your bio link");
    examples.push("👇 Free buyer's guide in link below");
  }

  // Check for specific, actionable CTA (5 points)
  const hasSpecificCTA = /dm|text|call \d|click|download|get your|schedule/.test(bio);
  if (hasSpecificCTA) {
    score += 5;
  } else {
    issues.push("CTA is vague or missing");
    recommendations.push("Make your CTA specific and action-oriented");
    examples.push("Click link for instant home value estimate 🏡");
  }

  const impact = score < 10 ?
    "Critical: Followers don't know what to do next. 80% bounce without taking action." :
    score < 15 ?
    "Moderate: Some direction but not compelling. Losing 40-50% of potential leads." :
    "Good: Clear CTA guides followers to take action.";

  return {
    score,
    maxScore: 20,
    issues,
    recommendations,
    examples,
    impact
  };
}

/**
 * Local Authority Score (15 points)
 * Evaluates local market expertise signals
 */
function scoreLocalAuthority(input: BioAnalysisInput): CategoryScore {
  const bio = input.currentBio.toLowerCase();
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  const examples: string[] = [];

  // Check for city name (8 points)
  if (bio.includes(input.city.toLowerCase())) {
    score += 8;
  } else {
    issues.push("City name not in bio");
    recommendations.push(`Add "${input.city}" to establish local authority`);
    examples.push(`${input.city}'s Trusted Real Estate Expert`);
  }

  // Check for neighborhood/area expertise (7 points)
  const neighborhoodKeywords = ['local', 'neighborhood', 'community', 'downtown', 'waterfront', 'suburb'];
  if (neighborhoodKeywords.some(keyword => bio.includes(keyword))) {
    score += 7;
  } else {
    issues.push("No neighborhood or area expertise mentioned");
    recommendations.push("Mention specific neighborhoods or areas you specialize in");
    examples.push("Downtown & Waterfront specialist | Local expert since 2015");
  }

  const impact = score < 8 ?
    "Critical: Followers don't see you as a local expert. Missing 60% of local search traffic." :
    score < 12 ?
    "Moderate: Some local signals but not strong enough." :
    "Good: Strong local authority established.";

  return {
    score,
    maxScore: 15,
    issues,
    recommendations,
    examples,
    impact
  };
}

/**
 * Trust Signals Score (15 points)
 * Evaluates credentials, experience, and social proof
 */
function scoreTrustSignals(input: BioAnalysisInput): CategoryScore {
  const bio = input.currentBio.toLowerCase();
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  const examples: string[] = [];

  // Check for trust indicators (10 points)
  const trustCount = TRUST_INDICATORS.filter(indicator => bio.includes(indicator)).length;
  score += Math.min(trustCount * 3, 10);

  if (trustCount === 0) {
    issues.push("No credentials, awards, or experience mentioned");
    recommendations.push("Add trust signals: years of experience, awards, certifications");
    examples.push("15+ years exp. | Top 1% Agent | Multi-Million Dollar Producer");
  }

  // Check for social proof (5 points)
  const hasSocialProof = /\d+\s*(families|clients|homes|sales|sold)/.test(bio);
  if (hasSocialProof) {
    score += 5;
  } else {
    issues.push("No social proof or client results");
    recommendations.push("Add specific numbers: homes sold, families helped, etc.");
    examples.push("500+ happy families | $50M+ in sales");
  }

  const impact = score < 8 ?
    "Critical: No reason to trust you over competitors. Conversion rate 70% lower." :
    score < 12 ?
    "Moderate: Some trust signals but need more credibility markers." :
    "Good: Strong trust signals build confidence.";

  return {
    score,
    maxScore: 15,
    issues,
    recommendations,
    examples,
    impact
  };
}

/**
 * Link Strategy Score (10 points)
 * Evaluates current link setup effectiveness
 */
function scoreLinkStrategy(input: BioAnalysisInput): CategoryScore {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  const examples: string[] = [];

  switch (input.linkSituation) {
    case 'linktree':
      score = 6;
      issues.push("Linktree is generic and doesn't capture leads or track effectively");
      recommendations.push("Upgrade to AgentBio for real estate-specific link-in-bio with lead capture");
      examples.push("AgentBio captures 3X more leads than Linktree for agents");
      break;
    case 'website':
      score = 7;
      issues.push("Direct website link is good but misses opportunity for multiple CTAs");
      recommendations.push("Use a link-in-bio tool to showcase listings, capture leads, and track clicks");
      examples.push("Add listing showcase, home valuation, and contact options");
      break;
    case 'dm-only':
      score = 3;
      issues.push("No link = losing 70%+ of potential leads who won't DM");
      recommendations.push("Add a link-in-bio immediately - you're losing most opportunities");
      examples.push("People prefer clicking over DMing. Make it easy!");
      break;
    case 'multiple-posts':
      score = 2;
      issues.push("Scattered links in posts = confusion and lost leads");
      recommendations.push("Centralize all links in one professional link-in-bio");
      examples.push("One link, organized sections, professional presentation");
      break;
    case 'nothing':
      score = 0;
      issues.push("No link or way to contact = missing 90%+ of opportunities");
      recommendations.push("Add link-in-bio TODAY - this is critical");
      examples.push("Every day without a link costs you potential deals");
      break;
  }

  // Bonus for mentioning link in bio
  const bio = input.currentBio.toLowerCase();
  if (bio.includes('link')) {
    score += 2;
  }

  // Cap at 10
  score = Math.min(score, 10);

  const impact = score < 5 ?
    "Critical: Your link strategy is costing you 60-80% of potential leads." :
    score < 8 ?
    "Moderate: Link setup works but missing opportunities for optimization." :
    "Good: Solid link strategy, minor improvements possible.";

  return {
    score,
    maxScore: 10,
    issues,
    recommendations,
    examples,
    impact
  };
}

/**
 * Main scoring function
 */
export function analyzeBio(input: BioAnalysisInput): BioAnalysisResult {
  const clarity = scoreClarity(input);
  const differentiation = scoreDifferentiation(input);
  const callToAction = scoreCallToAction(input);
  const localAuthority = scoreLocalAuthority(input);
  const trustSignals = scoreTrustSignals(input);
  const linkStrategy = scoreLinkStrategy(input);

  const overallScore =
    clarity.score +
    differentiation.score +
    callToAction.score +
    localAuthority.score +
    trustSignals.score +
    linkStrategy.score;

  // Calculate competitive analysis
  const missingElements: string[] = [];
  if (clarity.score < 15) missingElements.push("Clear role/specialty");
  if (differentiation.score < 15) missingElements.push("Unique value proposition");
  if (callToAction.score < 15) missingElements.push("Strong call-to-action");
  if (localAuthority.score < 10) missingElements.push("Local market authority");
  if (trustSignals.score < 10) missingElements.push("Trust signals/credentials");
  if (linkStrategy.score < 7) missingElements.push("Optimized link strategy");

  const conversionPotential = Math.round((overallScore / 100) * 100);

  return {
    overallScore,
    categoryScores: {
      clarity,
      differentiation,
      callToAction,
      localAuthority,
      trustSignals,
      linkStrategy
    },
    competitiveAnalysis: {
      vsTopPerformers: getCompetitiveComparison(overallScore),
      missingElements,
      conversionPotential
    },
    rewrittenBios: [], // Will be populated by bio generator
    timestamp: new Date().toISOString()
  };
}

function getCompetitiveComparison(score: number): string {
  if (score >= 85) {
    return "Your bio is in the top 5% of real estate agents on Instagram. Excellent work!";
  } else if (score >= 70) {
    return "Your bio is above average but top-performing agents score 15-20 points higher.";
  } else if (score >= 50) {
    return "Your bio is average. Top agents in your market likely score 30-40 points higher.";
  } else {
    return "Your bio is below average. Top performers in your area score 50+ points higher, which translates to 3-5X more leads.";
  }
}

/**
 * Get grade from score
 */
export function getScoreGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 90) {
    return { grade: 'A+', color: '#10b981', label: 'Excellent' };
  } else if (score >= 80) {
    return { grade: 'A', color: '#22c55e', label: 'Very Good' };
  } else if (score >= 70) {
    return { grade: 'B', color: '#84cc16', label: 'Good' };
  } else if (score >= 60) {
    return { grade: 'C', color: '#eab308', label: 'Average' };
  } else if (score >= 50) {
    return { grade: 'D', color: '#f59e0b', label: 'Below Average' };
  } else {
    return { grade: 'F', color: '#ef4444', label: 'Poor' };
  }
}
