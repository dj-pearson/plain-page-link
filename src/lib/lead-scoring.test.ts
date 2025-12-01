import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeadScoringSystem, calculateLeadScore, getLeadPriority, analyzeLead } from './lead-scoring';

describe('LeadScoringSystem', () => {
  describe('calculateScore', () => {
    it('should return 0-100 score', () => {
      const score = LeadScoringSystem.calculateScore({
        source: 'direct',
        hasPhone: true,
        hasEmail: true,
        messageLength: 100,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score for referral source', () => {
      const referralScore = LeadScoringSystem.calculateScore({
        source: 'referral',
        hasPhone: false,
        hasEmail: true,
        messageLength: 50,
      });
      const facebookScore = LeadScoringSystem.calculateScore({
        source: 'facebook',
        hasPhone: false,
        hasEmail: true,
        messageLength: 50,
      });
      expect(referralScore).toBeGreaterThan(facebookScore);
    });

    it('should give bonus for having phone number', () => {
      const withPhone = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: true,
        hasEmail: false,
        messageLength: 50,
      });
      const withoutPhone = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
      });
      expect(withPhone - withoutPhone).toBe(15);
    });

    it('should give bonus for having email', () => {
      const withEmail = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: true,
        messageLength: 50,
      });
      const withoutEmail = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
      });
      expect(withEmail - withoutEmail).toBe(5);
    });

    it('should score longer messages higher', () => {
      const longMessage = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 200,
      });
      const shortMessage = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 5,
      });
      expect(longMessage).toBeGreaterThan(shortMessage);
    });

    it('should handle zero message length', () => {
      const score = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 0,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should give engagement bonus for listing views', () => {
      const withViews = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
        listingViews: 5,
      });
      const withoutViews = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
        listingViews: 0,
      });
      expect(withViews).toBeGreaterThan(withoutViews);
    });

    it('should give timing bonus for business hours', () => {
      const businessHours = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
        timeOfDay: 10, // 10 AM
        dayOfWeek: 2, // Tuesday
      });
      const offHours = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
        timeOfDay: 3, // 3 AM
        dayOfWeek: 0, // Sunday
      });
      expect(businessHours).toBeGreaterThan(offHours);
    });

    it('should give bonus for viewing multiple listings', () => {
      const multipleListings = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
        hasViewedMultipleListings: true,
      });
      const singleListing = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
        hasViewedMultipleListings: false,
      });
      expect(multipleListings - singleListing).toBe(5);
    });

    it('should handle unknown source with default score', () => {
      const score = LeadScoringSystem.calculateScore({
        source: 'unknown_source',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should cap score at 100', () => {
      // Max everything out
      const score = LeadScoringSystem.calculateScore({
        source: 'referral', // 30 points
        hasPhone: true, // 15 points
        hasEmail: true, // 5 points
        messageLength: 500, // 15 points
        listingViews: 10, // 8 points
        pageViewCount: 20, // 7 points
        timeOnSite: 1200, // 5 points (20 min)
        hasViewedMultipleListings: true, // 5 points
        timeOfDay: 10, // business hours bonus
        dayOfWeek: 2, // weekday bonus
      });
      expect(score).toBe(100);
    });
  });

  describe('getPriority', () => {
    it('should return "hot" for scores >= 70', () => {
      expect(LeadScoringSystem.getPriority(70)).toBe('hot');
      expect(LeadScoringSystem.getPriority(85)).toBe('hot');
      expect(LeadScoringSystem.getPriority(100)).toBe('hot');
    });

    it('should return "warm" for scores >= 40 and < 70', () => {
      expect(LeadScoringSystem.getPriority(40)).toBe('warm');
      expect(LeadScoringSystem.getPriority(55)).toBe('warm');
      expect(LeadScoringSystem.getPriority(69)).toBe('warm');
    });

    it('should return "cold" for scores < 40', () => {
      expect(LeadScoringSystem.getPriority(0)).toBe('cold');
      expect(LeadScoringSystem.getPriority(20)).toBe('cold');
      expect(LeadScoringSystem.getPriority(39)).toBe('cold');
    });
  });

  describe('getRecommendedActions', () => {
    it('should recommend immediate call for hot leads', () => {
      const actions = LeadScoringSystem.getRecommendedActions(75, {
        source: 'referral',
        hasPhone: true,
        hasEmail: true,
        messageLength: 100,
      });
      expect(actions).toContain('📞 Call immediately');
      expect(actions).toContain('⚡ Send personalized message within 5 minutes');
    });

    it('should recommend email for warm leads', () => {
      const actions = LeadScoringSystem.getRecommendedActions(50, {
        source: 'website',
        hasPhone: true,
        hasEmail: true,
        messageLength: 50,
      });
      expect(actions).toContain('✉️ Send email within 1 hour');
      expect(actions).toContain('📋 Add to follow-up list');
    });

    it('should recommend nurture campaign for cold leads', () => {
      const actions = LeadScoringSystem.getRecommendedActions(25, {
        source: 'facebook',
        hasPhone: false,
        hasEmail: true,
        messageLength: 10,
      });
      expect(actions).toContain('📧 Add to nurture campaign');
      expect(actions).toContain('📊 Monitor engagement');
    });

    it('should suggest requesting phone if missing', () => {
      const actions = LeadScoringSystem.getRecommendedActions(50, {
        source: 'website',
        hasPhone: false,
        hasEmail: true,
        messageLength: 50,
      });
      expect(actions).toContain('📱 Request phone number');
    });

    it('should suggest similar properties if multiple viewed', () => {
      const actions = LeadScoringSystem.getRecommendedActions(50, {
        source: 'website',
        hasPhone: true,
        hasEmail: true,
        messageLength: 50,
        hasViewedMultipleListings: true,
      });
      expect(actions).toContain('🏘️ Suggest similar properties');
    });
  });

  describe('calculateAgeDecay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 1.0 for leads less than 1 hour old', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
      expect(LeadScoringSystem.calculateAgeDecay(thirtyMinAgo)).toBe(1.0);
    });

    it('should return 0.9 for leads 1-24 hours old', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(LeadScoringSystem.calculateAgeDecay(twoHoursAgo)).toBe(0.9);
    });

    it('should return 0.7 for leads 24-72 hours old', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      expect(LeadScoringSystem.calculateAgeDecay(twoDaysAgo)).toBe(0.7);
    });

    it('should return 0.5 for leads 3-7 days old', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      expect(LeadScoringSystem.calculateAgeDecay(fiveDaysAgo)).toBe(0.5);
    });

    it('should return 0.3 for leads over 7 days old', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      expect(LeadScoringSystem.calculateAgeDecay(tenDaysAgo)).toBe(0.3);
    });
  });

  describe('analyzeLead', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return complete analysis object', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const result = LeadScoringSystem.analyzeLead({
        source: 'referral',
        hasPhone: true,
        hasEmail: true,
        messageLength: 150,
        createdAt: now,
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('ageDecay');
      expect(result).toHaveProperty('adjustedScore');
      expect(result).toHaveProperty('actions');
      expect(result).toHaveProperty('insights');
    });

    it('should apply age decay to adjusted score', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const result = LeadScoringSystem.analyzeLead({
        source: 'referral',
        hasPhone: true,
        hasEmail: true,
        messageLength: 150,
        createdAt: twoDaysAgo,
      });

      expect(result.ageDecay).toBe(0.7);
      expect(result.adjustedScore).toBe(Math.round(result.score * 0.7));
    });

    it('should generate insights for high-quality leads', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const result = LeadScoringSystem.analyzeLead({
        source: 'referral',
        hasPhone: true,
        hasEmail: true,
        messageLength: 150,
        hasViewedMultipleListings: true,
        pageViewCount: 10,
        createdAt: now,
      });

      expect(result.insights.some(i => i.includes('High-quality lead'))).toBe(true);
      expect(result.insights.some(i => i.includes('Actively shopping'))).toBe(true);
      expect(result.insights.some(i => i.includes('Detailed inquiry'))).toBe(true);
      expect(result.insights.some(i => i.includes('Complete contact info'))).toBe(true);
      expect(result.insights.some(i => i.includes('Referred lead'))).toBe(true);
      expect(result.insights.some(i => i.includes('High engagement'))).toBe(true);
    });

    it('should provide standard insight for low-engagement leads', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const result = LeadScoringSystem.analyzeLead({
        source: 'facebook',
        hasPhone: false,
        hasEmail: true,
        messageLength: 5,
        createdAt: now,
      });

      expect(result.insights.some(i => i.includes('Standard lead'))).toBe(true);
    });
  });

  describe('exported convenience functions', () => {
    it('calculateLeadScore should work as standalone function', () => {
      const score = calculateLeadScore({
        source: 'website',
        hasPhone: true,
        hasEmail: true,
        messageLength: 100,
      });
      expect(score).toBeGreaterThan(0);
    });

    it('getLeadPriority should work as standalone function', () => {
      expect(getLeadPriority(75)).toBe('hot');
      expect(getLeadPriority(50)).toBe('warm');
      expect(getLeadPriority(20)).toBe('cold');
    });

    it('analyzeLead should work as standalone function', () => {
      const result = analyzeLead({
        source: 'website',
        hasPhone: true,
        hasEmail: true,
        messageLength: 100,
        createdAt: new Date(),
      });
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('priority');
    });
  });

  describe('edge cases', () => {
    it('should handle negative values gracefully', () => {
      const score = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: false,
        hasEmail: false,
        messageLength: -10,
        listingViews: -5,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large values', () => {
      const score = LeadScoringSystem.calculateScore({
        source: 'website',
        hasPhone: true,
        hasEmail: true,
        messageLength: 1000000,
        listingViews: 1000,
        pageViewCount: 1000,
        timeOnSite: 100000,
      });
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle empty source string', () => {
      const score = LeadScoringSystem.calculateScore({
        source: '',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should be case-insensitive for source', () => {
      const lowerScore = LeadScoringSystem.calculateScore({
        source: 'referral',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
      });
      const upperScore = LeadScoringSystem.calculateScore({
        source: 'REFERRAL',
        hasPhone: false,
        hasEmail: false,
        messageLength: 50,
      });
      expect(lowerScore).toBe(upperScore);
    });
  });
});
