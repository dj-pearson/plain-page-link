/**
 * Link Strategy Analyzer
 * Provides detailed analysis and recommendations for bio link setup
 */

import { BioAnalysisInput, LinkStrategyAnalysis } from './types';

export function analyzeLinkStrategy(input: BioAnalysisInput): LinkStrategyAnalysis {
  const situation = input.linkSituation;

  const analyses: Record<typeof situation, LinkStrategyAnalysis> = {
    'linktree': {
      currentDiagnosis: "You're using Linktree, which is a decent start but has significant limitations for real estate agents. Linktree doesn't capture lead information, lacks real estate-specific features like listing showcases, and provides limited analytics. Most importantly, it doesn't integrate with your MLS or CRM, and the generic design doesn't reinforce your professional brand.",
      leadsLost: 45,
      recommendedStructure: [
        "Featured listing showcase (auto-updated from MLS)",
        "Home valuation calculator with lead capture",
        "Buyer/seller resource downloads (captures emails)",
        "Direct booking link for consultations",
        "Testimonials section for social proof",
        "Contact methods (call, text, email)",
        "Social media cross-links"
      ],
      priorityOrder: [
        "1. Lead capture forms (home valuation, buyer consultation)",
        "2. Active listings with high-quality photos",
        "3. Free resources (neighborhood guides, buyer's guide)",
        "4. Social proof (testimonials, recent sales)",
        "5. Direct contact options",
        "6. About/bio section"
      ],
      trackingRecommendations: [
        "Track which links get the most clicks",
        "Monitor conversion rate from click to lead",
        "A/B test different CTA copy",
        "Track geographic data to understand your audience",
        "Monitor which listings generate most interest",
        "Set up UTM parameters for traffic sources"
      ]
    },
    'website': {
      currentDiagnosis: "Linking directly to your website is better than nothing, but you're missing the opportunity for multiple calls-to-action. Most visitors won't navigate through your entire website - they want quick, specific options. A link-in-bio gives you a 'hub' where visitors can choose their own journey: view listings, get a valuation, download a guide, or contact you directly.",
      leadsLost: 35,
      recommendedStructure: [
        "Multiple CTAs (not just one website link)",
        "Specific landing pages for different needs",
        "Lead magnets (free valuations, guides)",
        "Featured listings separate from main website",
        "Quick contact options without website navigation",
        "Testimonial highlights",
        "Neighborhood expertise showcase"
      ],
      priorityOrder: [
        "1. High-converting lead magnets (home value, buyer guide)",
        "2. Featured listings with direct inquiry forms",
        "3. About/credentials page",
        "4. Resources and tools",
        "5. Main website link",
        "6. Social media links"
      ],
      trackingRecommendations: [
        "Track which CTAs perform best",
        "Monitor time to conversion from click",
        "Test different offer types (valuation vs guide)",
        "Track mobile vs desktop performance",
        "Monitor bounce rate on different landing pages",
        "Measure impact of different listing photos"
      ]
    },
    'dm-only': {
      currentDiagnosis: "Critical issue: You have no link in your bio, forcing people to DM you. This is costing you 70%+ of potential leads. Modern consumers prefer clicking to get information rather than sending a DM and waiting for a response. You're creating unnecessary friction in your conversion funnel. Many high-intent leads will simply move on to an agent who makes it easier to take action.",
      leadsLost: 75,
      recommendedStructure: [
        "ADD A LINK IMMEDIATELY - This is urgent",
        "Start with a simple link-in-bio tool (even basic is better than nothing)",
        "Minimum: Home valuation form, contact info, listings",
        "Lead capture for every interaction",
        "Multiple ways to reach you (not just DM)",
        "Resources that provide value and capture emails",
        "Clear CTAs for different buyer/seller needs"
      ],
      priorityOrder: [
        "1. Set up link-in-bio tool TODAY",
        "2. Add home valuation form (biggest lead generator)",
        "3. Add direct contact options (phone, text, email)",
        "4. Add featured listings",
        "5. Add free resource downloads",
        "6. Add booking calendar for consultations"
      ],
      trackingRecommendations: [
        "Start tracking ANY clicks (baseline data)",
        "Monitor lead capture rate",
        "Track which lead magnets work best",
        "Set up Google Analytics on all landing pages",
        "Monitor conversion funnel from Instagram to lead",
        "Compare DM volume before/after adding link"
      ]
    },
    'multiple-posts': {
      currentDiagnosis: "Having multiple 'link in bio' comments across different posts creates confusion and looks unprofessional. Visitors have to hunt through your posts to find the right link, and many will give up. This scattered approach also makes it impossible to track what's working. You need one centralized, professional link-in-bio that serves as your Instagram homepage.",
      leadsLost: 60,
      recommendedStructure: [
        "ONE centralized link-in-bio hub",
        "All links organized in clear categories",
        "Professional, branded appearance",
        "Easy navigation without scrolling through posts",
        "Lead capture integrated throughout",
        "Dynamic content that auto-updates",
        "Mobile-optimized (most IG traffic is mobile)"
      ],
      priorityOrder: [
        "1. Consolidate ALL links into one link-in-bio",
        "2. Organize by user intent (buying, selling, browsing)",
        "3. Add lead capture to most popular content",
        "4. Remove scattered link comments from posts",
        "5. Update bio to direct to ONE link",
        "6. Track performance centrally"
      ],
      trackingRecommendations: [
        "Track which previous links got most engagement",
        "Monitor improvement after consolidation",
        "Test different organizational structures",
        "Track drop-off points in your funnel",
        "Monitor which categories get most clicks",
        "Compare conversion rate before/after consolidation"
      ]
    },
    'nothing': {
      currentDiagnosis: "CRITICAL: You have absolutely no way for Instagram followers to take action beyond DMing you or commenting. This is an emergency situation - you're losing 85-90% of potential leads. Every day without a link costs you real business. Top-performing agents get 5-15 leads per month from Instagram; you're getting close to zero. This needs to be fixed immediately.",
      leadsLost: 90,
      recommendedStructure: [
        "URGENT: Set up a link-in-bio tool TODAY",
        "Minimum viable setup: Contact info + home valuation",
        "Then add: Featured listings, resources, about page",
        "Lead capture forms on every section",
        "Multiple contact methods (remove all friction)",
        "Clear value propositions for visiting",
        "Professional design that builds trust"
      ],
      priorityOrder: [
        "1. CREATE LINK-IN-BIO IMMEDIATELY (within 24 hours)",
        "2. Add home valuation form (proven lead generator)",
        "3. Add direct contact options with click-to-call",
        "4. Add one featured listing",
        "5. Add short about section with credentials",
        "6. Add at least one free resource download"
      ],
      trackingRecommendations: [
        "Set up basic analytics immediately",
        "Track total clicks as baseline",
        "Monitor lead capture rate",
        "Track traffic sources (bio vs stories vs posts)",
        "Set up goal tracking in Google Analytics",
        "Monitor ROI: clicks → leads → closings"
      ]
    }
  };

  return analyses[situation];
}

/**
 * Calculate potential lead loss in actual numbers
 */
export function calculateLeadLoss(input: BioAnalysisInput, linkAnalysis: LinkStrategyAnalysis): {
  currentMonthlyLeads: number;
  potentialMonthlyLeads: number;
  leadsLost: number;
  annualValue: number;
} {
  // Parse current monthly leads
  const currentLeadsMap: Record<string, number> = {
    '0': 0,
    '1-3': 2,
    '4-10': 7,
    '10+': 12
  };
  const currentMonthlyLeads = currentLeadsMap[input.monthlyLeads] || 0;

  // Calculate potential based on follower count and optimized bio
  const followerMap: Record<string, number> = {
    '<500': 250,
    '500-2K': 1250,
    '2K-5K': 3500,
    '5K-10K': 7500,
    '10K+': 15000
  };
  const followers = followerMap[input.followerCount] || 250;

  // Industry benchmark: 2-3% of followers should convert to profile visits per month
  // Of those, 15-20% should click bio link
  // Of those, 10-15% should convert to leads
  const monthlyProfileVisits = followers * 0.025;
  const potentialClicks = monthlyProfileVisits * 0.18;
  const potentialLeads = potentialClicks * 0.12;

  // Adjust for current link strategy
  const optimizedLeads = Math.round(potentialLeads * (1 - (linkAnalysis.leadsLost / 100)));

  // Calculate annual value
  // Average real estate deal: $300k home, 3% commission = $9k
  // Average agent close rate from lead: 2-5%
  const avgCommission = 9000;
  const closeRate = 0.03;
  const annualLeadsLost = (potentialLeads - currentMonthlyLeads) * 12;
  const annualValue = Math.round(annualLeadsLost * closeRate * avgCommission);

  return {
    currentMonthlyLeads,
    potentialMonthlyLeads: Math.round(potentialLeads),
    leadsLost: Math.round(potentialLeads - currentMonthlyLeads),
    annualValue
  };
}

/**
 * Get recommended link-in-bio features based on agent profile
 */
export function getRecommendedFeatures(input: BioAnalysisInput): {
  essential: string[];
  recommended: string[];
  advanced: string[];
} {
  const essential = [
    "Home Valuation Tool (captures seller leads)",
    "Contact Form with SMS/email options",
    "Featured Listings Showcase",
    "Click-to-call and click-to-text buttons",
    "Professional headshot and bio"
  ];

  const recommended = [
    "Testimonials/Reviews section",
    "Free Buyer's/Seller's Guide downloads",
    "Neighborhood expertise pages",
    "Recent sales/success stories",
    "Video introduction",
    "Social media links"
  ];

  const advanced = [
    "MLS integration (auto-update listings)",
    "CRM integration (auto-capture leads)",
    "Advanced analytics and heatmaps",
    "A/B testing for CTAs",
    "QR code generator for offline marketing",
    "Custom domain (yourname.com)",
    "Appointment scheduling integration"
  ];

  // Customize based on primary goal
  if (input.primaryGoal === 'seller-leads') {
    essential.unshift("Home Valuation Tool (PRIORITY #1)");
    recommended.unshift("Comparative Market Analysis (CMA) request form");
  } else if (input.primaryGoal === 'buyer-leads') {
    essential.splice(1, 0, "Buyer Consultation Booking");
    recommended.unshift("Mortgage calculator");
  }

  return { essential, recommended, advanced };
}
