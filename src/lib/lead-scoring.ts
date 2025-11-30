/**
 * Lead Scoring System
 * Automatically calculates lead scores based on various factors
 */

interface LeadData {
    source: string;
    hasPhone: boolean;
    hasEmail: boolean;
    messageLength: number;
    listingViews?: number;
    timeOfDay?: number; // 0-23
    dayOfWeek?: number; // 0-6
    referrer?: string;
    pageViewCount?: number;
    timeOnSite?: number; // seconds
    hasViewedMultipleListings?: boolean;
    priceRange?: "low" | "medium" | "high";
}

export class LeadScoringSystem {
    // Base scores for different factors
    private static SOURCE_SCORES: Record<string, number> = {
        direct: 25,
        zillow: 20,
        realtor: 20,
        facebook: 15,
        instagram: 15,
        google: 20,
        referral: 30,
        website: 25,
        email: 15,
    };

    /**
     * Calculate lead score (0-100)
     */
    static calculateScore(data: LeadData): number {
        let score = 0;

        // 1. Source Quality (0-30 points)
        score += this.getSourceScore(data.source);

        // 2. Contact Information Quality (0-20 points)
        if (data.hasPhone) score += 15;
        if (data.hasEmail) score += 5;

        // 3. Message Quality (0-15 points)
        score += this.getMessageScore(data.messageLength);

        // 4. Engagement Level (0-25 points)
        score += this.getEngagementScore({
            listingViews: data.listingViews,
            pageViewCount: data.pageViewCount,
            timeOnSite: data.timeOnSite,
            hasViewedMultipleListings: data.hasViewedMultipleListings,
        });

        // 5. Timing (0-10 points)
        score += this.getTimingScore(data.timeOfDay, data.dayOfWeek);

        // Ensure score is between 0-100
        return Math.min(Math.max(Math.round(score), 0), 100);
    }

    /**
     * Determine lead priority based on score
     */
    static getPriority(score: number): "hot" | "warm" | "cold" {
        if (score >= 70) return "hot";
        if (score >= 40) return "warm";
        return "cold";
    }

    /**
     * Get recommended actions based on score and data
     */
    static getRecommendedActions(score: number, data: LeadData): string[] {
        const actions: string[] = [];

        if (score >= 70) {
            actions.push("📞 Call immediately");
            actions.push("⚡ Send personalized message within 5 minutes");
        } else if (score >= 40) {
            actions.push("✉️ Send email within 1 hour");
            actions.push("📋 Add to follow-up list");
        } else {
            actions.push("📧 Add to nurture campaign");
            actions.push("📊 Monitor engagement");
        }

        if (!data.hasPhone) {
            actions.push("📱 Request phone number");
        }

        if (data.hasViewedMultipleListings) {
            actions.push("🏘️ Suggest similar properties");
        }

        return actions;
    }

    /**
     * Calculate decay factor for lead age
     * Leads become less valuable over time
     */
    static calculateAgeDecay(createdAt: Date): number {
        const hoursSince =
            (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 1) return 1.0; // No decay in first hour
        if (hoursSince < 24) return 0.9; // 10% decay in first day
        if (hoursSince < 72) return 0.7; // 30% decay in first 3 days
        if (hoursSince < 168) return 0.5; // 50% decay in first week
        return 0.3; // 70% decay after a week
    }

    // Private helper methods

    private static getSourceScore(source: string): number {
        const normalizedSource = source.toLowerCase();
        return this.SOURCE_SCORES[normalizedSource] || 10;
    }

    private static getMessageScore(length: number): number {
        if (length === 0) return 0;
        if (length < 10) return 3;
        if (length < 50) return 7;
        if (length < 200) return 12;
        return 15;
    }

    private static getEngagementScore(data: {
        listingViews?: number;
        pageViewCount?: number;
        timeOnSite?: number;
        hasViewedMultipleListings?: boolean;
    }): number {
        let score = 0;

        // Listing views (0-8 points)
        if (data.listingViews) {
            if (data.listingViews >= 5) score += 8;
            else if (data.listingViews >= 3) score += 5;
            else if (data.listingViews >= 1) score += 3;
        }

        // Page view count (0-7 points)
        if (data.pageViewCount) {
            if (data.pageViewCount >= 10) score += 7;
            else if (data.pageViewCount >= 5) score += 4;
            else if (data.pageViewCount >= 2) score += 2;
        }

        // Time on site (0-5 points)
        if (data.timeOnSite) {
            const minutes = data.timeOnSite / 60;
            if (minutes >= 10) score += 5;
            else if (minutes >= 5) score += 3;
            else if (minutes >= 2) score += 1;
        }

        // Multiple listings viewed (5 points bonus)
        if (data.hasViewedMultipleListings) score += 5;

        return Math.min(score, 25);
    }

    private static getTimingScore(
        timeOfDay?: number,
        dayOfWeek?: number
    ): number {
        let score = 5; // Base score

        // Time of day scoring (business hours get bonus)
        if (timeOfDay !== undefined) {
            // 9 AM - 5 PM gets bonus
            if (timeOfDay >= 9 && timeOfDay <= 17) {
                score += 3;
            }
            // 7 AM - 9 PM is acceptable
            else if (timeOfDay >= 7 && timeOfDay <= 21) {
                score += 1;
            }
        }

        // Day of week scoring (weekdays get bonus)
        if (dayOfWeek !== undefined) {
            // Monday-Friday
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                score += 2;
            }
        }

        return Math.min(score, 10);
    }

    /**
     * Analyze lead and provide insights
     */
    static analyzeLead(data: LeadData & { createdAt: Date }): {
        score: number;
        priority: "hot" | "warm" | "cold";
        ageDecay: number;
        adjustedScore: number;
        actions: string[];
        insights: string[];
    } {
        const baseScore = this.calculateScore(data);
        const ageDecay = this.calculateAgeDecay(data.createdAt);
        const adjustedScore = Math.round(baseScore * ageDecay);
        const priority = this.getPriority(adjustedScore);
        const actions = this.getRecommendedActions(adjustedScore, data);
        const insights = this.generateInsights(data, baseScore);

        return {
            score: baseScore,
            priority,
            ageDecay,
            adjustedScore,
            actions,
            insights,
        };
    }

    private static generateInsights(data: LeadData, score: number): string[] {
        const insights: string[] = [];

        if (score >= 70) {
            insights.push(
                "🔥 High-quality lead - prioritize immediate response"
            );
        }

        if (data.hasViewedMultipleListings) {
            insights.push(
                "👀 Actively shopping - comparing multiple properties"
            );
        }

        if (data.messageLength > 100) {
            insights.push("📝 Detailed inquiry - shows serious interest");
        }

        if (data.hasPhone && data.hasEmail) {
            insights.push("📞 Complete contact info - easy to reach");
        }

        if (data.source === "referral") {
            insights.push(
                "👥 Referred lead - typically higher conversion rate"
            );
        }

        if ((data.pageViewCount || 0) > 5) {
            insights.push(
                "🔍 High engagement - spent significant time browsing"
            );
        }

        if (!insights.length) {
            insights.push("ℹ️ Standard lead - follow normal nurture process");
        }

        return insights;
    }
}

// Export convenience functions (bound to preserve `this` context)
export const calculateLeadScore = LeadScoringSystem.calculateScore.bind(LeadScoringSystem);
export const getLeadPriority = LeadScoringSystem.getPriority.bind(LeadScoringSystem);
export const analyzeLead = LeadScoringSystem.analyzeLead.bind(LeadScoringSystem);
