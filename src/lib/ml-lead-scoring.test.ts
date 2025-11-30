import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FeatureExtractor,
  LogisticRegressionModel,
  MLLeadScoringSystem,
  ABTestManager,
  UnifiedLeadScorer,
  LeadFeatures,
  scoreLead,
  recordConversion,
  getUnifiedScorer,
} from './ml-lead-scoring';

// ============================================================================
// Test Utilities
// ============================================================================

const createMockFeatures = (overrides: Partial<LeadFeatures> = {}): LeadFeatures => ({
  source: 'website',
  hasPhone: true,
  hasEmail: true,
  messageLength: 100,
  listingViews: 3,
  pageViewCount: 5,
  timeOnSite: 180,
  scrollDepth: 75,
  hasViewedMultipleListings: true,
  timeOfDay: 14,
  dayOfWeek: 2,
  leadType: 'buyer_inquiry',
  isPreapproved: false,
  hasTimeline: true,
  deviceType: 'desktop',
  ...overrides,
});

// ============================================================================
// Feature Extractor Tests
// ============================================================================

describe('FeatureExtractor', () => {
  describe('extractFeatureVector', () => {
    it('should return array of correct length', () => {
      const features = createMockFeatures();
      const vector = FeatureExtractor.extractFeatureVector(features);

      expect(Array.isArray(vector)).toBe(true);
      expect(vector.length).toBe(FeatureExtractor.getFeatureNames().length);
    });

    it('should return values between 0 and 1', () => {
      const features = createMockFeatures();
      const vector = FeatureExtractor.extractFeatureVector(features);

      vector.forEach((value, index) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should encode referral source as highest value', () => {
      const referralFeatures = createMockFeatures({ source: 'referral' });
      const directFeatures = createMockFeatures({ source: 'direct' });

      const referralVector = FeatureExtractor.extractFeatureVector(referralFeatures);
      const directVector = FeatureExtractor.extractFeatureVector(directFeatures);

      // Source quality is first feature
      expect(referralVector[0]).toBeGreaterThan(directVector[0]);
    });

    it('should set hasPhone flag correctly', () => {
      const withPhone = createMockFeatures({ hasPhone: true });
      const withoutPhone = createMockFeatures({ hasPhone: false });

      const withPhoneVector = FeatureExtractor.extractFeatureVector(withPhone);
      const withoutPhoneVector = FeatureExtractor.extractFeatureVector(withoutPhone);

      // hasPhone is second feature
      expect(withPhoneVector[1]).toBe(1);
      expect(withoutPhoneVector[1]).toBe(0);
    });

    it('should normalize message length with diminishing returns', () => {
      const short = createMockFeatures({ messageLength: 10 });
      const medium = createMockFeatures({ messageLength: 100 });
      const long = createMockFeatures({ messageLength: 500 });

      const shortVector = FeatureExtractor.extractFeatureVector(short);
      const mediumVector = FeatureExtractor.extractFeatureVector(medium);
      const longVector = FeatureExtractor.extractFeatureVector(long);

      // Message quality is 4th feature (index 3)
      expect(mediumVector[3]).toBeGreaterThan(shortVector[3]);
      expect(longVector[3]).toBeGreaterThan(mediumVector[3]);
      // Diminishing returns: long vs medium increase should be less than medium vs short
      const shortToMedium = mediumVector[3] - shortVector[3];
      const mediumToLong = longVector[3] - mediumVector[3];
      expect(mediumToLong).toBeLessThan(shortToMedium);
    });

    it('should encode business hours higher', () => {
      const businessHours = createMockFeatures({ timeOfDay: 10 });
      const nightTime = createMockFeatures({ timeOfDay: 3 });

      const businessVector = FeatureExtractor.extractFeatureVector(businessHours);
      const nightVector = FeatureExtractor.extractFeatureVector(nightTime);

      // Time of day is 10th feature (index 9)
      expect(businessVector[9]).toBeGreaterThan(nightVector[9]);
    });

    it('should handle unknown source gracefully', () => {
      const features = createMockFeatures({ source: 'unknown_source_xyz' });
      const vector = FeatureExtractor.extractFeatureVector(features);

      expect(vector[0]).toBeGreaterThan(0);
      expect(vector[0]).toBeLessThan(1);
    });
  });

  describe('getFeatureNames', () => {
    it('should return array of feature names', () => {
      const names = FeatureExtractor.getFeatureNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('source_quality');
      expect(names).toContain('has_phone');
      expect(names).toContain('message_quality');
    });
  });
});

// ============================================================================
// Logistic Regression Model Tests
// ============================================================================

describe('LogisticRegressionModel', () => {
  let model: LogisticRegressionModel;

  beforeEach(() => {
    model = new LogisticRegressionModel(5);
  });

  describe('predict', () => {
    it('should return probability between 0 and 1', () => {
      const features = [0.5, 0.5, 0.5, 0.5, 0.5];
      const prob = model.predict(features);

      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
    });

    it('should handle extreme input values', () => {
      const highFeatures = [1, 1, 1, 1, 1];
      const lowFeatures = [0, 0, 0, 0, 0];

      const highProb = model.predict(highFeatures);
      const lowProb = model.predict(lowFeatures);

      expect(highProb).toBeGreaterThanOrEqual(0);
      expect(highProb).toBeLessThanOrEqual(1);
      expect(lowProb).toBeGreaterThanOrEqual(0);
      expect(lowProb).toBeLessThanOrEqual(1);
    });
  });

  describe('trainOnExample', () => {
    it('should update weights after training', () => {
      const features = [1, 0, 1, 0, 1];
      const initialPred = model.predict(features);

      // Train multiple times with positive label
      for (let i = 0; i < 100; i++) {
        model.trainOnExample(features, 1);
      }

      const afterPred = model.predict(features);
      expect(afterPred).toBeGreaterThan(initialPred);
    });

    it('should decrease prediction for negative examples', () => {
      const features = [0.8, 0.8, 0.8, 0.8, 0.8];

      // First train with positive examples
      for (let i = 0; i < 50; i++) {
        model.trainOnExample(features, 1);
      }
      const afterPositive = model.predict(features);

      // Then train with negative examples
      for (let i = 0; i < 100; i++) {
        model.trainOnExample(features, 0);
      }
      const afterNegative = model.predict(features);

      expect(afterNegative).toBeLessThan(afterPositive);
    });
  });

  describe('trainBatch', () => {
    it('should learn from batch of examples', () => {
      const positiveFeatures = [1, 1, 1, 1, 1];
      const negativeFeatures = [0, 0, 0, 0, 0];

      const examples = [
        ...Array(50).fill({ features: positiveFeatures, label: 1 }),
        ...Array(50).fill({ features: negativeFeatures, label: 0 }),
      ];

      model.trainBatch(examples, 50);

      const posPred = model.predict(positiveFeatures);
      const negPred = model.predict(negativeFeatures);

      expect(posPred).toBeGreaterThan(0.5);
      expect(negPred).toBeLessThan(0.5);
    });
  });

  describe('getContributions', () => {
    it('should return array of same length as features', () => {
      const features = [0.5, 0.5, 0.5, 0.5, 0.5];
      const contributions = model.getContributions(features);

      expect(contributions.length).toBe(features.length);
    });
  });

  describe('getConfidence', () => {
    it('should return confidence between 0 and 1', () => {
      const features = [0.5, 0.5, 0.5, 0.5, 0.5];
      const confidence = model.getConfidence(features);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should have higher confidence far from decision boundary', () => {
      // Train model to have strong opinion on extreme inputs
      const model2 = new LogisticRegressionModel(5);

      for (let i = 0; i < 100; i++) {
        model2.trainOnExample([1, 1, 1, 1, 1], 1);
        model2.trainOnExample([0, 0, 0, 0, 0], 0);
      }

      const extremeConfidence = model2.getConfidence([1, 1, 1, 1, 1]);
      const middleConfidence = model2.getConfidence([0.5, 0.5, 0.5, 0.5, 0.5]);

      expect(extremeConfidence).toBeGreaterThan(middleConfidence);
    });
  });

  describe('export/import weights', () => {
    it('should preserve predictions after export/import', () => {
      // Train model
      for (let i = 0; i < 50; i++) {
        model.trainOnExample([1, 0, 1, 0, 1], 1);
      }

      const features = [0.7, 0.3, 0.7, 0.3, 0.7];
      const predBefore = model.predict(features);

      // Export and import
      const exported = model.exportWeights();
      const newModel = new LogisticRegressionModel(5);
      newModel.importWeights(exported);

      const predAfter = newModel.predict(features);

      expect(predAfter).toBeCloseTo(predBefore, 10);
    });
  });

  describe('getFeatureImportance', () => {
    it('should return normalized importance values', () => {
      const importance = model.getFeatureImportance();

      expect(importance.length).toBe(5);
      const sum = importance.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });
  });
});

// ============================================================================
// ML Lead Scoring System Tests
// ============================================================================

describe('MLLeadScoringSystem', () => {
  let mlSystem: MLLeadScoringSystem;

  beforeEach(() => {
    mlSystem = new MLLeadScoringSystem();
  });

  describe('scoreLeadML', () => {
    it('should return prediction object with all required fields', () => {
      const features = createMockFeatures();
      const prediction = mlSystem.scoreLeadML(features);

      expect(prediction).toHaveProperty('score');
      expect(prediction).toHaveProperty('probability');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('priority');
      expect(prediction).toHaveProperty('featureImportance');
      expect(prediction).toHaveProperty('modelVersion');
      expect(prediction).toHaveProperty('isMLPrediction');
      expect(prediction.isMLPrediction).toBe(true);
    });

    it('should return score between 0 and 100', () => {
      const features = createMockFeatures();
      const prediction = mlSystem.scoreLeadML(features);

      expect(prediction.score).toBeGreaterThanOrEqual(0);
      expect(prediction.score).toBeLessThanOrEqual(100);
    });

    it('should return valid priority', () => {
      const features = createMockFeatures();
      const prediction = mlSystem.scoreLeadML(features);

      expect(['hot', 'warm', 'cold']).toContain(prediction.priority);
    });

    it('should classify high-quality leads as hot', () => {
      const highQuality = createMockFeatures({
        source: 'referral',
        hasPhone: true,
        hasEmail: true,
        messageLength: 200,
        listingViews: 10,
        pageViewCount: 15,
        timeOnSite: 600,
        scrollDepth: 100,
        hasViewedMultipleListings: true,
        isPreapproved: true,
        hasTimeline: true,
      });

      const prediction = mlSystem.scoreLeadML(highQuality);
      expect(prediction.priority).toBe('hot');
    });

    it('should score low-quality leads lower than high-quality', () => {
      const highQuality = createMockFeatures({
        source: 'referral',
        hasPhone: true,
        hasEmail: true,
        messageLength: 200,
        listingViews: 10,
        pageViewCount: 15,
        timeOnSite: 600,
        scrollDepth: 100,
        hasViewedMultipleListings: true,
        isPreapproved: true,
        hasTimeline: true,
      });

      const lowQuality = createMockFeatures({
        source: 'unknown',
        hasPhone: false,
        hasEmail: true,
        messageLength: 5,
        listingViews: 0,
        pageViewCount: 1,
        timeOnSite: 10,
        scrollDepth: 10,
        hasViewedMultipleListings: false,
        isPreapproved: false,
        hasTimeline: false,
      });

      const highPrediction = mlSystem.scoreLeadML(highQuality);
      const lowPrediction = mlSystem.scoreLeadML(lowQuality);

      // Low quality should score significantly lower than high quality
      expect(lowPrediction.score).toBeLessThan(highPrediction.score);
      expect(highPrediction.score - lowPrediction.score).toBeGreaterThan(10);
    });

    it('should include top feature contributions', () => {
      const features = createMockFeatures();
      const prediction = mlSystem.scoreLeadML(features);

      expect(prediction.featureImportance.length).toBeGreaterThan(0);
      expect(prediction.featureImportance.length).toBeLessThanOrEqual(5);

      prediction.featureImportance.forEach(contrib => {
        expect(contrib).toHaveProperty('feature');
        expect(contrib).toHaveProperty('value');
        expect(contrib).toHaveProperty('contribution');
        expect(contrib).toHaveProperty('direction');
        expect(['positive', 'negative', 'neutral']).toContain(contrib.direction);
      });
    });
  });

  describe('recordFeedback', () => {
    it('should update model with conversion feedback', () => {
      const features = createMockFeatures();
      const predBefore = mlSystem.scoreLeadML(features);

      // Record multiple positive conversions
      for (let i = 0; i < 10; i++) {
        mlSystem.recordFeedback(`lead_${i}`, features, true);
      }

      const predAfter = mlSystem.scoreLeadML(features);

      // Score should increase after positive feedback
      expect(predAfter.score).toBeGreaterThanOrEqual(predBefore.score);
    });
  });

  describe('retrainModel', () => {
    it('should throw error with insufficient examples', () => {
      expect(() => mlSystem.retrainModel()).toThrow('Need at least 10 examples');
    });

    it('should retrain successfully with enough examples', () => {
      // Add enough training examples
      for (let i = 0; i < 15; i++) {
        const converted = i % 2 === 0;
        const features = createMockFeatures({
          hasPhone: converted,
          messageLength: converted ? 200 : 10,
        });
        mlSystem.recordFeedback(`lead_${i}`, features, converted);
      }

      const result = mlSystem.retrainModel();

      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('auc');
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('export/import model', () => {
    it('should preserve model state after export/import', () => {
      const features = createMockFeatures();
      const predBefore = mlSystem.scoreLeadML(features);

      const exported = mlSystem.exportModel();

      const newSystem = new MLLeadScoringSystem();
      newSystem.importModel(exported);

      const predAfter = newSystem.scoreLeadML(features);

      expect(predAfter.score).toBe(predBefore.score);
    });

    it('should include model metadata in export', () => {
      const exported = mlSystem.exportModel();

      expect(exported).toHaveProperty('weights');
      expect(exported).toHaveProperty('bias');
      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('trainedAt');
      expect(exported).toHaveProperty('trainingExamples');
    });
  });

  describe('getModelStats', () => {
    it('should return model statistics', () => {
      const stats = mlSystem.getModelStats();

      expect(stats).toHaveProperty('version');
      expect(stats).toHaveProperty('trainingExamples');
      expect(stats).toHaveProperty('featureImportance');
      expect(Array.isArray(stats.featureImportance)).toBe(true);
    });

    it('should sort feature importance descending', () => {
      const stats = mlSystem.getModelStats();

      for (let i = 1; i < stats.featureImportance.length; i++) {
        expect(stats.featureImportance[i].importance)
          .toBeLessThanOrEqual(stats.featureImportance[i - 1].importance);
      }
    });
  });
});

// ============================================================================
// A/B Test Manager Tests
// ============================================================================

describe('ABTestManager', () => {
  let abManager: ABTestManager;

  beforeEach(() => {
    abManager = new ABTestManager();
  });

  describe('startTest', () => {
    it('should return test ID', () => {
      const testId = abManager.startTest(50);

      expect(testId).toBeTruthy();
      expect(testId).toContain('test_');
    });

    it('should enable testing', () => {
      abManager.startTest(50);
      const config = abManager.getConfig();

      expect(config.enabled).toBe(true);
    });

    it('should set traffic percentage', () => {
      abManager.startTest(70);
      const config = abManager.getConfig();

      expect(config.mlTrafficPercent).toBe(70);
    });
  });

  describe('stopTest', () => {
    it('should disable testing', () => {
      abManager.startTest(50);
      abManager.stopTest();
      const config = abManager.getConfig();

      expect(config.enabled).toBe(false);
    });
  });

  describe('assignVariant', () => {
    it('should return ml when test is disabled', () => {
      const variant = abManager.assignVariant('lead_123');

      expect(variant).toBe('ml');
    });

    it('should consistently assign same variant to same leadId', () => {
      abManager.startTest(50);

      const variant1 = abManager.assignVariant('lead_123');
      const variant2 = abManager.assignVariant('lead_123');

      expect(variant1).toBe(variant2);
    });

    it('should distribute variants based on traffic percentage', () => {
      abManager.startTest(50);

      let mlCount = 0;
      let rulesCount = 0;

      // Test with many lead IDs
      for (let i = 0; i < 1000; i++) {
        const variant = abManager.assignVariant(`lead_${i}`);
        if (variant === 'ml') mlCount++;
        else rulesCount++;
      }

      // Should be roughly 50/50 within tolerance
      const mlPercent = mlCount / 1000;
      expect(mlPercent).toBeGreaterThan(0.35);
      expect(mlPercent).toBeLessThan(0.65);
    });

    it('should respect traffic percentage setting', () => {
      abManager.startTest(90); // 90% ML

      let mlCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (abManager.assignVariant(`lead_${i}`) === 'ml') mlCount++;
      }

      const mlPercent = mlCount / 1000;
      expect(mlPercent).toBeGreaterThan(0.75);
    });
  });

  describe('recordResult', () => {
    it('should record test results', () => {
      abManager.startTest(50);

      abManager.recordResult({ variant: 'ml', leadId: 'lead_1', score: 75 });
      abManager.recordResult({ variant: 'rules', leadId: 'lead_2', score: 60 });

      const results = abManager.getResults();

      expect(results.length).toBe(2);
    });
  });

  describe('recordConversion', () => {
    it('should update conversion status', () => {
      abManager.startTest(50);

      abManager.recordResult({ variant: 'ml', leadId: 'lead_1', score: 75 });
      abManager.recordConversion('lead_1', true);

      const results = abManager.getResults();
      expect(results[0].converted).toBe(true);
    });
  });

  describe('analyzeResults', () => {
    it('should return analysis object', () => {
      abManager.startTest(50);

      // Add some results
      for (let i = 0; i < 20; i++) {
        const variant = i % 2 === 0 ? 'ml' : 'rules';
        abManager.recordResult({ variant, leadId: `lead_${i}`, score: 50 + i });
      }

      const analysis = abManager.analyzeResults();

      expect(analysis).toHaveProperty('testId');
      expect(analysis).toHaveProperty('duration');
      expect(analysis).toHaveProperty('mlResults');
      expect(analysis).toHaveProperty('rulesResults');
      expect(analysis).toHaveProperty('winner');
      expect(analysis).toHaveProperty('confidence');
    });

    it('should calculate conversion rates correctly', () => {
      abManager.startTest(50);

      // ML: 10 results, 5 conversions = 50%
      for (let i = 0; i < 10; i++) {
        abManager.recordResult({ variant: 'ml', leadId: `ml_${i}`, score: 50 });
        if (i < 5) abManager.recordConversion(`ml_${i}`, true);
      }

      // Rules: 10 results, 3 conversions = 30%
      for (let i = 0; i < 10; i++) {
        abManager.recordResult({ variant: 'rules', leadId: `rules_${i}`, score: 50 });
        if (i < 3) abManager.recordConversion(`rules_${i}`, true);
      }

      const analysis = abManager.analyzeResults();

      expect(analysis.mlResults.conversionRate).toBe(0.5);
      expect(analysis.rulesResults.conversionRate).toBe(0.3);
    });

    it('should handle empty results', () => {
      abManager.startTest(50);
      const analysis = abManager.analyzeResults();

      expect(analysis.mlResults.count).toBe(0);
      expect(analysis.rulesResults.count).toBe(0);
      expect(analysis.winner).toBe('inconclusive');
    });

    it('should determine winner with sufficient data and significance', () => {
      abManager.startTest(50);

      // Create very different conversion rates
      for (let i = 0; i < 100; i++) {
        abManager.recordResult({ variant: 'ml', leadId: `ml_${i}`, score: 50 });
        if (i < 80) abManager.recordConversion(`ml_${i}`, true); // 80% conversion
      }

      for (let i = 0; i < 100; i++) {
        abManager.recordResult({ variant: 'rules', leadId: `rules_${i}`, score: 50 });
        if (i < 20) abManager.recordConversion(`rules_${i}`, true); // 20% conversion
      }

      const analysis = abManager.analyzeResults();

      expect(analysis.winner).toBe('ml');
      expect(analysis.confidence).toBeGreaterThan(0.9);
    });
  });
});

// ============================================================================
// Unified Lead Scorer Tests
// ============================================================================

describe('UnifiedLeadScorer', () => {
  let scorer: UnifiedLeadScorer;

  beforeEach(() => {
    scorer = new UnifiedLeadScorer();
  });

  describe('scoreLead', () => {
    it('should return score result with variant', () => {
      const features = createMockFeatures();
      const result = scorer.scoreLead('lead_123', features);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('variant');
    });

    it('should use ML by default (no A/B test)', () => {
      const features = createMockFeatures();
      const result = scorer.scoreLead('lead_123', features);

      expect(result.variant).toBe('ml');
      expect(result.mlPrediction).toBeDefined();
    });

    it('should include ML prediction details when using ML variant', () => {
      const features = createMockFeatures();
      const result = scorer.scoreLead('lead_123', features);

      expect(result.mlPrediction).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.featureImportance).toBeDefined();
    });
  });

  describe('with A/B testing', () => {
    it('should assign variants during A/B test', () => {
      scorer.startABTest(50);

      let mlCount = 0;
      let rulesCount = 0;

      for (let i = 0; i < 100; i++) {
        const features = createMockFeatures();
        const result = scorer.scoreLead(`lead_${i}`, features);
        if (result.variant === 'ml') mlCount++;
        else rulesCount++;
      }

      expect(mlCount).toBeGreaterThan(0);
      expect(rulesCount).toBeGreaterThan(0);
    });

    it('should record results for analysis', () => {
      scorer.startABTest(50);

      for (let i = 0; i < 10; i++) {
        const features = createMockFeatures();
        scorer.scoreLead(`lead_${i}`, features);
      }

      scorer.stopABTest();
      const results = scorer.getABTestResults();

      expect(results.mlResults.count + results.rulesResults.count).toBe(10);
    });
  });

  describe('recordConversion', () => {
    it('should update both ML model and A/B test', () => {
      scorer.startABTest(50);

      const features = createMockFeatures();
      scorer.scoreLead('lead_1', features);
      scorer.recordConversion('lead_1', features, true);

      // Model should have training example
      const stats = scorer.getModelStats();
      expect(stats.trainingExamples).toBe(1);
    });
  });

  describe('model management', () => {
    it('should export and import model', () => {
      const features = createMockFeatures();
      const scoreBefore = scorer.scoreLead('lead_1', features).score;

      const exported = scorer.exportModel();

      const newScorer = new UnifiedLeadScorer();
      newScorer.importModel(exported);

      const scoreAfter = newScorer.scoreLead('lead_1', features).score;

      expect(scoreAfter).toBe(scoreBefore);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  describe('full lead scoring workflow', () => {
    it('should handle complete lead lifecycle', () => {
      const scorer = new UnifiedLeadScorer();

      // Score a new lead
      const features = createMockFeatures({
        source: 'google',
        hasPhone: true,
        messageLength: 150,
      });

      const initialScore = scorer.scoreLead('lead_workflow_1', features);
      expect(initialScore.score).toBeGreaterThan(0);

      // Record conversion
      scorer.recordConversion('lead_workflow_1', features, true);

      // Score similar lead - should be slightly higher after positive feedback
      const newFeatures = createMockFeatures({
        source: 'google',
        hasPhone: true,
        messageLength: 150,
      });

      const newScore = scorer.scoreLead('lead_workflow_2', newFeatures);
      expect(newScore.score).toBeGreaterThanOrEqual(initialScore.score - 5);
    });
  });

  describe('A/B test with conversions', () => {
    it('should track conversions across variants', () => {
      const scorer = new UnifiedLeadScorer();
      scorer.startABTest(50);

      // Simulate 50 leads with conversions
      for (let i = 0; i < 50; i++) {
        const features = createMockFeatures();
        scorer.scoreLead(`ab_lead_${i}`, features);

        // Randomly convert some
        if (Math.random() > 0.5) {
          scorer.recordConversion(`ab_lead_${i}`, features, true);
        }
      }

      scorer.stopABTest();
      const results = scorer.getABTestResults();

      expect(results.mlResults.count + results.rulesResults.count).toBe(50);
      expect(results.mlResults.conversions + results.rulesResults.conversions).toBeGreaterThan(0);
    });
  });

  describe('model retraining', () => {
    it('should improve after retraining with labeled data', () => {
      const scorer = new UnifiedLeadScorer();

      // Create clear pattern: high engagement = conversion
      const highEngagement = createMockFeatures({
        listingViews: 10,
        pageViewCount: 15,
        timeOnSite: 600,
        hasViewedMultipleListings: true,
      });

      const lowEngagement = createMockFeatures({
        listingViews: 0,
        pageViewCount: 1,
        timeOnSite: 10,
        hasViewedMultipleListings: false,
      });

      // Add training data
      for (let i = 0; i < 15; i++) {
        scorer.recordConversion(`high_${i}`, highEngagement, true);
        scorer.recordConversion(`low_${i}`, lowEngagement, false);
      }

      // Retrain
      scorer.retrainModel();

      // High engagement should score higher than low engagement
      const highScore = scorer.scoreLead('test_high', highEngagement).score;
      const lowScore = scorer.scoreLead('test_low', lowEngagement).score;

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });
});

// ============================================================================
// Convenience Function Tests
// ============================================================================

describe('Convenience Functions', () => {
  it('scoreLead should work as standalone function', () => {
    const features = createMockFeatures();
    const result = scoreLead('standalone_1', features);

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('priority');
  });

  it('recordConversion should work as standalone function', () => {
    const features = createMockFeatures();
    scoreLead('standalone_2', features);

    // Should not throw
    expect(() => {
      recordConversion('standalone_2', features, true);
    }).not.toThrow();
  });

  it('getUnifiedScorer should return singleton', () => {
    const scorer1 = getUnifiedScorer();
    const scorer2 = getUnifiedScorer();

    expect(scorer1).toBe(scorer2);
  });
});
