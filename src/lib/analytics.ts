/**
 * Analytics Engine
 * Processes and calculates analytics metrics for the dashboard
 */

import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    eachDayOfInterval,
} from "date-fns";

// Types
export interface AnalyticsData {
    pageViews: number;
    uniqueVisitors: number;
    leads: number;
    conversions: number;
    revenue: number;
    avgResponseTime: number; // minutes
    period: "day" | "week" | "month" | "year";
    startDate: Date;
    endDate: Date;
}

export interface TimeSeriesData {
    date: string;
    value: number;
    label?: string;
}

export interface FunnelStage {
    name: string;
    count: number;
    percentage: number;
    dropoff?: number;
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    change: number; // percentage change
    trend: "up" | "down" | "flat";
    benchmark?: number;
}

export interface LeadSourceMetric {
    source: string;
    leads: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    roi?: number;
}

export interface ListingPerformance {
    id: string;
    title: string;
    views: number;
    leads: number;
    conversionRate: number;
    avgTimeOnPage: number; // seconds
    shareCount: number;
}

/**
 * Analytics Engine Class
 */
export class AnalyticsEngine {
    /**
     * Calculate key performance indicators
     */
    static calculateKPIs(
        current: AnalyticsData,
        previous: AnalyticsData
    ): PerformanceMetric[] {
        return [
            this.createMetric(
                "Total Page Views",
                current.pageViews,
                "",
                previous.pageViews
            ),
            this.createMetric(
                "Unique Visitors",
                current.uniqueVisitors,
                "",
                previous.uniqueVisitors
            ),
            this.createMetric("Total Leads", current.leads, "", previous.leads),
            this.createMetric(
                "Conversions",
                current.conversions,
                "",
                previous.conversions
            ),
            this.createMetric(
                "Revenue",
                current.revenue,
                "$",
                previous.revenue
            ),
            this.createMetric(
                "Avg Response Time",
                current.avgResponseTime,
                "min",
                previous.avgResponseTime,
                true // lower is better
            ),
            this.createMetric(
                "Conversion Rate",
                this.calculateConversionRate(
                    current.leads,
                    current.conversions
                ),
                "%",
                this.calculateConversionRate(
                    previous.leads,
                    previous.conversions
                )
            ),
            this.createMetric(
                "Lead-to-Visitor Rate",
                this.calculateConversionRate(
                    current.uniqueVisitors,
                    current.leads
                ),
                "%",
                this.calculateConversionRate(
                    previous.uniqueVisitors,
                    previous.leads
                )
            ),
        ];
    }

    /**
     * Create a performance metric with trend
     */
    private static createMetric(
        name: string,
        current: number,
        unit: string,
        previous: number,
        lowerIsBetter: boolean = false
    ): PerformanceMetric {
        const change = this.calculatePercentageChange(current, previous);
        const trend = this.determineTrend(change, lowerIsBetter);

        return {
            name,
            value: current,
            unit,
            change,
            trend,
        };
    }

    /**
     * Calculate percentage change
     */
    private static calculatePercentageChange(
        current: number,
        previous: number
    ): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }

    /**
     * Determine trend direction
     */
    private static determineTrend(
        change: number,
        lowerIsBetter: boolean = false
    ): "up" | "down" | "flat" {
        const threshold = 2; // 2% threshold for flat
        if (Math.abs(change) < threshold) return "flat";

        if (lowerIsBetter) {
            return change < 0 ? "up" : "down";
        }
        return change > 0 ? "up" : "down";
    }

    /**
     * Calculate conversion rate
     */
    private static calculateConversionRate(
        total: number,
        converted: number
    ): number {
        if (total === 0) return 0;
        return (converted / total) * 100;
    }

    /**
     * Generate time series data
     */
    static generateTimeSeries(
        startDate: Date,
        endDate: Date,
        dataGenerator: (date: Date) => number
    ): TimeSeriesData[] {
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return days.map((date) => ({
            date: format(date, "MMM d"),
            value: dataGenerator(date),
        }));
    }

    /**
     * Calculate funnel stages
     */
    static calculateFunnel(stages: {
        visitors: number;
        viewed: number;
        contacted: number;
        qualified: number;
        converted: number;
    }): FunnelStage[] {
        const { visitors, viewed, contacted, qualified, converted } = stages;

        return [
            {
                name: "Visitors",
                count: visitors,
                percentage: 100,
            },
            {
                name: "Viewed Listing",
                count: viewed,
                percentage: this.calculateConversionRate(visitors, viewed),
                dropoff: visitors - viewed,
            },
            {
                name: "Contacted",
                count: contacted,
                percentage: this.calculateConversionRate(visitors, contacted),
                dropoff: viewed - contacted,
            },
            {
                name: "Qualified",
                count: qualified,
                percentage: this.calculateConversionRate(visitors, qualified),
                dropoff: contacted - qualified,
            },
            {
                name: "Converted",
                count: converted,
                percentage: this.calculateConversionRate(visitors, converted),
                dropoff: qualified - converted,
            },
        ];
    }

    /**
     * Analyze lead sources
     */
    static analyzeLeadSources(
        sources: Array<{
            source: string;
            leads: number;
            conversions: number;
            revenue: number;
            cost?: number;
        }>
    ): LeadSourceMetric[] {
        return sources.map((source) => ({
            source: source.source,
            leads: source.leads,
            conversions: source.conversions,
            conversionRate: this.calculateConversionRate(
                source.leads,
                source.conversions
            ),
            revenue: source.revenue,
            roi: source.cost
                ? ((source.revenue - source.cost) / source.cost) * 100
                : undefined,
        }));
    }

    /**
     * Rank listings by performance
     */
    static rankListings(
        listings: Array<{
            id: string;
            title: string;
            views: number;
            leads: number;
            avgTimeOnPage: number;
            shareCount: number;
        }>
    ): ListingPerformance[] {
        return listings
            .map((listing) => ({
                ...listing,
                conversionRate: this.calculateConversionRate(
                    listing.views,
                    listing.leads
                ),
            }))
            .sort((a, b) => b.conversionRate - a.conversionRate);
    }

    /**
     * Calculate trend prediction (simple linear regression)
     */
    static predictTrend(
        data: TimeSeriesData[],
        daysToPredict: number = 7
    ): TimeSeriesData[] {
        if (data.length < 2) return [];

        // Simple linear regression
        const n = data.length;
        const xValues = data.map((_, i) => i);
        const yValues = data.map((d) => d.value);

        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate predictions
        const predictions: TimeSeriesData[] = [];
        const lastDate = new Date(data[data.length - 1].date);

        for (let i = 1; i <= daysToPredict; i++) {
            const x = n + i - 1;
            const predictedValue = Math.max(
                0,
                Math.round(slope * x + intercept)
            );
            const predictedDate = new Date(lastDate);
            predictedDate.setDate(predictedDate.getDate() + i);

            predictions.push({
                date: format(predictedDate, "MMM d"),
                value: predictedValue,
                label: "predicted",
            });
        }

        return predictions;
    }

    /**
     * Calculate engagement score (0-100)
     */
    static calculateEngagementScore(metrics: {
        avgTimeOnPage: number; // seconds
        bounceRate: number; // percentage
        pagesPerSession: number;
        returnVisitorRate: number; // percentage
    }): number {
        const {
            avgTimeOnPage,
            bounceRate,
            pagesPerSession,
            returnVisitorRate,
        } = metrics;

        // Normalize each metric to 0-25 scale
        const timeScore = Math.min((avgTimeOnPage / 180) * 25, 25); // 3 min = full score
        const bounceScore = Math.max((100 - bounceRate) / 4, 0); // lower bounce = higher score
        const pagesScore = Math.min((pagesPerSession / 5) * 25, 25); // 5 pages = full score
        const returnScore = (returnVisitorRate / 100) * 25;

        return Math.round(timeScore + bounceScore + pagesScore + returnScore);
    }

    /**
     * Generate insights from data
     */
    static generateInsights(
        current: AnalyticsData,
        previous: AnalyticsData,
        sources: LeadSourceMetric[]
    ): string[] {
        const insights: string[] = [];

        // Lead generation insight
        const leadChange = this.calculatePercentageChange(
            current.leads,
            previous.leads
        );
        if (leadChange > 20) {
            insights.push(
                `📈 Lead generation is up ${Math.round(
                    leadChange
                )}% compared to last period`
            );
        } else if (leadChange < -20) {
            insights.push(
                `⚠️ Lead generation is down ${Math.abs(
                    Math.round(leadChange)
                )}% - consider increasing marketing efforts`
            );
        }

        // Conversion insight
        const currentCR = this.calculateConversionRate(
            current.leads,
            current.conversions
        );
        const previousCR = this.calculateConversionRate(
            previous.leads,
            previous.conversions
        );
        if (currentCR > previousCR + 5) {
            insights.push(
                `🎯 Conversion rate improved to ${currentCR.toFixed(
                    1
                )}% - keep up the good work!`
            );
        }

        // Response time insight
        if (current.avgResponseTime < 5) {
            insights.push(
                `⚡ Excellent response time! You're responding in under 5 minutes`
            );
        } else if (current.avgResponseTime > 60) {
            insights.push(
                `🐌 Response time is high (${Math.round(
                    current.avgResponseTime
                )} min) - faster responses increase conversions`
            );
        }

        // Best performing source
        if (sources.length > 0) {
            const bestSource = sources.reduce((best, current) =>
                current.conversionRate > best.conversionRate ? current : best
            );
            if (bestSource.conversionRate > 15) {
                insights.push(
                    `🌟 ${
                        bestSource.source
                    } is your best performing source at ${bestSource.conversionRate.toFixed(
                        1
                    )}% conversion rate`
                );
            }
        }

        // Traffic insight
        const trafficChange = this.calculatePercentageChange(
            current.uniqueVisitors,
            previous.uniqueVisitors
        );
        if (trafficChange > 30) {
            insights.push(
                `🚀 Traffic is surging! Up ${Math.round(
                    trafficChange
                )}% - great time to capture leads`
            );
        }

        return insights;
    }

    /**
     * Export data to CSV format
     */
    static exportToCSV(data: any[], filename: string): void {
        if (data.length === 0) return;

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
            headers.join(","), // Header row
            ...data.map((row) =>
                headers
                    .map((header) => JSON.stringify(row[header] || ""))
                    .join(",")
            ),
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${Date.now()}.csv`);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Track page views (client-side analytics)
export const trackPageView = (path: string) => {
    // Log page view
    console.log('[Analytics] Page view:', path);
    
    // Future: Send to analytics service
    // Example: Google Analytics, PostHog, etc.
    // gtag('event', 'page_view', { page_path: path });
};

// Export helper functions (bound to preserve `this` context)
export const calculateKPIs = AnalyticsEngine.calculateKPIs.bind(AnalyticsEngine);
export const generateTimeSeries = AnalyticsEngine.generateTimeSeries.bind(AnalyticsEngine);
export const calculateFunnel = AnalyticsEngine.calculateFunnel.bind(AnalyticsEngine);
export const analyzeLeadSources = AnalyticsEngine.analyzeLeadSources.bind(AnalyticsEngine);
export const rankListings = AnalyticsEngine.rankListings.bind(AnalyticsEngine);
export const predictTrend = AnalyticsEngine.predictTrend.bind(AnalyticsEngine);
export const calculateEngagementScore = AnalyticsEngine.calculateEngagementScore.bind(AnalyticsEngine);
export const generateInsights = AnalyticsEngine.generateInsights.bind(AnalyticsEngine);
export const exportToCSV = AnalyticsEngine.exportToCSV.bind(AnalyticsEngine);
