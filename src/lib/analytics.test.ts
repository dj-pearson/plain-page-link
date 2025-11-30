import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsEngine,
  AnalyticsData,
  TimeSeriesData,
  LeadSourceMetric,
} from './analytics';

describe('AnalyticsEngine', () => {
  const createMockAnalyticsData = (overrides: Partial<AnalyticsData> = {}): AnalyticsData => ({
    pageViews: 1000,
    uniqueVisitors: 500,
    leads: 50,
    conversions: 10,
    revenue: 50000,
    avgResponseTime: 15,
    period: 'week',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-07'),
    ...overrides,
  });

  describe('calculateKPIs', () => {
    it('should return array of performance metrics', () => {
      const current = createMockAnalyticsData();
      const previous = createMockAnalyticsData({ pageViews: 800 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);

      expect(Array.isArray(kpis)).toBe(true);
      expect(kpis.length).toBe(8);
    });

    it('should calculate correct percentage changes', () => {
      const current = createMockAnalyticsData({ pageViews: 1200 });
      const previous = createMockAnalyticsData({ pageViews: 1000 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);
      const pageViewsKpi = kpis.find((k) => k.name === 'Total Page Views');

      expect(pageViewsKpi?.change).toBe(20); // 20% increase
      expect(pageViewsKpi?.trend).toBe('up');
    });

    it('should mark flat trend for small changes', () => {
      const current = createMockAnalyticsData({ pageViews: 1010 });
      const previous = createMockAnalyticsData({ pageViews: 1000 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);
      const pageViewsKpi = kpis.find((k) => k.name === 'Total Page Views');

      expect(pageViewsKpi?.trend).toBe('flat'); // 1% change is within threshold
    });

    it('should handle lowerIsBetter metrics (response time)', () => {
      const current = createMockAnalyticsData({ avgResponseTime: 10 });
      const previous = createMockAnalyticsData({ avgResponseTime: 20 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);
      const responseTimeKpi = kpis.find((k) => k.name === 'Avg Response Time');

      // Decrease in response time should be "up" trend (good)
      expect(responseTimeKpi?.trend).toBe('up');
    });

    it('should calculate conversion rate correctly', () => {
      const current = createMockAnalyticsData({ leads: 100, conversions: 25 });
      const previous = createMockAnalyticsData({ leads: 100, conversions: 20 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);
      const conversionRateKpi = kpis.find((k) => k.name === 'Conversion Rate');

      expect(conversionRateKpi?.value).toBe(25); // 25%
      expect(conversionRateKpi?.unit).toBe('%');
    });

    it('should handle zero previous value', () => {
      const current = createMockAnalyticsData({ pageViews: 100 });
      const previous = createMockAnalyticsData({ pageViews: 0 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);
      const pageViewsKpi = kpis.find((k) => k.name === 'Total Page Views');

      expect(pageViewsKpi?.change).toBe(100);
    });

    it('should handle zero values', () => {
      const current = createMockAnalyticsData({ leads: 0, conversions: 0 });
      const previous = createMockAnalyticsData({ leads: 0, conversions: 0 });

      const kpis = AnalyticsEngine.calculateKPIs(current, previous);
      const conversionRateKpi = kpis.find((k) => k.name === 'Conversion Rate');

      expect(conversionRateKpi?.value).toBe(0);
    });
  });

  describe('generateTimeSeries', () => {
    it('should generate time series for date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      const timeSeries = AnalyticsEngine.generateTimeSeries(
        startDate,
        endDate,
        () => 100
      );

      expect(timeSeries.length).toBe(7); // 7 days
      expect(timeSeries[0].value).toBe(100);
    });

    it('should format dates correctly', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-17');

      const timeSeries = AnalyticsEngine.generateTimeSeries(
        startDate,
        endDate,
        () => 50
      );

      expect(timeSeries[0].date).toBe('Jan 15');
      expect(timeSeries[1].date).toBe('Jan 16');
      expect(timeSeries[2].date).toBe('Jan 17');
    });

    it('should call data generator for each day', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-03');
      const generator = vi.fn().mockReturnValue(100);

      AnalyticsEngine.generateTimeSeries(startDate, endDate, generator);

      expect(generator).toHaveBeenCalledTimes(3);
    });
  });

  describe('calculateFunnel', () => {
    it('should calculate funnel stages correctly', () => {
      const funnel = AnalyticsEngine.calculateFunnel({
        visitors: 1000,
        viewed: 500,
        contacted: 100,
        qualified: 50,
        converted: 10,
      });

      expect(funnel.length).toBe(5);
      expect(funnel[0].name).toBe('Visitors');
      expect(funnel[0].percentage).toBe(100);
      expect(funnel[1].percentage).toBe(50); // 500/1000 = 50%
      expect(funnel[2].percentage).toBe(10); // 100/1000 = 10%
      expect(funnel[4].percentage).toBe(1); // 10/1000 = 1%
    });

    it('should calculate dropoff correctly', () => {
      const funnel = AnalyticsEngine.calculateFunnel({
        visitors: 1000,
        viewed: 800,
        contacted: 200,
        qualified: 100,
        converted: 50,
      });

      expect(funnel[1].dropoff).toBe(200); // 1000 - 800
      expect(funnel[2].dropoff).toBe(600); // 800 - 200
      expect(funnel[3].dropoff).toBe(100); // 200 - 100
      expect(funnel[4].dropoff).toBe(50); // 100 - 50
    });

    it('should handle zero visitors', () => {
      const funnel = AnalyticsEngine.calculateFunnel({
        visitors: 0,
        viewed: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
      });

      expect(funnel[0].percentage).toBe(100); // First stage always 100%
      expect(funnel[1].percentage).toBe(0);
    });
  });

  describe('analyzeLeadSources', () => {
    it('should calculate conversion rates for each source', () => {
      const sources = [
        { source: 'Google', leads: 100, conversions: 20, revenue: 10000 },
        { source: 'Facebook', leads: 50, conversions: 5, revenue: 2500 },
      ];

      const analysis = AnalyticsEngine.analyzeLeadSources(sources);

      expect(analysis[0].conversionRate).toBe(20); // 20/100 = 20%
      expect(analysis[1].conversionRate).toBe(10); // 5/50 = 10%
    });

    it('should calculate ROI when cost is provided', () => {
      const sources = [
        {
          source: 'Google Ads',
          leads: 100,
          conversions: 20,
          revenue: 10000,
          cost: 2000,
        },
      ];

      const analysis = AnalyticsEngine.analyzeLeadSources(sources);

      expect(analysis[0].roi).toBe(400); // (10000 - 2000) / 2000 * 100 = 400%
    });

    it('should return undefined ROI when cost is not provided', () => {
      const sources = [
        { source: 'Organic', leads: 100, conversions: 20, revenue: 10000 },
      ];

      const analysis = AnalyticsEngine.analyzeLeadSources(sources);

      expect(analysis[0].roi).toBeUndefined();
    });

    it('should handle zero leads', () => {
      const sources = [
        { source: 'Empty', leads: 0, conversions: 0, revenue: 0 },
      ];

      const analysis = AnalyticsEngine.analyzeLeadSources(sources);

      expect(analysis[0].conversionRate).toBe(0);
    });
  });

  describe('rankListings', () => {
    it('should sort listings by conversion rate descending', () => {
      const listings = [
        { id: '1', title: 'Low Performer', views: 100, leads: 5, avgTimeOnPage: 60, shareCount: 2 },
        { id: '2', title: 'High Performer', views: 100, leads: 20, avgTimeOnPage: 120, shareCount: 10 },
        { id: '3', title: 'Medium Performer', views: 100, leads: 10, avgTimeOnPage: 90, shareCount: 5 },
      ];

      const ranked = AnalyticsEngine.rankListings(listings);

      expect(ranked[0].title).toBe('High Performer');
      expect(ranked[1].title).toBe('Medium Performer');
      expect(ranked[2].title).toBe('Low Performer');
    });

    it('should calculate conversion rate for each listing', () => {
      const listings = [
        { id: '1', title: 'Test', views: 200, leads: 20, avgTimeOnPage: 60, shareCount: 5 },
      ];

      const ranked = AnalyticsEngine.rankListings(listings);

      expect(ranked[0].conversionRate).toBe(10); // 20/200 = 10%
    });

    it('should handle zero views', () => {
      const listings = [
        { id: '1', title: 'New Listing', views: 0, leads: 0, avgTimeOnPage: 0, shareCount: 0 },
      ];

      const ranked = AnalyticsEngine.rankListings(listings);

      expect(ranked[0].conversionRate).toBe(0);
    });
  });

  describe('predictTrend', () => {
    it('should return empty array for less than 2 data points', () => {
      const data: TimeSeriesData[] = [{ date: 'Jan 1', value: 100 }];

      const predictions = AnalyticsEngine.predictTrend(data, 3);

      expect(predictions.length).toBe(0);
    });

    it('should predict increasing trend', () => {
      const data: TimeSeriesData[] = [
        { date: 'Jan 1', value: 100 },
        { date: 'Jan 2', value: 110 },
        { date: 'Jan 3', value: 120 },
        { date: 'Jan 4', value: 130 },
        { date: 'Jan 5', value: 140 },
      ];

      const predictions = AnalyticsEngine.predictTrend(data, 3);

      expect(predictions.length).toBe(3);
      // Values should continue increasing
      expect(predictions[0].value).toBeGreaterThan(140);
      expect(predictions[1].value).toBeGreaterThan(predictions[0].value);
    });

    it('should label predictions correctly', () => {
      const data: TimeSeriesData[] = [
        { date: 'Jan 1', value: 100 },
        { date: 'Jan 2', value: 110 },
      ];

      const predictions = AnalyticsEngine.predictTrend(data, 2);

      expect(predictions[0].label).toBe('predicted');
      expect(predictions[1].label).toBe('predicted');
    });

    it('should not predict negative values', () => {
      const data: TimeSeriesData[] = [
        { date: 'Jan 1', value: 100 },
        { date: 'Jan 2', value: 50 },
        { date: 'Jan 3', value: 25 },
        { date: 'Jan 4', value: 10 },
        { date: 'Jan 5', value: 5 },
      ];

      const predictions = AnalyticsEngine.predictTrend(data, 10);

      predictions.forEach((p) => {
        expect(p.value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('calculateEngagementScore', () => {
    it('should return score between 0-100', () => {
      const score = AnalyticsEngine.calculateEngagementScore({
        avgTimeOnPage: 60,
        bounceRate: 50,
        pagesPerSession: 3,
        returnVisitorRate: 30,
      });

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give max score for excellent metrics', () => {
      const score = AnalyticsEngine.calculateEngagementScore({
        avgTimeOnPage: 300, // 5 minutes (above 3 min threshold)
        bounceRate: 0, // Perfect
        pagesPerSession: 10, // Above 5 pages threshold
        returnVisitorRate: 100, // Perfect
      });

      expect(score).toBe(100);
    });

    it('should give lower score for poor metrics', () => {
      const score = AnalyticsEngine.calculateEngagementScore({
        avgTimeOnPage: 10, // Very short
        bounceRate: 90, // Very high
        pagesPerSession: 1, // Only one page
        returnVisitorRate: 5, // Very few return
      });

      expect(score).toBeLessThan(30);
    });

    it('should handle zero values', () => {
      const score = AnalyticsEngine.calculateEngagementScore({
        avgTimeOnPage: 0,
        bounceRate: 100,
        pagesPerSession: 0,
        returnVisitorRate: 0,
      });

      expect(score).toBe(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insight for lead increase', () => {
      const current = createMockAnalyticsData({ leads: 100 });
      const previous = createMockAnalyticsData({ leads: 50 });
      const sources: LeadSourceMetric[] = [];

      const insights = AnalyticsEngine.generateInsights(current, previous, sources);

      expect(insights.some((i) => i.includes('Lead generation is up'))).toBe(true);
    });

    it('should generate warning for lead decrease', () => {
      const current = createMockAnalyticsData({ leads: 30 });
      const previous = createMockAnalyticsData({ leads: 50 });
      const sources: LeadSourceMetric[] = [];

      const insights = AnalyticsEngine.generateInsights(current, previous, sources);

      expect(insights.some((i) => i.includes('Lead generation is down'))).toBe(true);
    });

    it('should generate insight for good response time', () => {
      const current = createMockAnalyticsData({ avgResponseTime: 3 });
      const previous = createMockAnalyticsData({ avgResponseTime: 10 });
      const sources: LeadSourceMetric[] = [];

      const insights = AnalyticsEngine.generateInsights(current, previous, sources);

      expect(insights.some((i) => i.includes('Excellent response time'))).toBe(true);
    });

    it('should generate warning for slow response time', () => {
      const current = createMockAnalyticsData({ avgResponseTime: 90 });
      const previous = createMockAnalyticsData({ avgResponseTime: 60 });
      const sources: LeadSourceMetric[] = [];

      const insights = AnalyticsEngine.generateInsights(current, previous, sources);

      expect(insights.some((i) => i.includes('Response time is high'))).toBe(true);
    });

    it('should highlight best performing source', () => {
      const current = createMockAnalyticsData();
      const previous = createMockAnalyticsData();
      const sources: LeadSourceMetric[] = [
        {
          source: 'Google',
          leads: 100,
          conversions: 20,
          conversionRate: 20,
          revenue: 10000,
        },
        {
          source: 'Facebook',
          leads: 50,
          conversions: 5,
          conversionRate: 10,
          revenue: 2500,
        },
      ];

      const insights = AnalyticsEngine.generateInsights(current, previous, sources);

      expect(insights.some((i) => i.includes('Google is your best performing source'))).toBe(true);
    });

    it('should generate insight for traffic surge', () => {
      const current = createMockAnalyticsData({ uniqueVisitors: 1000 });
      const previous = createMockAnalyticsData({ uniqueVisitors: 500 });
      const sources: LeadSourceMetric[] = [];

      const insights = AnalyticsEngine.generateInsights(current, previous, sources);

      expect(insights.some((i) => i.includes('Traffic is surging'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty sources array', () => {
      const analysis = AnalyticsEngine.analyzeLeadSources([]);
      expect(analysis).toEqual([]);
    });

    it('should handle empty listings array', () => {
      const ranked = AnalyticsEngine.rankListings([]);
      expect(ranked).toEqual([]);
    });

    it('should handle empty time series for predictions', () => {
      const predictions = AnalyticsEngine.predictTrend([], 5);
      expect(predictions).toEqual([]);
    });

    it('should handle negative ROI', () => {
      const sources = [
        {
          source: 'Expensive Ads',
          leads: 10,
          conversions: 1,
          revenue: 500,
          cost: 1000,
        },
      ];

      const analysis = AnalyticsEngine.analyzeLeadSources(sources);

      expect(analysis[0].roi).toBe(-50); // (500 - 1000) / 1000 * 100 = -50%
    });
  });
});
