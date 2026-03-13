/**
 * useMLLeadScoring Hook
 *
 * React hook for ML-based lead scoring with:
 * - Easy lead scoring with ML predictions
 * - Conversion feedback recording
 * - A/B testing management
 * - Model persistence to Supabase
 * - Real-time model stats
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  UnifiedLeadScorer,
  LeadFeatures,
  MLPrediction,
  ModelWeights,
  ABTestConfig,
  FeatureContribution,
  getUnifiedScorer,
} from '@/lib/ml-lead-scoring';
import type { Lead } from '@/types/lead';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface LeadScore {
  leadId: string;
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  variant: 'ml' | 'rules';
  confidence?: number;
  featureImportance?: FeatureContribution[];
  mlPrediction?: MLPrediction;
  scoredAt: Date;
}

export interface ABTestAnalysis {
  testId: string;
  duration: number;
  mlResults: {
    count: number;
    conversions: number;
    conversionRate: number;
    avgScore: number;
  };
  rulesResults: {
    count: number;
    conversions: number;
    conversionRate: number;
    avgScore: number;
  };
  winner: 'ml' | 'rules' | 'inconclusive';
  confidence: number;
}

export interface ModelStats {
  version: string;
  trainingExamples: number;
  featureImportance: Array<{ feature: string; importance: number }>;
  lastUpdated?: Date;
}

export interface UseMLLeadScoringOptions {
  autoLoadModel?: boolean;
  persistScores?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMLLeadScoring(options: UseMLLeadScoringOptions = {}) {
  const { autoLoadModel = true, persistScores = false } = options;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Get singleton scorer instance
  const scorer = useMemo(() => getUnifiedScorer(), []);

  // Local state for scored leads cache
  const [scoredLeads, setScoredLeads] = useState<Map<string, LeadScore>>(new Map());

  // ============================================================================
  // Model Persistence Queries
  // ============================================================================

  // Fetch saved model weights from Supabase
  const {
    data: savedModel,
    isLoading: isLoadingModel,
    refetch: refetchModel,
  } = useQuery({
    queryKey: ['ml-model-weights', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('ml_model_weights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching model weights', error as Error);
        return null;
      }

      return data as {
        id: string;
        user_id: string;
        weights: ModelWeights;
        created_at: string;
        updated_at: string;
      } | null;
    },
    enabled: !!user?.id && autoLoadModel,
  });

  // Load model when saved weights are fetched
  useEffect(() => {
    if (savedModel?.weights) {
      try {
        scorer.importModel(savedModel.weights);
      } catch (error) {
        logger.error('Error loading saved model', error as Error);
      }
    }
  }, [savedModel, scorer]);

  // Save model mutation
  const saveModelMutation = useMutation({
    mutationFn: async (weights: ModelWeights) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ml_model_weights')
        .upsert({
          user_id: user.id,
          weights,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-model-weights', user?.id] });
    },
  });

  // ============================================================================
  // A/B Test Persistence
  // ============================================================================

  // Fetch A/B test results
  const {
    data: abTestResults,
    isLoading: isLoadingABTests,
    refetch: refetchABTests,
  } = useQuery({
    queryKey: ['ab-test-results', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Error fetching A/B test results', error as Error);
        return [];
      }

      return data as Array<{
        id: string;
        user_id: string;
        test_id: string;
        analysis: ABTestAnalysis;
        created_at: string;
      }>;
    },
    enabled: !!user?.id,
  });

  // Save A/B test results mutation
  const saveABTestMutation = useMutation({
    mutationFn: async (analysis: ABTestAnalysis) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ab_test_results')
        .insert({
          user_id: user.id,
          test_id: analysis.testId,
          analysis,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-test-results', user?.id] });
    },
  });

  // ============================================================================
  // Lead Scoring Functions
  // ============================================================================

  /**
   * Score a single lead
   */
  const scoreLead = useCallback((
    leadId: string,
    features: LeadFeatures
  ): LeadScore => {
    const result = scorer.scoreLead(leadId, features);

    const leadScore: LeadScore = {
      leadId,
      score: result.score,
      priority: result.priority,
      variant: result.variant,
      confidence: result.confidence,
      featureImportance: result.featureImportance,
      mlPrediction: result.mlPrediction,
      scoredAt: new Date(),
    };

    // Cache the score
    setScoredLeads(prev => new Map(prev).set(leadId, leadScore));

    return leadScore;
  }, [scorer]);

  /**
   * Score multiple leads at once
   */
  const scoreLeads = useCallback((
    leads: Array<{ id: string; features: LeadFeatures }>
  ): LeadScore[] => {
    return leads.map(({ id, features }) => scoreLead(id, features));
  }, [scoreLead]);

  /**
   * Extract features from a Lead object
   */
  const extractFeaturesFromLead = useCallback((lead: Lead): LeadFeatures => {
    const formData = lead.form_data || {};

    return {
      source: lead.source || 'unknown',
      hasPhone: !!lead.phone,
      hasEmail: !!lead.email,
      messageLength: (lead.message || '').length,
      listingViews: formData.listingViews || 0,
      pageViewCount: formData.pageViewCount || 0,
      timeOnSite: formData.timeOnSite || 0,
      scrollDepth: formData.scrollDepth || 0,
      hasViewedMultipleListings: formData.hasViewedMultipleListings || false,
      timeOfDay: new Date(lead.created_at).getHours(),
      dayOfWeek: new Date(lead.created_at).getDay(),
      leadType: lead.lead_type || 'general_contact',
      isPreapproved: formData.preapproval_status === 'approved',
      hasTimeline: !!formData.timeline,
      deviceType: formData.device || 'desktop',
      utmSource: formData.utm_source,
      utmMedium: formData.utm_medium,
    };
  }, []);

  /**
   * Score a Lead object directly
   */
  const scoreLeadObject = useCallback((lead: Lead): LeadScore => {
    const features = extractFeaturesFromLead(lead);
    return scoreLead(lead.id, features);
  }, [scoreLead, extractFeaturesFromLead]);

  /**
   * Get cached score for a lead
   */
  const getCachedScore = useCallback((leadId: string): LeadScore | undefined => {
    return scoredLeads.get(leadId);
  }, [scoredLeads]);

  // ============================================================================
  // Conversion Feedback
  // ============================================================================

  /**
   * Record a conversion (positive or negative feedback)
   */
  const recordConversion = useCallback((
    leadId: string,
    features: LeadFeatures,
    converted: boolean
  ) => {
    scorer.recordConversion(leadId, features, converted);

    // Update cached score
    const cachedScore = scoredLeads.get(leadId);
    if (cachedScore) {
      setScoredLeads(prev => {
        const newMap = new Map(prev);
        newMap.set(leadId, {
          ...cachedScore,
          scoredAt: new Date(),
        });
        return newMap;
      });
    }
  }, [scorer, scoredLeads]);

  /**
   * Record conversion from a Lead object
   */
  const recordLeadConversion = useCallback((lead: Lead, converted: boolean) => {
    const features = extractFeaturesFromLead(lead);
    recordConversion(lead.id, features, converted);
  }, [recordConversion, extractFeaturesFromLead]);

  // ============================================================================
  // Model Management
  // ============================================================================

  /**
   * Retrain the model with accumulated feedback
   */
  const retrainModel = useCallback(async () => {
    try {
      const metrics = scorer.retrainModel();

      // Save the new model
      const weights = scorer.exportModel();
      await saveModelMutation.mutateAsync(weights);

      return metrics;
    } catch (error) {
      logger.error('Error retraining model', error as Error);
      throw error;
    }
  }, [scorer, saveModelMutation]);

  /**
   * Save current model to database
   */
  const saveModel = useCallback(async () => {
    const weights = scorer.exportModel();
    return saveModelMutation.mutateAsync(weights);
  }, [scorer, saveModelMutation]);

  /**
   * Get current model statistics
   */
  const getModelStats = useCallback((): ModelStats => {
    const stats = scorer.getModelStats();
    return {
      ...stats,
      lastUpdated: savedModel?.updated_at ? new Date(savedModel.updated_at) : undefined,
    };
  }, [scorer, savedModel]);

  // ============================================================================
  // A/B Testing
  // ============================================================================

  /**
   * Start a new A/B test
   */
  const startABTest = useCallback((mlTrafficPercent: number = 50): string => {
    return scorer.startABTest(mlTrafficPercent);
  }, [scorer]);

  /**
   * Stop the current A/B test and save results
   */
  const stopABTest = useCallback(async () => {
    scorer.stopABTest();
    const analysis = scorer.getABTestResults();

    // Save results to database
    if (analysis.testId) {
      await saveABTestMutation.mutateAsync(analysis);
    }

    return analysis;
  }, [scorer, saveABTestMutation]);

  /**
   * Get current A/B test analysis
   */
  const getABTestAnalysis = useCallback((): ABTestAnalysis => {
    return scorer.getABTestResults();
  }, [scorer]);

  /**
   * Check if A/B test is currently running
   */
  const isABTestRunning = useCallback((): boolean => {
    const abManager = scorer.getABTestManager();
    return abManager.getConfig().enabled;
  }, [scorer]);

  /**
   * Get A/B test configuration
   */
  const getABTestConfig = useCallback((): ABTestConfig => {
    const abManager = scorer.getABTestManager();
    return abManager.getConfig();
  }, [scorer]);

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Clear all cached scores
   */
  const clearCache = useCallback(() => {
    setScoredLeads(new Map());
  }, []);

  /**
   * Get all cached scores
   */
  const getAllCachedScores = useCallback((): LeadScore[] => {
    return Array.from(scoredLeads.values());
  }, [scoredLeads]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Lead Scoring
    scoreLead,
    scoreLeads,
    scoreLeadObject,
    extractFeaturesFromLead,
    getCachedScore,
    getAllCachedScores,
    clearCache,

    // Conversion Feedback
    recordConversion,
    recordLeadConversion,

    // Model Management
    retrainModel,
    saveModel,
    getModelStats,
    isLoadingModel,
    isSavingModel: saveModelMutation.isPending,
    modelError: saveModelMutation.error,

    // A/B Testing
    startABTest,
    stopABTest,
    getABTestAnalysis,
    isABTestRunning,
    getABTestConfig,
    abTestHistory: abTestResults || [],
    isLoadingABTests,
    isSavingABTest: saveABTestMutation.isPending,

    // Raw access
    scorer,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for scoring a single lead with automatic feature extraction
 */
export function useLeadScore(lead: Lead | null) {
  const { scoreLeadObject, getCachedScore } = useMLLeadScoring();

  const score = useMemo(() => {
    if (!lead) return null;

    const cached = getCachedScore(lead.id);
    if (cached) return cached;

    return scoreLeadObject(lead);
  }, [lead, scoreLeadObject, getCachedScore]);

  return score;
}

/**
 * Hook for A/B test status and controls
 */
export function useABTest() {
  const {
    startABTest,
    stopABTest,
    getABTestAnalysis,
    isABTestRunning,
    getABTestConfig,
    abTestHistory,
    isLoadingABTests,
    isSavingABTest,
  } = useMLLeadScoring();

  const [isRunning, setIsRunning] = useState(isABTestRunning());
  const [analysis, setAnalysis] = useState<ABTestAnalysis | null>(null);

  const start = useCallback((mlTrafficPercent?: number) => {
    const testId = startABTest(mlTrafficPercent);
    setIsRunning(true);
    return testId;
  }, [startABTest]);

  const stop = useCallback(async () => {
    const result = await stopABTest();
    setIsRunning(false);
    setAnalysis(result);
    return result;
  }, [stopABTest]);

  const refresh = useCallback(() => {
    setIsRunning(isABTestRunning());
    setAnalysis(getABTestAnalysis());
  }, [isABTestRunning, getABTestAnalysis]);

  return {
    isRunning,
    analysis,
    config: getABTestConfig(),
    history: abTestHistory,
    isLoading: isLoadingABTests,
    isSaving: isSavingABTest,
    start,
    stop,
    refresh,
  };
}

/**
 * Hook for model management
 */
export function useMLModel() {
  const {
    retrainModel,
    saveModel,
    getModelStats,
    isLoadingModel,
    isSavingModel,
    modelError,
  } = useMLLeadScoring();

  const [stats, setStats] = useState<ModelStats | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainError, setRetrainError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    setStats(getModelStats());
  }, [getModelStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const retrain = useCallback(async () => {
    setIsRetraining(true);
    setRetrainError(null);
    try {
      const metrics = await retrainModel();
      refresh();
      return metrics;
    } catch (error) {
      setRetrainError(error as Error);
      throw error;
    } finally {
      setIsRetraining(false);
    }
  }, [retrainModel, refresh]);

  const save = useCallback(async () => {
    await saveModel();
    refresh();
  }, [saveModel, refresh]);

  return {
    stats,
    isLoading: isLoadingModel,
    isSaving: isSavingModel,
    isRetraining,
    error: modelError || retrainError,
    retrain,
    save,
    refresh,
  };
}

export default useMLLeadScoring;
