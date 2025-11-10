/**
 * Types for Instagram Bio Analyzer Tool
 */

export interface BioAnalysisInput {
  // Section 1 - Current Bio Analysis
  instagramHandle?: string;
  currentBio: string;
  linkSituation: 'linktree' | 'website' | 'dm-only' | 'multiple-posts' | 'nothing';
  profilePicture: 'professional' | 'casual' | 'logo' | 'other';

  // Section 2 - Agent Context
  primaryFocus: string[]; // Can select multiple
  location: string;
  city: string;
  state: string;
  yearsExperience: '<1' | '1-3' | '3-5' | '5-10' | '10+';
  followerCount: '<500' | '500-2K' | '2K-5K' | '5K-10K' | '10K+';
  monthlyLeads: '0' | '1-3' | '4-10' | '10+';

  // Section 3 - Goals
  primaryGoal: 'seller-leads' | 'buyer-leads' | 'brand' | 'following' | 'referrals';
}

export interface CategoryScore {
  score: number; // 0-100
  maxScore: number;
  issues: string[];
  recommendations: string[];
  examples: string[];
  impact: string;
}

export interface BioAnalysisResult {
  overallScore: number; // 0-100
  categoryScores: {
    clarity: CategoryScore;
    differentiation: CategoryScore;
    callToAction: CategoryScore;
    localAuthority: CategoryScore;
    trustSignals: CategoryScore;
    linkStrategy: CategoryScore;
  };
  competitiveAnalysis: {
    vsTopPerformers: string;
    missingElements: string[];
    conversionPotential: number;
  };
  rewrittenBios: BioRewrite[];
  timestamp: string;
}

export interface BioRewrite {
  style: 'professional' | 'friendly' | 'problem-solver';
  title: string;
  bio: string;
  characterCount: number;
  emojis: string[];
  reasoning: string;
}

export interface LinkStrategyAnalysis {
  currentDiagnosis: string;
  leadsLost: number; // Percentage
  recommendedStructure: string[];
  priorityOrder: string[];
  trackingRecommendations: string[];
}

export interface EmailCaptureData {
  email: string;
  firstName: string;
  market: string;
  brokerage?: string;
  analysisId: string;
  capturedAt: string;
}

export interface AnalyticsEvent {
  eventType: 'analyzer_started' | 'analyzer_completed' | 'email_captured' | 'bio_copied' | 'shared' | 'trial_clicked';
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: string;
}
