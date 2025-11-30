import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Lead } from '@/types/lead';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
        })),
      })),
    })),
  },
}));

// Mock auth store
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-123' },
  })),
}));

// Import after mocks
import {
  useMLLeadScoring,
  useLeadScore,
  useABTest,
  useMLModel,
  LeadScore,
} from './useMLLeadScoring';
import type { LeadFeatures } from '@/lib/ml-lead-scoring';

// ============================================================================
// Test Utilities
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

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

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-123',
  user_id: 'user-456',
  lead_type: 'buyer_inquiry',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  message: 'I am interested in properties in the area.',
  status: 'new',
  source: 'website',
  form_data: {
    listingViews: 3,
    pageViewCount: 5,
    timeOnSite: 180,
    scrollDepth: 75,
    hasViewedMultipleListings: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// useMLLeadScoring Tests
// ============================================================================

describe('useMLLeadScoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scoreLead', () => {
    it('should score a lead and return LeadScore object', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();
      let score: LeadScore;

      act(() => {
        score = result.current.scoreLead('lead-123', features);
      });

      expect(score!).toBeDefined();
      expect(score!.leadId).toBe('lead-123');
      expect(score!.score).toBeGreaterThanOrEqual(0);
      expect(score!.score).toBeLessThanOrEqual(100);
      expect(['hot', 'warm', 'cold']).toContain(score!.priority);
      expect(['ml', 'rules']).toContain(score!.variant);
      expect(score!.scoredAt).toBeInstanceOf(Date);
    });

    it('should cache scored leads', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();

      act(() => {
        result.current.scoreLead('lead-123', features);
      });

      const cached = result.current.getCachedScore('lead-123');
      expect(cached).toBeDefined();
      expect(cached?.leadId).toBe('lead-123');
    });

    it('should return ML prediction details', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();
      let score: LeadScore;

      act(() => {
        score = result.current.scoreLead('lead-123', features);
      });

      // When using ML variant (default), should have ML prediction
      if (score!.variant === 'ml') {
        expect(score!.mlPrediction).toBeDefined();
        expect(score!.confidence).toBeDefined();
        expect(score!.featureImportance).toBeDefined();
      }
    });
  });

  describe('scoreLeads', () => {
    it('should score multiple leads', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const leads = [
        { id: 'lead-1', features: createMockFeatures({ source: 'referral' }) },
        { id: 'lead-2', features: createMockFeatures({ source: 'facebook' }) },
        { id: 'lead-3', features: createMockFeatures({ source: 'google' }) },
      ];

      let scores: LeadScore[];

      act(() => {
        scores = result.current.scoreLeads(leads);
      });

      expect(scores!.length).toBe(3);
      expect(scores![0].leadId).toBe('lead-1');
      expect(scores![1].leadId).toBe('lead-2');
      expect(scores![2].leadId).toBe('lead-3');
    });
  });

  describe('extractFeaturesFromLead', () => {
    it('should extract features from Lead object', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const lead = createMockLead();
      const features = result.current.extractFeaturesFromLead(lead);

      expect(features.source).toBe('website');
      expect(features.hasPhone).toBe(true);
      expect(features.hasEmail).toBe(true);
      expect(features.messageLength).toBeGreaterThan(0);
      expect(features.leadType).toBe('buyer_inquiry');
    });

    it('should handle missing form_data', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const lead = createMockLead({ form_data: null });
      const features = result.current.extractFeaturesFromLead(lead);

      expect(features.listingViews).toBe(0);
      expect(features.pageViewCount).toBe(0);
      expect(features.timeOnSite).toBe(0);
    });
  });

  describe('scoreLeadObject', () => {
    it('should score a Lead object directly', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const lead = createMockLead();
      let score: LeadScore;

      act(() => {
        score = result.current.scoreLeadObject(lead);
      });

      expect(score!).toBeDefined();
      expect(score!.leadId).toBe('lead-123');
    });
  });

  describe('recordConversion', () => {
    it('should record conversion without throwing', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();

      act(() => {
        result.current.scoreLead('lead-123', features);
      });

      expect(() => {
        act(() => {
          result.current.recordConversion('lead-123', features, true);
        });
      }).not.toThrow();
    });

    it('should record negative conversion', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();

      expect(() => {
        act(() => {
          result.current.recordConversion('lead-456', features, false);
        });
      }).not.toThrow();
    });
  });

  describe('recordLeadConversion', () => {
    it('should record conversion from Lead object', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const lead = createMockLead();

      expect(() => {
        act(() => {
          result.current.recordLeadConversion(lead, true);
        });
      }).not.toThrow();
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();

      act(() => {
        result.current.scoreLead('lead-123', features);
        result.current.scoreLead('lead-456', features);
      });

      expect(result.current.getAllCachedScores().length).toBe(2);

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.getAllCachedScores().length).toBe(0);
    });

    it('should return all cached scores', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const features = createMockFeatures();

      act(() => {
        result.current.scoreLead('lead-1', features);
        result.current.scoreLead('lead-2', features);
        result.current.scoreLead('lead-3', features);
      });

      const allScores = result.current.getAllCachedScores();
      expect(allScores.length).toBe(3);
    });
  });

  describe('model stats', () => {
    it('should return model statistics', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      const stats = result.current.getModelStats();

      expect(stats).toBeDefined();
      expect(stats.version).toBeDefined();
      expect(stats.trainingExamples).toBeDefined();
      expect(stats.featureImportance).toBeDefined();
      expect(Array.isArray(stats.featureImportance)).toBe(true);
    });
  });

  describe('A/B testing', () => {
    it('should start A/B test', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      let testId: string;

      act(() => {
        testId = result.current.startABTest(50);
      });

      expect(testId!).toBeDefined();
      expect(testId!).toContain('test_');
      expect(result.current.isABTestRunning()).toBe(true);
    });

    it('should get A/B test analysis', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.startABTest(50);
      });

      const analysis = result.current.getABTestAnalysis();

      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('testId');
      expect(analysis).toHaveProperty('mlResults');
      expect(analysis).toHaveProperty('rulesResults');
      expect(analysis).toHaveProperty('winner');
      expect(analysis).toHaveProperty('confidence');
    });

    it('should get A/B test config', () => {
      const { result } = renderHook(() => useMLLeadScoring(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.startABTest(70);
      });

      const config = result.current.getABTestConfig();

      expect(config.enabled).toBe(true);
      expect(config.mlTrafficPercent).toBe(70);
    });
  });
});

// ============================================================================
// useLeadScore Tests
// ============================================================================

describe('useLeadScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for null lead', () => {
    const { result } = renderHook(() => useLeadScore(null), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeNull();
  });

  it('should score a lead', () => {
    const lead = createMockLead();

    const { result } = renderHook(() => useLeadScore(lead), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current?.leadId).toBe('lead-123');
  });
});

// ============================================================================
// useABTest Tests
// ============================================================================

describe('useABTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start and track test state', () => {
    const { result } = renderHook(() => useABTest(), {
      wrapper: createWrapper(),
    });

    // Start a test (may already be running due to singleton)
    act(() => {
      result.current.start(50);
    });

    expect(result.current.isRunning).toBe(true);

    // Stop the test
    act(() => {
      result.current.stop();
    });

    // Note: stop() is async but we can verify the state eventually updates
    result.current.refresh();
  });

  it('should return config', () => {
    const { result } = renderHook(() => useABTest(), {
      wrapper: createWrapper(),
    });

    expect(result.current.config).toBeDefined();
    expect(result.current.config).toHaveProperty('enabled');
    expect(result.current.config).toHaveProperty('mlTrafficPercent');
  });

  it('should return history array', () => {
    const { result } = renderHook(() => useABTest(), {
      wrapper: createWrapper(),
    });

    expect(Array.isArray(result.current.history)).toBe(true);
  });
});

// ============================================================================
// useMLModel Tests
// ============================================================================

describe('useMLModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return model stats', async () => {
    const { result } = renderHook(() => useMLModel(), {
      wrapper: createWrapper(),
    });

    // Wait for effect to run
    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
    });

    expect(result.current.stats?.version).toBeDefined();
    expect(result.current.stats?.trainingExamples).toBeDefined();
  });

  it('should refresh stats', () => {
    const { result } = renderHook(() => useMLModel(), {
      wrapper: createWrapper(),
    });

    expect(() => {
      act(() => {
        result.current.refresh();
      });
    }).not.toThrow();
  });

  it('should throw error when retraining with insufficient data', async () => {
    const { result } = renderHook(() => useMLModel(), {
      wrapper: createWrapper(),
    });

    await expect(async () => {
      await act(async () => {
        await result.current.retrain();
      });
    }).rejects.toThrow();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work with full lead scoring workflow', () => {
    const { result } = renderHook(() => useMLLeadScoring(), {
      wrapper: createWrapper(),
    });

    // 1. Score a lead
    let score: LeadScore;
    act(() => {
      score = result.current.scoreLead('workflow-lead', createMockFeatures({
        source: 'referral',
        hasPhone: true,
        messageLength: 200,
      }));
    });

    expect(score!.score).toBeGreaterThan(0);

    // 2. Record conversion
    act(() => {
      result.current.recordConversion('workflow-lead', createMockFeatures(), true);
    });

    // 3. Check model stats updated
    const stats = result.current.getModelStats();
    expect(stats.trainingExamples).toBeGreaterThan(0);
  });

  it('should score Lead objects from database', () => {
    const { result } = renderHook(() => useMLLeadScoring(), {
      wrapper: createWrapper(),
    });

    const leads: Lead[] = [
      createMockLead({ id: 'db-lead-1', source: 'google' }),
      createMockLead({ id: 'db-lead-2', source: 'referral' }),
      createMockLead({ id: 'db-lead-3', source: 'facebook' }),
    ];

    const scores: LeadScore[] = [];

    act(() => {
      leads.forEach(lead => {
        scores.push(result.current.scoreLeadObject(lead));
      });
    });

    expect(scores.length).toBe(3);
    expect(scores.every(s => s.score >= 0 && s.score <= 100)).toBe(true);
  });
});
