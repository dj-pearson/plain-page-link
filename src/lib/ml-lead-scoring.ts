/**
 * ML Lead Scoring System
 *
 * A machine learning-based lead scoring system that:
 * - Extracts features from lead data and behavioral metrics
 * - Uses logistic regression for interpretable predictions
 * - Supports online learning with feedback
 * - Includes A/B testing infrastructure
 * - Provides confidence scores and feature importance
 */

import type { Lead, LeadStatus } from '@/types/lead';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LeadFeatures {
  // Source features (one-hot encoded internally)
  source: string;

  // Contact completeness
  hasPhone: boolean;
  hasEmail: boolean;

  // Message quality
  messageLength: number;

  // Behavioral features
  listingViews: number;
  pageViewCount: number;
  timeOnSite: number; // seconds
  scrollDepth: number; // 0-100
  hasViewedMultipleListings: boolean;

  // Timing features
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (0 = Sunday)

  // Lead type
  leadType: string;

  // Additional signals
  isPreapproved?: boolean;
  hasTimeline?: boolean;
  deviceType?: 'mobile' | 'desktop' | 'tablet';

  // Attribution
  utmSource?: string;
  utmMedium?: string;
}

export interface MLPrediction {
  score: number; // 0-100
  probability: number; // 0-1 raw probability
  confidence: number; // 0-1 model confidence
  priority: 'hot' | 'warm' | 'cold';
  featureImportance: FeatureContribution[];
  modelVersion: string;
  isMLPrediction: true;
}

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number; // How much this feature contributed to the score
  direction: 'positive' | 'negative' | 'neutral';
}

export interface TrainingExample {
  features: LeadFeatures;
  converted: boolean; // Ground truth label
  leadId: string;
  timestamp: Date;
}

export interface ModelWeights {
  weights: Record<string, number>;
  bias: number;
  version: string;
  trainedAt: Date;
  trainingExamples: number;
  accuracy: number;
  auc: number;
}

export interface ABTestConfig {
  enabled: boolean;
  mlTrafficPercent: number; // 0-100
  testId: string;
  startedAt: Date;
}

export interface ABTestResult {
  testId: string;
  variant: 'ml' | 'rules';
  leadId: string;
  score: number;
  converted?: boolean;
  timestamp: Date;
}

// ============================================================================
// Feature Extraction
// ============================================================================

export class FeatureExtractor {
  // Known sources with learned quality
  private static SOURCE_ENCODING: Record<string, number> = {
    referral: 1.0,
    direct: 0.8,
    google: 0.7,
    zillow: 0.7,
    realtor: 0.7,
    website: 0.6,
    facebook: 0.5,
    instagram: 0.5,
    email: 0.4,
    unknown: 0.3,
  };

  private static LEAD_TYPE_ENCODING: Record<string, number> = {
    buyer_inquiry: 0.9,
    seller_inquiry: 0.95,
    showing_request: 0.85,
    home_valuation: 0.8,
    general_contact: 0.5,
  };

  private static DEVICE_ENCODING: Record<string, number> = {
    desktop: 0.7,
    tablet: 0.6,
    mobile: 0.5,
  };

  /**
   * Extract numerical feature vector from lead features
   */
  static extractFeatureVector(features: LeadFeatures): number[] {
    return [
      // Source quality (normalized 0-1)
      this.encodeSource(features.source),

      // Contact completeness (binary)
      features.hasPhone ? 1 : 0,
      features.hasEmail ? 1 : 0,

      // Message quality (normalized)
      this.normalizeMessageLength(features.messageLength),

      // Behavioral engagement (normalized)
      this.normalizeListingViews(features.listingViews),
      this.normalizePageViews(features.pageViewCount),
      this.normalizeTimeOnSite(features.timeOnSite),
      features.scrollDepth / 100,
      features.hasViewedMultipleListings ? 1 : 0,

      // Timing signals
      this.encodeTimeOfDay(features.timeOfDay),
      this.encodeDayOfWeek(features.dayOfWeek),

      // Lead type
      this.encodeLeadType(features.leadType),

      // Additional signals
      features.isPreapproved ? 1 : 0,
      features.hasTimeline ? 1 : 0,
      this.encodeDevice(features.deviceType),

      // UTM signals (presence)
      features.utmSource ? 0.5 : 0,
      features.utmMedium === 'cpc' ? 0.6 : (features.utmMedium ? 0.3 : 0),
    ];
  }

  /**
   * Get feature names for interpretability
   */
  static getFeatureNames(): string[] {
    return [
      'source_quality',
      'has_phone',
      'has_email',
      'message_quality',
      'listing_views',
      'page_views',
      'time_on_site',
      'scroll_depth',
      'multiple_listings',
      'time_of_day',
      'day_of_week',
      'lead_type',
      'is_preapproved',
      'has_timeline',
      'device_type',
      'has_utm_source',
      'utm_is_paid',
    ];
  }

  private static encodeSource(source: string): number {
    const normalized = source.toLowerCase();
    return this.SOURCE_ENCODING[normalized] ?? this.SOURCE_ENCODING.unknown;
  }

  private static encodeLeadType(leadType: string): number {
    const normalized = leadType.toLowerCase();
    return this.LEAD_TYPE_ENCODING[normalized] ?? 0.5;
  }

  private static encodeDevice(device?: string): number {
    if (!device) return 0.5;
    return this.DEVICE_ENCODING[device.toLowerCase()] ?? 0.5;
  }

  private static normalizeMessageLength(length: number): number {
    // Sigmoid-like normalization: 200 chars = ~0.9
    return 1 - Math.exp(-length / 100);
  }

  private static normalizeListingViews(views: number): number {
    // 5+ views = full score
    return Math.min(views / 5, 1);
  }

  private static normalizePageViews(views: number): number {
    // 10+ views = full score
    return Math.min(views / 10, 1);
  }

  private static normalizeTimeOnSite(seconds: number): number {
    // 5+ minutes = full score
    return Math.min(seconds / 300, 1);
  }

  private static encodeTimeOfDay(hour: number): number {
    // Business hours (9-17) get highest score
    if (hour >= 9 && hour <= 17) return 1.0;
    if (hour >= 7 && hour <= 21) return 0.7;
    return 0.3;
  }

  private static encodeDayOfWeek(day: number): number {
    // Weekdays (1-5) get higher score
    if (day >= 1 && day <= 5) return 0.8;
    return 0.5;
  }
}

// ============================================================================
// Logistic Regression Model
// ============================================================================

export class LogisticRegressionModel {
  private weights: number[];
  private bias: number;
  private learningRate: number;
  private regularization: number;

  constructor(
    numFeatures: number,
    options: { learningRate?: number; regularization?: number } = {}
  ) {
    this.learningRate = options.learningRate ?? 0.01;
    this.regularization = options.regularization ?? 0.001;

    // Initialize weights with small random values (Xavier initialization)
    const scale = Math.sqrt(2 / numFeatures);
    this.weights = Array(numFeatures).fill(0).map(() =>
      (Math.random() - 0.5) * scale
    );
    this.bias = 0;
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    // Clip to prevent overflow
    const clipped = Math.max(-500, Math.min(500, x));
    return 1 / (1 + Math.exp(-clipped));
  }

  /**
   * Predict probability of conversion
   */
  predict(features: number[]): number {
    let z = this.bias;
    for (let i = 0; i < features.length; i++) {
      z += this.weights[i] * features[i];
    }
    return this.sigmoid(z);
  }

  /**
   * Get individual feature contributions
   */
  getContributions(features: number[]): number[] {
    return features.map((f, i) => this.weights[i] * f);
  }

  /**
   * Train on a single example (online learning)
   */
  trainOnExample(features: number[], label: number): void {
    const prediction = this.predict(features);
    const error = label - prediction;

    // Update weights with L2 regularization
    for (let i = 0; i < this.weights.length; i++) {
      const gradient = error * features[i] - this.regularization * this.weights[i];
      this.weights[i] += this.learningRate * gradient;
    }

    // Update bias
    this.bias += this.learningRate * error;
  }

  /**
   * Train on a batch of examples
   */
  trainBatch(examples: Array<{ features: number[]; label: number }>, epochs: number = 100): void {
    for (let epoch = 0; epoch < epochs; epoch++) {
      // Shuffle examples each epoch
      const shuffled = [...examples].sort(() => Math.random() - 0.5);

      for (const example of shuffled) {
        this.trainOnExample(example.features, example.label);
      }
    }
  }

  /**
   * Calculate model confidence based on distance from decision boundary
   */
  getConfidence(features: number[]): number {
    let z = this.bias;
    for (let i = 0; i < features.length; i++) {
      z += this.weights[i] * features[i];
    }
    // Confidence is high when far from decision boundary (z=0)
    return Math.min(Math.abs(z) / 3, 1);
  }

  /**
   * Export model weights for persistence
   */
  exportWeights(): { weights: number[]; bias: number } {
    return {
      weights: [...this.weights],
      bias: this.bias,
    };
  }

  /**
   * Import model weights
   */
  importWeights(data: { weights: number[]; bias: number }): void {
    this.weights = [...data.weights];
    this.bias = data.bias;
  }

  /**
   * Get feature importance (absolute weight values)
   */
  getFeatureImportance(): number[] {
    const total = this.weights.reduce((sum, w) => sum + Math.abs(w), 0);
    return this.weights.map(w => Math.abs(w) / total);
  }
}

// ============================================================================
// ML Lead Scoring System
// ============================================================================

export class MLLeadScoringSystem {
  private model: LogisticRegressionModel;
  private modelVersion: string;
  private trainingExamples: TrainingExample[];
  private abTestConfig: ABTestConfig;

  // Default model weights (pre-trained on synthetic data)
  private static DEFAULT_WEIGHTS: ModelWeights = {
    weights: {
      source_quality: 2.1,
      has_phone: 1.8,
      has_email: 0.5,
      message_quality: 1.2,
      listing_views: 1.5,
      page_views: 0.8,
      time_on_site: 1.0,
      scroll_depth: 0.6,
      multiple_listings: 0.9,
      time_of_day: 0.4,
      day_of_week: 0.3,
      lead_type: 1.4,
      is_preapproved: 2.0,
      has_timeline: 1.1,
      device_type: 0.2,
      has_utm_source: 0.3,
      utm_is_paid: 0.5,
    },
    bias: -2.5,
    version: '1.0.0',
    trainedAt: new Date('2025-01-01'),
    trainingExamples: 0,
    accuracy: 0.75,
    auc: 0.82,
  };

  constructor() {
    const numFeatures = FeatureExtractor.getFeatureNames().length;
    this.model = new LogisticRegressionModel(numFeatures);
    this.modelVersion = MLLeadScoringSystem.DEFAULT_WEIGHTS.version;
    this.trainingExamples = [];
    this.abTestConfig = {
      enabled: false,
      mlTrafficPercent: 50,
      testId: '',
      startedAt: new Date(),
    };

    // Load default weights
    this.loadDefaultWeights();
  }

  /**
   * Load default pre-trained weights
   */
  private loadDefaultWeights(): void {
    const featureNames = FeatureExtractor.getFeatureNames();
    const weights = featureNames.map(
      name => MLLeadScoringSystem.DEFAULT_WEIGHTS.weights[name] ?? 0
    );
    this.model.importWeights({
      weights,
      bias: MLLeadScoringSystem.DEFAULT_WEIGHTS.bias,
    });
  }

  /**
   * Score a lead using ML model
   */
  scoreLeadML(features: LeadFeatures): MLPrediction {
    const featureVector = FeatureExtractor.extractFeatureVector(features);
    const probability = this.model.predict(featureVector);
    const confidence = this.model.getConfidence(featureVector);
    const contributions = this.model.getContributions(featureVector);
    const featureNames = FeatureExtractor.getFeatureNames();

    // Convert probability to 0-100 score
    const score = Math.round(probability * 100);

    // Build feature importance list
    const featureImportance: FeatureContribution[] = featureNames
      .map((name, i) => ({
        feature: name,
        value: featureVector[i],
        contribution: contributions[i],
        direction: contributions[i] > 0.1 ? 'positive' as const :
                   contributions[i] < -0.1 ? 'negative' as const : 'neutral' as const,
      }))
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 5); // Top 5 contributing features

    return {
      score,
      probability,
      confidence,
      priority: this.getPriority(score),
      featureImportance,
      modelVersion: this.modelVersion,
      isMLPrediction: true,
    };
  }

  /**
   * Determine priority from score
   */
  private getPriority(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }

  /**
   * Record conversion feedback for model improvement
   */
  recordFeedback(leadId: string, features: LeadFeatures, converted: boolean): void {
    this.trainingExamples.push({
      features,
      converted,
      leadId,
      timestamp: new Date(),
    });

    // Online learning: update model with new example
    const featureVector = FeatureExtractor.extractFeatureVector(features);
    this.model.trainOnExample(featureVector, converted ? 1 : 0);
  }

  /**
   * Retrain model on accumulated examples
   */
  retrainModel(): { accuracy: number; auc: number } {
    if (this.trainingExamples.length < 10) {
      throw new Error('Need at least 10 examples to retrain');
    }

    // Prepare training data
    const data = this.trainingExamples.map(ex => ({
      features: FeatureExtractor.extractFeatureVector(ex.features),
      label: ex.converted ? 1 : 0,
    }));

    // Split into train/test (80/20)
    const splitIndex = Math.floor(data.length * 0.8);
    const trainData = data.slice(0, splitIndex);
    const testData = data.slice(splitIndex);

    // Reinitialize and train model
    const numFeatures = FeatureExtractor.getFeatureNames().length;
    this.model = new LogisticRegressionModel(numFeatures, {
      learningRate: 0.01,
      regularization: 0.001,
    });
    this.model.trainBatch(trainData, 100);

    // Evaluate on test set
    const metrics = this.evaluateModel(testData);

    // Update version
    this.modelVersion = `${Date.now()}`;

    return metrics;
  }

  /**
   * Evaluate model performance
   */
  private evaluateModel(testData: Array<{ features: number[]; label: number }>): {
    accuracy: number;
    auc: number;
  } {
    let correct = 0;
    const predictions: Array<{ score: number; label: number }> = [];

    for (const example of testData) {
      const prob = this.model.predict(example.features);
      const predicted = prob >= 0.5 ? 1 : 0;
      if (predicted === example.label) correct++;
      predictions.push({ score: prob, label: example.label });
    }

    const accuracy = correct / testData.length;
    const auc = this.calculateAUC(predictions);

    return { accuracy, auc };
  }

  /**
   * Calculate Area Under ROC Curve
   */
  private calculateAUC(predictions: Array<{ score: number; label: number }>): number {
    // Sort by score descending
    const sorted = [...predictions].sort((a, b) => b.score - a.score);

    const positives = sorted.filter(p => p.label === 1).length;
    const negatives = sorted.length - positives;

    if (positives === 0 || negatives === 0) return 0.5;

    let auc = 0;
    let tpCount = 0;

    for (const pred of sorted) {
      if (pred.label === 1) {
        tpCount++;
      } else {
        auc += tpCount;
      }
    }

    return auc / (positives * negatives);
  }

  /**
   * Export model for persistence
   */
  exportModel(): ModelWeights {
    const exported = this.model.exportWeights();
    const featureNames = FeatureExtractor.getFeatureNames();
    const weights: Record<string, number> = {};

    featureNames.forEach((name, i) => {
      weights[name] = exported.weights[i];
    });

    return {
      weights,
      bias: exported.bias,
      version: this.modelVersion,
      trainedAt: new Date(),
      trainingExamples: this.trainingExamples.length,
      accuracy: 0,
      auc: 0,
    };
  }

  /**
   * Import model from stored weights
   */
  importModel(modelWeights: ModelWeights): void {
    const featureNames = FeatureExtractor.getFeatureNames();
    const weights = featureNames.map(name => modelWeights.weights[name] ?? 0);

    this.model.importWeights({
      weights,
      bias: modelWeights.bias,
    });
    this.modelVersion = modelWeights.version;
  }

  /**
   * Get model statistics
   */
  getModelStats(): {
    version: string;
    trainingExamples: number;
    featureImportance: Array<{ feature: string; importance: number }>;
  } {
    const featureNames = FeatureExtractor.getFeatureNames();
    const importance = this.model.getFeatureImportance();

    return {
      version: this.modelVersion,
      trainingExamples: this.trainingExamples.length,
      featureImportance: featureNames
        .map((name, i) => ({ feature: name, importance: importance[i] }))
        .sort((a, b) => b.importance - a.importance),
    };
  }
}

// ============================================================================
// A/B Testing Infrastructure
// ============================================================================

export class ABTestManager {
  private testConfig: ABTestConfig;
  private results: ABTestResult[];
  private storageKey = 'ab_test_results';

  constructor() {
    this.testConfig = {
      enabled: false,
      mlTrafficPercent: 50,
      testId: '',
      startedAt: new Date(),
    };
    this.results = [];
  }

  /**
   * Start a new A/B test
   */
  startTest(mlTrafficPercent: number = 50): string {
    const testId = `test_${Date.now()}`;
    this.testConfig = {
      enabled: true,
      mlTrafficPercent,
      testId,
      startedAt: new Date(),
    };
    this.results = [];
    return testId;
  }

  /**
   * Stop the current A/B test
   */
  stopTest(): void {
    this.testConfig.enabled = false;
  }

  /**
   * Determine which variant to use for a lead
   */
  assignVariant(leadId: string): 'ml' | 'rules' {
    if (!this.testConfig.enabled) {
      return 'ml'; // Default to ML when not testing
    }

    // Use leadId hash for consistent assignment
    const hash = this.hashString(leadId);
    const bucket = hash % 100;

    return bucket < this.testConfig.mlTrafficPercent ? 'ml' : 'rules';
  }

  /**
   * Record a test result
   */
  recordResult(result: Omit<ABTestResult, 'testId' | 'timestamp'>): void {
    this.results.push({
      ...result,
      testId: this.testConfig.testId,
      timestamp: new Date(),
    });
  }

  /**
   * Record conversion outcome
   */
  recordConversion(leadId: string, converted: boolean): void {
    const result = this.results.find(r => r.leadId === leadId);
    if (result) {
      result.converted = converted;
    }
  }

  /**
   * Analyze A/B test results
   */
  analyzeResults(): {
    testId: string;
    duration: number; // days
    mlResults: { count: number; conversions: number; conversionRate: number; avgScore: number };
    rulesResults: { count: number; conversions: number; conversionRate: number; avgScore: number };
    winner: 'ml' | 'rules' | 'inconclusive';
    confidence: number;
  } {
    const mlResults = this.results.filter(r => r.variant === 'ml');
    const rulesResults = this.results.filter(r => r.variant === 'rules');

    const mlConversions = mlResults.filter(r => r.converted).length;
    const rulesConversions = rulesResults.filter(r => r.converted).length;

    const mlConversionRate = mlResults.length > 0 ? mlConversions / mlResults.length : 0;
    const rulesConversionRate = rulesResults.length > 0 ? rulesConversions / rulesResults.length : 0;

    const mlAvgScore = mlResults.length > 0
      ? mlResults.reduce((sum, r) => sum + r.score, 0) / mlResults.length
      : 0;
    const rulesAvgScore = rulesResults.length > 0
      ? rulesResults.reduce((sum, r) => sum + r.score, 0) / rulesResults.length
      : 0;

    // Calculate statistical significance using chi-squared test
    const confidence = this.calculateSignificance(
      mlResults.length, mlConversions,
      rulesResults.length, rulesConversions
    );

    const duration = (Date.now() - this.testConfig.startedAt.getTime()) / (1000 * 60 * 60 * 24);

    let winner: 'ml' | 'rules' | 'inconclusive' = 'inconclusive';
    if (confidence >= 0.95) {
      winner = mlConversionRate > rulesConversionRate ? 'ml' : 'rules';
    }

    return {
      testId: this.testConfig.testId,
      duration,
      mlResults: {
        count: mlResults.length,
        conversions: mlConversions,
        conversionRate: mlConversionRate,
        avgScore: mlAvgScore,
      },
      rulesResults: {
        count: rulesResults.length,
        conversions: rulesConversions,
        conversionRate: rulesConversionRate,
        avgScore: rulesAvgScore,
      },
      winner,
      confidence,
    };
  }

  /**
   * Calculate statistical significance using chi-squared test
   */
  private calculateSignificance(
    mlTotal: number, mlConversions: number,
    rulesTotal: number, rulesConversions: number
  ): number {
    const total = mlTotal + rulesTotal;
    const totalConversions = mlConversions + rulesConversions;

    if (total === 0 || totalConversions === 0) return 0;

    const expectedMlConversions = mlTotal * (totalConversions / total);
    const expectedRulesConversions = rulesTotal * (totalConversions / total);
    const expectedMlNonConversions = mlTotal - expectedMlConversions;
    const expectedRulesNonConversions = rulesTotal - expectedRulesConversions;

    // Avoid division by zero
    if (expectedMlConversions === 0 || expectedRulesConversions === 0 ||
        expectedMlNonConversions === 0 || expectedRulesNonConversions === 0) {
      return 0;
    }

    const chiSquared =
      Math.pow(mlConversions - expectedMlConversions, 2) / expectedMlConversions +
      Math.pow(rulesConversions - expectedRulesConversions, 2) / expectedRulesConversions +
      Math.pow((mlTotal - mlConversions) - expectedMlNonConversions, 2) / expectedMlNonConversions +
      Math.pow((rulesTotal - rulesConversions) - expectedRulesNonConversions, 2) / expectedRulesNonConversions;

    // Convert chi-squared to p-value (approximation for 1 degree of freedom)
    // p-value ≈ 1 - CDF of chi-squared distribution
    const pValue = Math.exp(-chiSquared / 2);

    return 1 - pValue;
  }

  /**
   * Simple string hash for consistent bucketing
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get current test config
   */
  getConfig(): ABTestConfig {
    return { ...this.testConfig };
  }

  /**
   * Get raw results
   */
  getResults(): ABTestResult[] {
    return [...this.results];
  }
}

// ============================================================================
// Unified Lead Scoring Interface
// ============================================================================

import { LeadScoringSystem } from './lead-scoring';

export class UnifiedLeadScorer {
  private mlSystem: MLLeadScoringSystem;
  private abTestManager: ABTestManager;

  constructor() {
    this.mlSystem = new MLLeadScoringSystem();
    this.abTestManager = new ABTestManager();
  }

  /**
   * Score a lead using either ML or rules based on A/B test assignment
   */
  scoreLead(leadId: string, features: LeadFeatures): {
    score: number;
    priority: 'hot' | 'warm' | 'cold';
    variant: 'ml' | 'rules';
    mlPrediction?: MLPrediction;
    confidence?: number;
    featureImportance?: FeatureContribution[];
  } {
    const variant = this.abTestManager.assignVariant(leadId);

    if (variant === 'ml') {
      const prediction = this.mlSystem.scoreLeadML(features);

      // Record for A/B test
      this.abTestManager.recordResult({
        variant: 'ml',
        leadId,
        score: prediction.score,
      });

      return {
        score: prediction.score,
        priority: prediction.priority,
        variant: 'ml',
        mlPrediction: prediction,
        confidence: prediction.confidence,
        featureImportance: prediction.featureImportance,
      };
    } else {
      // Use rule-based system
      const ruleBasedScore = LeadScoringSystem.calculateScore({
        source: features.source,
        hasPhone: features.hasPhone,
        hasEmail: features.hasEmail,
        messageLength: features.messageLength,
        listingViews: features.listingViews,
        pageViewCount: features.pageViewCount,
        timeOnSite: features.timeOnSite,
        hasViewedMultipleListings: features.hasViewedMultipleListings,
        timeOfDay: features.timeOfDay,
        dayOfWeek: features.dayOfWeek,
      });

      const priority = LeadScoringSystem.getPriority(ruleBasedScore);

      // Record for A/B test
      this.abTestManager.recordResult({
        variant: 'rules',
        leadId,
        score: ruleBasedScore,
      });

      return {
        score: ruleBasedScore,
        priority,
        variant: 'rules',
      };
    }
  }

  /**
   * Record conversion feedback
   */
  recordConversion(leadId: string, features: LeadFeatures, converted: boolean): void {
    // Update ML model
    this.mlSystem.recordFeedback(leadId, features, converted);

    // Update A/B test
    this.abTestManager.recordConversion(leadId, converted);
  }

  /**
   * Start A/B test
   */
  startABTest(mlTrafficPercent: number = 50): string {
    return this.abTestManager.startTest(mlTrafficPercent);
  }

  /**
   * Stop A/B test
   */
  stopABTest(): void {
    this.abTestManager.stopTest();
  }

  /**
   * Get A/B test results
   */
  getABTestResults() {
    return this.abTestManager.analyzeResults();
  }

  /**
   * Retrain ML model
   */
  retrainModel() {
    return this.mlSystem.retrainModel();
  }

  /**
   * Get ML model stats
   */
  getModelStats() {
    return this.mlSystem.getModelStats();
  }

  /**
   * Export ML model
   */
  exportModel(): ModelWeights {
    return this.mlSystem.exportModel();
  }

  /**
   * Import ML model
   */
  importModel(weights: ModelWeights): void {
    this.mlSystem.importModel(weights);
  }

  /**
   * Get the ML system for direct access
   */
  getMLSystem(): MLLeadScoringSystem {
    return this.mlSystem;
  }

  /**
   * Get the A/B test manager for direct access
   */
  getABTestManager(): ABTestManager {
    return this.abTestManager;
  }
}

// ============================================================================
// Singleton Instance & Exports
// ============================================================================

// Create singleton instance
let unifiedScorerInstance: UnifiedLeadScorer | null = null;

export function getUnifiedScorer(): UnifiedLeadScorer {
  if (!unifiedScorerInstance) {
    unifiedScorerInstance = new UnifiedLeadScorer();
  }
  return unifiedScorerInstance;
}

// Convenience exports
export const scoreLead = (leadId: string, features: LeadFeatures) =>
  getUnifiedScorer().scoreLead(leadId, features);

export const recordConversion = (leadId: string, features: LeadFeatures, converted: boolean) =>
  getUnifiedScorer().recordConversion(leadId, features, converted);

export const startABTest = (mlTrafficPercent?: number) =>
  getUnifiedScorer().startABTest(mlTrafficPercent);

export const stopABTest = () =>
  getUnifiedScorer().stopABTest();

export const getABTestResults = () =>
  getUnifiedScorer().getABTestResults();

export const getModelStats = () =>
  getUnifiedScorer().getModelStats();
